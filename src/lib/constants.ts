export const ROLES = ["ADMIN", "STAFF", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

export const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const PLAN_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const VARIANT_TYPES = ["BRAND", "SIZE", "COLOR", "PACK", "FLAVOR"] as const;
export type VariantType = (typeof VARIANT_TYPES)[number];

// ------------------------------------------------------- subscriptions
export const SUBSCRIPTION_STATUSES = [
  "DRAFT",
  "QUOTATION",
  "CONFIRMED",
  "ACTIVE",
  "CLOSED",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Allowed forward transitions in the subscription status machine. */
export const SUBSCRIPTION_TRANSITIONS: Record<
  SubscriptionStatus,
  SubscriptionStatus[]
> = {
  DRAFT: ["QUOTATION"],
  QUOTATION: ["CONFIRMED", "DRAFT"],
  CONFIRMED: ["ACTIVE", "QUOTATION"],
  ACTIVE: ["CLOSED"],
  CLOSED: [],
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  DRAFT: "Draft",
  QUOTATION: "Quotation",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active",
  CLOSED: "Closed",
};

export const INVOICE_STATUSES = [
  "DRAFT",
  "CONFIRMED",
  "CANCELLED",
  "PAID",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  PAID: "Paid",
};

// ---------------------------------------------------------------- payments
export const PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "UPI",
  "CHEQUE",
  "OTHER",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  UPI: "UPI",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

/**
 * Derived payment state of an invoice, combining its lifecycle status with the
 * amount of money already recorded against it.
 *   DRAFT / CANCELLED   — not yet issued / void
 *   PAID                — fully settled (paidAmount >= total)
 *   OVERDUE             — past due date and not fully settled
 *   PARTIAL             — some money recorded but not overdue
 *   OUTSTANDING         — issued, nothing recorded, not yet due
 */
export const INVOICE_PAYMENT_STATES = [
  "DRAFT",
  "CANCELLED",
  "OUTSTANDING",
  "PARTIAL",
  "OVERDUE",
  "PAID",
] as const;
export type InvoicePaymentState = (typeof INVOICE_PAYMENT_STATES)[number];

export const INVOICE_PAYMENT_STATE_LABEL: Record<InvoicePaymentState, string> = {
  DRAFT: "Draft",
  CANCELLED: "Cancelled",
  OUTSTANDING: "Outstanding",
  PARTIAL: "Partial",
  OVERDUE: "Overdue",
  PAID: "Paid",
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Outstanding balance of an invoice (never negative; 0 once cancelled). */
export function invoiceBalance(invoice: {
  total: number;
  paidAmount: number;
  status?: string;
}): number {
  if (invoice.status === "CANCELLED") return 0;
  return roundMoney(Math.max(0, invoice.total - invoice.paidAmount));
}

export function invoicePaymentState(
  invoice: {
    status: string;
    total: number;
    paidAmount: number;
    dueAt: Date | string | null;
  },
  now: Date = new Date(),
): InvoicePaymentState {
  if (invoice.status === "CANCELLED") return "CANCELLED";
  if (invoice.status === "DRAFT") return "DRAFT";
  if (invoice.total > 0 && invoice.paidAmount >= invoice.total - 0.005) {
    return "PAID";
  }
  const due = invoice.dueAt ? new Date(invoice.dueAt) : null;
  if (due && due.getTime() < now.getTime()) return "OVERDUE";
  if (invoice.paidAmount > 0) return "PARTIAL";
  return "OUTSTANDING";
}

export const TAX_SCOPES = ["ALL", "CATEGORY", "PRODUCT"] as const;
export type TaxScope = (typeof TAX_SCOPES)[number];

export const DISCOUNT_KINDS = ["FIXED", "PERCENT"] as const;
export type DiscountKind = (typeof DISCOUNT_KINDS)[number];

export const DISCOUNT_SCOPES = ["ALL", "CATEGORY", "PRODUCT"] as const;
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];

export const FREQUENCY_MULTIPLIER: Record<Frequency, number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  YEARLY: 365,
};

export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return (
    typeof value === "string" &&
    (SUBSCRIPTION_STATUSES as readonly string[]).includes(value)
  );
}

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return (
    typeof value === "string" && (INVOICE_STATUSES as readonly string[]).includes(value)
  );
}

/** Advances a date by one billing period for the given frequency. */
export function addFrequency(date: Date, frequency: Frequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setDate(next.getDate() + 30);
  }
  return next;
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  CUSTOMER: "Customer",
};

/** Landing page for each role after signing in. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  STAFF: "/admin",
  CUSTOMER: "/dashboard",
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

/** Formats a Date for an <input type="date"> value. */
export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
