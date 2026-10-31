import {
  addFrequency,
  type Frequency,
} from "@/lib/constants";
import {
  computeInvoiceTotals,
  resolvePeriod,
  round2,
  type BillingLine,
} from "@/lib/billing";
import { prisma } from "@/lib/prisma";

/** Loads the tax + discount rules that the engine should consider. */
export async function loadRules() {
  const [taxRules, discountRules] = await Promise.all([
    prisma.taxRule.findMany({ where: { active: true } }),
    prisma.discountRule.findMany({ where: { active: true } }),
  ]);
  return { taxRules, discountRules };
}

export function lineToBilling(line: {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productId?: string | null;
  product?: { category: string | null } | null;
}): BillingLine {
  return {
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    amount: line.amount,
    productId: line.productId ?? null,
    category: line.product?.category ?? null,
  };
}

/** Recomputes a subscription's snapshot totals from its lines + active rules. */
export async function recalcSubscriptionTotals(
  subscriptionId: string,
  now: Date = new Date(),
  couponCode?: string | null,
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { lines: { include: { product: { select: { category: true } } } } },
  });
  if (!subscription) return null;

  const lines = subscription.lines.map(lineToBilling);
  const { taxRules, discountRules } = await loadRules();
  const totals = computeInvoiceTotals(lines, taxRules, discountRules, now, couponCode);

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
    },
  });

  return totals;
}

async function nextInvoiceNumber(): Promise<string> {
  const last = await prisma.invoice.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const n = last ? parseInt(last.number.replace(/\D/g, ""), 10) + 1 : 1;
  return `INV-${String(Number.isFinite(n) ? n : 1).padStart(4, "0")}`;
}

export type GenerateResult = {
  created: number;
  skipped: number;
  closed: number;
  invoiceNumbers: string[];
};

/**
 * Generates invoices for every due ACTIVE subscription.
 *
 * Idempotent: an invoice is keyed by (subscriptionId, periodStart, periodEnd),
 * so running this repeatedly never double-bills a period.
 */
export async function generateDueInvoices(
  now: Date = new Date(),
): Promise<GenerateResult> {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    include: {
      plan: true,
      lines: { include: { product: { select: { category: true } } } },
    },
  });

  const { taxRules, discountRules } = await loadRules();

  let created = 0;
  let skipped = 0;
  let closed = 0;
  const invoiceNumbers: string[] = [];

  for (const sub of subscriptions) {
    if (sub.pausedAt) continue;
    if (sub.lines.length === 0) continue;

    const frequency = (sub.plan?.frequency ?? "MONTHLY") as Frequency;
    let { start, end } = resolvePeriod({
      startDate: sub.startDate,
      frequency,
      periodStart: sub.currentPeriodStart,
      periodEnd: sub.currentPeriodEnd,
    });

    let effectiveEnd = sub.endDate ?? sub.plan?.endDate ?? null;
    let renewCount = sub.renewCount;
    let shouldClose = false;
    let closedReason: string | null = null;
    let guard = 0;

    while (end <= now && guard < 240) {
      if (effectiveEnd && start >= effectiveEnd) {
        if (sub.plan?.autoRenew) {
          effectiveEnd = addFrequency(effectiveEnd, frequency);
          renewCount += 1;
        } else {
          shouldClose = true;
          closedReason = sub.plan?.autoClose
            ? "Auto-closed at plan end date"
            : "Closed at plan end date";
          break;
        }
      }

      const existing = await prisma.invoice.findUnique({
        where: {
          subscriptionId_periodStart_periodEnd: {
            subscriptionId: sub.id,
            periodStart: start,
            periodEnd: end,
          },
        },
        select: { id: true },
      });

      if (existing) {
        skipped += 1;
      } else {
        const lines = sub.lines.map(lineToBilling);
        const totals = computeInvoiceTotals(lines, taxRules, discountRules, now);
        const number = await nextInvoiceNumber();
        const dueAt = new Date(start.getTime());
        dueAt.setDate(dueAt.getDate() + 14);

        await prisma.$transaction(async (tx) => {
          const invoice = await tx.invoice.create({
            data: {
              number,
              subscriptionId: sub.id,
              customerId: sub.customerId,
              status: "DRAFT",
              periodStart: start,
              periodEnd: end,
              dueAt,
              subtotal: totals.subtotal,
              taxTotal: totals.taxTotal,
              discountTotal: totals.discountTotal,
              total: totals.total,
              lines: {
                create: lines.map((line) => ({
                  description: line.description,
                  quantity: line.quantity,
                  unitPrice: line.unitPrice,
                  amount: round2(line.amount),
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

          // Track discount usage + bump the rule counters.
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

        created += 1;
        invoiceNumbers.push(number);
      }

      start = end;
      end = addFrequency(end, frequency);
      guard += 1;
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        currentPeriodStart: start,
        currentPeriodEnd: end,
        endDate: effectiveEnd,
        renewCount,
        ...(shouldClose
          ? { status: "CLOSED", closedAt: now, closedReason }
          : {}),
      },
    });

    if (shouldClose) {
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: sub.id,
          type: "AUTO_CLOSE",
          status: "CLOSED",
          note: closedReason ?? undefined,
        },
      });
      closed += 1;
    }
  }

  return { created, skipped, closed, invoiceNumbers };
}
