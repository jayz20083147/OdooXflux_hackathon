import { addFrequency, type Frequency } from "@/lib/constants";

/**
 * Pure billing helpers: period maths and the tax/discount engine.
 * No database access — the caller supplies lines and rules so this module can
 * be used from server actions, pages and tests alike.
 */

export type BillingLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productId?: string | null;
  category?: string | null;
};

export type TaxRuleLike = {
  id: string;
  name: string;
  rate: number;
  scope: string; // ALL | CATEGORY | PRODUCT
  scopeValue: string | null;
  active: boolean;
};

export type DiscountRuleLike = {
  id: string;
  name: string;
  code: string | null;
  kind: string; // FIXED | PERCENT
  value: number;
  minSubtotal: number;
  minQuantity: number;
  scope: string;
  scopeValue: string | null;
  maxUses: number;
  usedCount: number;
  validFrom: Date | null;
  validTo: Date | null;
  active: boolean;
};

export type AppliedTax = { name: string; rate: number; amount: number };
export type AppliedDiscount = {
  ruleId: string;
  name: string;
  kind: string;
  value: number;
  amount: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  taxes: AppliedTax[];
  discounts: AppliedDiscount[];
};

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Sum of the line amounts whose product matches the rule's scope. */
function scopeBase(
  lines: BillingLine[],
  scope: string,
  scopeValue: string | null,
): number {
  if (scope === "ALL" || !scopeValue) {
    return lines.reduce((sum, line) => sum + line.amount, 0);
  }
  if (scope === "CATEGORY") {
    return lines
      .filter((line) => (line.category ?? "") === scopeValue)
      .reduce((sum, line) => sum + line.amount, 0);
  }
  if (scope === "PRODUCT") {
    return lines
      .filter((line) => line.productId === scopeValue)
      .reduce((sum, line) => sum + line.amount, 0);
  }
  return 0;
}

/**
 * Selects the discount rules that currently apply to the given lines and
 * computes their amounts. Conditions honoured: active, validity window,
 * minSubtotal, minQuantity and maxUses (0 = unlimited).
 */
export function computeDiscounts(
  lines: BillingLine[],
  rules: DiscountRuleLike[],
  now: Date = new Date(),
  couponCode?: string | null,
): { discounts: AppliedDiscount[]; total: number } {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.amount, 0));
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);

  const discounts: AppliedDiscount[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;
    // Rules with a coupon code require a matching user coupon code
    if (rule.code) {
      if (!couponCode || rule.code.trim().toUpperCase() !== couponCode.trim().toUpperCase()) {
        continue;
      }
    }
    if (rule.validFrom && now < rule.validFrom) continue;
    if (rule.validTo && now > rule.validTo) continue;
    if (rule.maxUses > 0 && rule.usedCount >= rule.maxUses) continue;
    if (rule.minSubtotal > 0 && subtotal < rule.minSubtotal) continue;
    if (rule.minQuantity > 0 && quantity < rule.minQuantity) continue;

    const base = scopeBase(lines, rule.scope, rule.scopeValue);
    if (base <= 0) continue;

    const amount =
      rule.kind === "FIXED" ? Math.min(rule.value, base) : (base * rule.value) / 100;

    if (amount <= 0) continue;

    discounts.push({
      ruleId: rule.id,
      name: rule.name,
      kind: rule.kind,
      value: rule.value,
      amount: round2(amount),
    });
  }

  // Sort largest first and never discount below zero.
  discounts.sort((a, b) => b.amount - a.amount);
  let remaining = subtotal;
  for (const discount of discounts) {
    discount.amount = round2(Math.min(discount.amount, remaining));
    remaining = round2(remaining - discount.amount);
  }

  const total = round2(discounts.reduce((sum, d) => sum + d.amount, 0));
  return { discounts, total };
}

/**
 * Computes taxes on the post-discount taxable base. Each rule only taxes the
 * portion of the subtotal that matches its scope.
 */
export function computeTaxes(
  lines: BillingLine[],
  rules: TaxRuleLike[],
  discountTotal = 0,
): { taxes: AppliedTax[]; total: number } {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.amount, 0));
  const taxable = round2(Math.max(subtotal - discountTotal, 0));
  const ratio = subtotal > 0 ? taxable / subtotal : 1;

  const taxes: AppliedTax[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;
    const base = scopeBase(lines, rule.scope, rule.scopeValue) * ratio;
    if (base <= 0) continue;
    const amount = round2((base * rule.rate) / 100);
    if (amount <= 0) continue;
    taxes.push({ name: rule.name, rate: rule.rate, amount });
  }

  const total = round2(taxes.reduce((sum, tax) => sum + tax.amount, 0));
  return { taxes, total };
}

/** Full engine: subtotal -> discounts -> taxes -> total. */
export function computeInvoiceTotals(
  lines: BillingLine[],
  taxRules: TaxRuleLike[],
  discountRules: DiscountRuleLike[],
  now: Date = new Date(),
  couponCode?: string | null,
): InvoiceTotals {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.amount, 0));
  const { discounts, total: discountTotal } = computeDiscounts(lines, discountRules, now, couponCode);
  const { taxes, total: taxTotal } = computeTaxes(lines, taxRules, discountTotal);
  const total = round2(Math.max(subtotal - discountTotal + taxTotal, 0));

  return { subtotal, discountTotal, taxTotal, total, taxes, discounts };
}

// --------------------------------------------------------------- period math

export type PeriodInput = {
  startDate: Date;
  frequency: Frequency;
  periodStart: Date | null;
  periodEnd: Date | null;
};

/** Returns the current billing period, seeding it from the start date if unset. */
export function resolvePeriod(input: PeriodInput): { start: Date; end: Date } {
  if (input.periodStart && input.periodEnd) {
    return { start: input.periodStart, end: input.periodEnd };
  }
  const start = input.periodStart ?? input.startDate;
  return { start, end: addFrequency(start, input.frequency) };
}

export type DueInput = {
  status: string;
  pausedAt: Date | null;
  endDate: Date | null;
  currentPeriodEnd: Date | null;
  startDate: Date;
  frequency: Frequency;
  autoRenew: boolean;
};

/** Whether a subscription should be billed for its next period right now. */
export function isSubscriptionDue(input: DueInput, now: Date = new Date()): boolean {
  if (input.status !== "ACTIVE") return false;
  if (input.pausedAt) return false;
  const period = resolvePeriod({
    startDate: input.startDate,
    frequency: input.frequency,
    periodStart: null,
    periodEnd: input.currentPeriodEnd,
  });
  return period.end <= now;
}
