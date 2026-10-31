import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { addFrequency, type Frequency } from "@/lib/constants";
import { computeInvoiceTotals, round2 } from "@/lib/billing";
import { loadRules, recalcSubscriptionTotals } from "@/lib/billing-service";
import { prisma } from "@/lib/prisma";

async function nextReference(): Promise<string> {
  const last = await prisma.subscription.findFirst({
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const n = last ? parseInt(last.reference.replace(/\D/g, ""), 10) + 1 : 1;
  return `SUB-${String(Number.isFinite(n) ? n : 1).padStart(4, "0")}`;
}

async function nextInvoiceNumber(): Promise<string> {
  const last = await prisma.invoice.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const n = last ? parseInt(last.number.replace(/\D/g, ""), 10) + 1 : 1;
  return `INV-${String(Number.isFinite(n) ? n : 1).padStart(4, "0")}`;
}

export function formatSubscription(sub: any) {
  return {
    ...sub,
    subscriptionNumber: sub.reference,
    recurringTotal: sub.total,
    discountAmount: sub.discountTotal,
    unitPrice: sub.lines?.[0]?.unitPrice ?? 0,
  };
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerIdParam = searchParams.get("customerId");

    const where: any = {};
    if (session.user.role === "CUSTOMER") {
      where.customerId = session.user.id;
    } else if (customerIdParam) {
      where.customerId = customerIdParam;
    }

    const rawSubscriptions = await prisma.subscription.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: true,
        lines: { include: { variant: true } },
        invoices: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const subscriptions = rawSubscriptions.map(formatSubscription);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Customer Isolation: customers can only subscribe for themselves
    let targetCustomerId = session.user.id;
    if (session.user.role !== "CUSTOMER" && body.customerId && body.customerId !== "self") {
      targetCustomerId = body.customerId;
    }

    const planId = body.planId;
    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { product: { include: { variants: true } } },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const variantId = body.variantId || null;
    const variant = variantId
      ? plan.product?.variants.find((v) => v.id === variantId) ?? null
      : null;

    const quantity = Math.max(plan.minQuantity || 1, parseInt(body.quantity ?? 1, 10) || 1);
    const surcharge = variant?.surcharge ?? 0;
    const unitPrice = round2(plan.price + surcharge);
    const amount = round2(quantity * unitPrice);

    const frequency = plan.frequency as Frequency;
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const currentPeriodStart = startDate;
    const currentPeriodEnd = addFrequency(startDate, frequency);

    const description = [
      plan.name,
      plan.product ? `· ${plan.product.name}` : null,
      variant ? `(${variant.value})` : null,
    ]
      .filter(Boolean)
      .join(" ");

    const ref = await nextReference();

    const subscription = await prisma.subscription.create({
      data: {
        reference: ref,
        customerId: targetCustomerId,
        planId: plan.id,
        status: "ACTIVE",
        quantity,
        startDate,
        endDate: plan.endDate,
        currentPeriodStart,
        currentPeriodEnd,
        lines: {
          create: [
            {
              productId: plan.productId,
              variantId: variant?.id ?? null,
              description,
              quantity,
              unitPrice,
              amount,
            },
          ],
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: true,
        lines: true,
      },
    });

    await recalcSubscriptionTotals(subscription.id);
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        type: "CREATE",
        status: "ACTIVE",
        actorId: session.user.id,
        note: `Subscription provisioned (${ref})`,
      },
    });

    // Generate initial invoice if requested (default true)
    let initialInvoice = null;
    if (body.generateFirstInvoice !== false) {
      const { taxRules, discountRules } = await loadRules();
      const billingLines = [
        {
          description,
          quantity,
          unitPrice,
          amount,
          productId: plan.productId,
          category: plan.product?.category ?? null,
        },
      ];
      const totals = computeInvoiceTotals(billingLines, taxRules, discountRules, startDate);
      const invNumber = await nextInvoiceNumber();
      const dueAt = new Date(startDate.getTime());
      dueAt.setDate(dueAt.getDate() + 14);

      initialInvoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            number: invNumber,
            subscriptionId: subscription.id,
            customerId: targetCustomerId,
            status: "CONFIRMED",
            periodStart: currentPeriodStart,
            periodEnd: currentPeriodEnd,
            issuedAt: startDate,
            dueAt,
            subtotal: totals.subtotal,
            taxTotal: totals.taxTotal,
            discountTotal: totals.discountTotal,
            total: totals.total,
            lines: {
              create: billingLines.map((l) => ({
                description: l.description,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                amount: round2(l.amount),
              })),
            },
            taxes: { create: totals.taxes },
            discounts: {
              create: totals.discounts.map((d) => ({
                name: d.name,
                kind: d.kind,
                value: d.value,
                amount: d.amount,
              })),
            },
          },
        });

        for (const applied of totals.discounts) {
          await tx.discountUsage.create({
            data: {
              discountRuleId: applied.ruleId,
              invoiceId: inv.id,
              amount: applied.amount,
            },
          });
          await tx.discountRule.update({
            where: { id: applied.ruleId },
            data: { usedCount: { increment: 1 } },
          });
        }

        return inv;
      });
    }

    const reloaded = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: true,
        lines: true,
        invoices: true,
      },
    });

    return NextResponse.json(
      {
        subscription: formatSubscription(reloaded),
        invoice: initialInvoice,
        message: "Subscription created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
