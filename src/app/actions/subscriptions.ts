"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import {
  addFrequency,
  isSubscriptionStatus,
  SUBSCRIPTION_TRANSITIONS,
  type Frequency,
  type SubscriptionStatus,
} from "@/lib/constants";
import { round2, computeInvoiceTotals } from "@/lib/billing";
import { recalcSubscriptionTotals, loadRules } from "@/lib/billing-service";
import { type FormState } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { subscriptionSchema } from "@/lib/validators";

function revalidateSubscriptions(id?: string) {
  revalidatePath("/admin/subscriptions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  if (id) {
    revalidatePath(`/admin/subscriptions/${id}`);
    revalidatePath(`/dashboard/subscriptions/${id}`);
  }
}

function parseLines(raw: FormDataEntryValue | null): unknown[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseSubscriptionForm(formData: FormData) {
  const endDateRaw = formData.get("endDate");
  return subscriptionSchema.safeParse({
    customerId: formData.get("customerId"),
    planId: formData.get("planId") ?? "",
    templateId: formData.get("templateId") ?? "",
    status: formData.get("status") ?? "DRAFT",
    startDate: formData.get("startDate"),
    endDate:
      typeof endDateRaw === "string" && endDateRaw.trim() !== ""
        ? endDateRaw
        : null,
    notes: formData.get("notes") ?? "",
    lines: parseLines(formData.get("lines")),
  });
}

async function nextReference(): Promise<string> {
  const last = await prisma.subscription.findFirst({
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const n = last ? parseInt(last.reference.replace(/\D/g, ""), 10) + 1 : 1;
  return `SUB-${String(Number.isFinite(n) ? n : 1).padStart(4, "0")}`;
}

function lineCreateData(
  lines: { productId: string | null; variantId: string | null; description: string; quantity: number; unitPrice: number }[],
) {
  return lines.map((line) => ({
    productId: line.productId,
    variantId: line.variantId,
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    amount: round2(line.quantity * line.unitPrice),
  }));
}

export async function createSubscriptionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (user.role === "CUSTOMER") redirect("/forbidden");

  const parsed = parseSubscriptionForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { customerId, planId, templateId, status, startDate, endDate, notes, lines } =
    parsed.data;

  if (endDate && endDate < startDate) {
    return {
      status: "error",
      message: "End date must be after the start date.",
      errors: { endDate: ["End date must be after the start date"] },
    };
  }

  const plan = planId ? await prisma.plan.findUnique({ where: { id: planId } }) : null;
  const frequency = (plan?.frequency ?? "MONTHLY") as Frequency;
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);

  const created = await prisma.subscription.create({
    data: {
      reference: await nextReference(),
      customerId,
      planId,
      templateId,
      status,
      startDate,
      endDate,
      notes,
      quantity,
      currentPeriodStart: status === "ACTIVE" ? startDate : null,
      currentPeriodEnd: status === "ACTIVE" ? addFrequency(startDate, frequency) : null,
      lines: { create: lineCreateData(lines) },
    },
  });

  await recalcSubscriptionTotals(created.id);
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: created.id,
      type: "CREATE",
      status,
      actorId: user.id,
    },
  });

  revalidateSubscriptions();
  redirect(`/admin/subscriptions/${created.id}`);
}

export async function updateSubscriptionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (user.role === "CUSTOMER") redirect("/forbidden");

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing subscription id." };

  const parsed = parseSubscriptionForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { customerId, planId, templateId, status, startDate, endDate, notes, lines } =
    parsed.data;

  if (endDate && endDate < startDate) {
    return {
      status: "error",
      message: "End date must be after the start date.",
      errors: { endDate: ["End date must be after the start date"] },
    };
  }

  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id },
      data: {
        customerId,
        planId,
        templateId,
        status,
        startDate,
        endDate,
        notes,
        quantity,
      },
    });
    await tx.subscriptionLine.deleteMany({ where: { subscriptionId: id } });
    await tx.subscriptionLine.createMany({
      data: lineCreateData(lines).map((line) => ({ ...line, subscriptionId: id })),
    });
  });

  await recalcSubscriptionTotals(id);
  revalidateSubscriptions(id);
  redirect(`/admin/subscriptions/${id}`);
}

export async function deleteSubscriptionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role === "CUSTOMER") redirect("/forbidden");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.subscription.delete({ where: { id } });
  }
  revalidateSubscriptions();
}

/** Loads a subscription and checks the acting user may operate on it. */
async function loadForActor(id: string) {
  const user = await requireUser();
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true, template: true },
  });
  if (!subscription) return null;
  const isStaff = user.role === "ADMIN" || user.role === "STAFF";
  if (!isStaff && subscription.customerId !== user.id) redirect("/forbidden");
  return { user, subscription, isStaff };
}

/** Advances the subscription through the status machine (DRAFT→…→CLOSED). */
export async function transitionSubscriptionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "");
  const loaded = await loadForActor(id);
  if (!loaded) return;
  const { user, subscription } = loaded;

  if (!isSubscriptionStatus(to)) return;
  const from = subscription.status as SubscriptionStatus;
  const allowed = SUBSCRIPTION_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) return;

  const frequency = (subscription.plan?.frequency ?? "MONTHLY") as Frequency;
  const data: Prisma.SubscriptionUpdateInput = { status: to };

  if (to === "QUOTATION") {
    const validityDays = subscription.template?.validityDays ?? 30;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);
    data.quotationValidUntil = validUntil;
  }

  if (to === "ACTIVE") {
    if (!subscription.currentPeriodStart) {
      data.currentPeriodStart = subscription.startDate;
      data.currentPeriodEnd = addFrequency(subscription.startDate, frequency);
    }
    data.pausedAt = null;
    data.resumeAt = null;
  }

  if (to === "CLOSED") {
    data.closedAt = new Date();
    data.closedReason = "Closed manually";
  }

  await prisma.subscription.update({ where: { id }, data });
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: id,
      type: `${from}->${to}`,
      status: to,
      actorId: user.id,
    },
  });

  if (to === "QUOTATION") {
    await recalcSubscriptionTotals(id);
  }

  revalidateSubscriptions(id);
}

export async function pauseSubscriptionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const loaded = await loadForActor(id);
  if (!loaded) return;
  const { user, subscription } = loaded;

  if (!subscription.plan?.pauseAllowed) return;
  if (subscription.status !== "ACTIVE" || subscription.pausedAt) return;

  const resumeRaw = formData.get("resumeAt");
  const resumeAt =
    typeof resumeRaw === "string" && resumeRaw.trim() !== ""
      ? new Date(resumeRaw)
      : null;

  await prisma.subscription.update({
    where: { id },
    data: { pausedAt: new Date(), resumeAt },
  });
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: id,
      type: "PAUSED",
      status: subscription.status,
      note: resumeAt ? `Resumes ${resumeAt.toISOString().slice(0, 10)}` : undefined,
      actorId: user.id,
    },
  });

  revalidateSubscriptions(id);
}

export async function resumeSubscriptionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const loaded = await loadForActor(id);
  if (!loaded) return;
  const { user, subscription } = loaded;

  if (subscription.status !== "ACTIVE" || !subscription.pausedAt) return;

  await prisma.subscription.update({
    where: { id },
    data: { pausedAt: null, resumeAt: null },
  });
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: id,
      type: "RESUMED",
      status: subscription.status,
      actorId: user.id,
    },
  });

  revalidateSubscriptions(id);
}

/** Early close: allowed only when the plan enables it and the window is open. */
export async function earlyCloseSubscriptionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const loaded = await loadForActor(id);
  if (!loaded) return;
  const { user, subscription } = loaded;

  const plan = subscription.plan;
  if (!plan?.earlyClose) return;
  if (subscription.status !== "ACTIVE") return;

  const endDate = subscription.endDate ?? plan.endDate;
  if (endDate && plan.earlyCloseDays > 0) {
    const opensAt = new Date(endDate);
    opensAt.setDate(opensAt.getDate() - plan.earlyCloseDays);
    if (new Date() < opensAt) return;
  }

  await prisma.subscription.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedReason: "Early close requested",
    },
  });
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: id,
      type: "EARLY_CLOSE",
      status: "CLOSED",
      actorId: user.id,
    },
  });

  revalidateSubscriptions(id);
}

/** Renew: extends the subscription window by one billing period. */
export async function renewSubscriptionAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const loaded = await loadForActor(id);
  if (!loaded) return;
  const { user, subscription, isStaff } = loaded;

  if (!isStaff && !subscription.plan?.autoRenew) return;

  const frequency = (subscription.plan?.frequency ?? "MONTHLY") as Frequency;
  const currentEnd =
    subscription.endDate ??
    subscription.plan?.endDate ??
    subscription.currentPeriodEnd ??
    subscription.startDate;
  const newEnd = addFrequency(currentEnd, frequency);

  await prisma.subscription.update({
    where: { id },
    data: {
      endDate: newEnd,
      renewCount: { increment: 1 },
      ...(subscription.status === "CLOSED"
        ? { status: "ACTIVE", closedAt: null, closedReason: null }
        : {}),
    },
  });
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: id,
      type: "RENEW",
      status: "ACTIVE",
      note: `Extended to ${newEnd.toISOString().slice(0, 10)}`,
      actorId: user.id,
    },
  });

  revalidateSubscriptions(id);
}

/** Customer self-service subscription action from the catalog. */
export async function customerSubscribeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const planId = String(formData.get("planId") ?? "");
  const variantId = String(formData.get("variantId") ?? "") || null;
  const quantity = Math.max(1, parseInt(String(formData.get("quantity") ?? "1"), 10) || 1);

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { product: { include: { variants: true } } },
  });
  if (!plan) {
    return { status: "error", message: "Selected plan not found." };
  }
  if (quantity < plan.minQuantity) {
    return { status: "error", message: `Minimum quantity is ${plan.minQuantity}.` };
  }

  const variant = variantId
    ? plan.product?.variants.find((v) => v.id === variantId) ?? null
    : null;

  const surcharge = variant?.surcharge ?? 0;
  const unitPrice = round2(plan.price + surcharge);
  const amount = round2(quantity * unitPrice);

  const frequency = plan.frequency as Frequency;
  const startDate = new Date();
  const currentPeriodStart = startDate;
  const currentPeriodEnd = addFrequency(startDate, frequency);

  const description = [
    plan.name,
    plan.product ? `· ${plan.product.name}` : null,
    variant ? `(${variant.value})` : null,
  ].filter(Boolean).join(" ");

  const ref = await nextReference();

  const subscription = await prisma.subscription.create({
    data: {
      reference: ref,
      customerId: user.id,
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
  });

  await recalcSubscriptionTotals(subscription.id);
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: subscription.id,
      type: "CREATE",
      status: "ACTIVE",
      actorId: user.id,
      note: "Self-service customer subscription checkout",
    },
  });

  // Automatically generate initial invoice for immediate billing
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

  const lastInv = await prisma.invoice.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const invN = lastInv ? parseInt(lastInv.number.replace(/\D/g, ""), 10) + 1 : 1;
  const invNumber = `INV-${String(Number.isFinite(invN) ? invN : 1).padStart(4, "0")}`;
  const dueAt = new Date(startDate.getTime());
  dueAt.setDate(dueAt.getDate() + 14);

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        number: invNumber,
        subscriptionId: subscription.id,
        customerId: user.id,
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
          invoiceId: invoice.id,
          amount: applied.amount,
        },
      });
      await tx.discountRule.update({
        where: { id: applied.ruleId },
        data: { usedCount: { increment: 1 } },
      });
    }
  });

  revalidateSubscriptions();
  redirect(`/dashboard/subscriptions/${subscription.id}`);
}
