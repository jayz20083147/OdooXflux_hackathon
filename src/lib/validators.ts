import { z } from "zod";
import {
  DISCOUNT_KINDS,
  DISCOUNT_SCOPES,
  FREQUENCIES,
  PAYMENT_METHODS,
  PLAN_STATUSES,
  ROLES,
  SUBSCRIPTION_STATUSES,
  TAX_SCOPES,
  VARIANT_TYPES,
} from "./constants";

/**
 * Password policy: min 8 chars, at least one uppercase, one lowercase and one
 * special character.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .transform((v) => v.trim().toLowerCase());

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  password: passwordSchema,
});

export const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(ROLES).default("STAFF"),
});

// --------------------------------------------------------------- products
export const variantInputSchema = z.object({
  id: z.string().optional(),
  type: z.enum(VARIANT_TYPES),
  value: z.string().min(1, "Variant value is required"),
  surcharge: z.coerce.number().min(0, "Surcharge cannot be negative").default(0),
});

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  sku: z.string().min(2, "SKU is required").transform((v) => v.trim().toUpperCase()),
  description: z.string().optional().default(""),
  category: z.string().optional().default(""),
  basePrice: z.coerce.number().min(0, "Base price must be >= 0"),
  active: z.coerce.boolean(),
  variants: z.array(variantInputSchema).default([]),
});

// ------------------------------------------------------------------ plans
export const planSchema = z.object({
  name: z.string().min(2, "Plan name is required"),
  description: z.string().optional().default(""),
  productId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  frequency: z.enum(FREQUENCIES),
  minQuantity: z.coerce.number().int().min(1, "Minimum quantity must be at least 1"),
  startDate: z.coerce.date({ errorMap: () => ({ message: "Start date is required" }) }),
  endDate: z
    .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v === "" || v === null || v === undefined ? null : v)),
  autoClose: z.coerce.boolean().default(false),
  earlyClose: z.coerce.boolean().default(false),
  earlyCloseDays: z.coerce.number().int().min(0).default(0),
  pauseAllowed: z.coerce.boolean().default(false),
  autoRenew: z.coerce.boolean().default(false),
  status: z.enum(PLAN_STATUSES).default("ACTIVE"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;
export type PlanInput = z.infer<typeof planSchema>;

// ------------------------------------------------------- quotation templates
export const quotationTemplateSchema = z.object({
  name: z.string().min(2, "Template name is required"),
  description: z.string().optional().default(""),
  validityDays: z.coerce.number().int().min(1, "Validity must be at least 1 day"),
  terms: z.string().optional().default(""),
  defaultDiscountPercent: z.coerce
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .default(0),
  active: z.coerce.boolean().default(true),
});

// -------------------------------------------------------------- subscriptions
export const subscriptionLineInputSchema = z.object({
  id: z.string().optional(),
  productId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  variantId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  description: z.string().min(1, "Line description is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price must be >= 0"),
});

export const subscriptionSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  planId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  templateId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  status: z.enum(SUBSCRIPTION_STATUSES).default("DRAFT"),
  startDate: z.coerce.date({ errorMap: () => ({ message: "Start date is required" }) }),
  endDate: z
    .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v === "" || v === null || v === undefined ? null : v)),
  notes: z.string().optional().default(""),
  lines: z.array(subscriptionLineInputSchema).min(1, "Add at least one line"),
});

// ---------------------------------------------------------------- tax rules
export const taxRuleSchema = z.object({
  name: z.string().min(2, "Tax name is required"),
  rate: z.coerce.number().min(0, "Rate must be >= 0").max(100, "Rate cannot exceed 100%"),
  scope: z.enum(TAX_SCOPES).default("ALL"),
  scopeValue: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  active: z.coerce.boolean().default(true),
});

// ----------------------------------------------------------- discount rules
export const discountRuleSchema = z
  .object({
    name: z.string().min(2, "Discount name is required"),
    code: z
      .string()
      .optional()
      .transform((v) => (v && v.trim().length > 0 ? v.trim().toUpperCase() : null)),
    kind: z.enum(DISCOUNT_KINDS).default("PERCENT"),
    value: z.coerce.number().min(0, "Value must be >= 0"),
    minSubtotal: z.coerce.number().min(0).default(0),
    minQuantity: z.coerce.number().int().min(0).default(0),
    scope: z.enum(DISCOUNT_SCOPES).default("ALL"),
    scopeValue: z
      .string()
      .optional()
      .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
    maxUses: z.coerce.number().int().min(0, "Max uses must be >= 0").default(0),
    validFrom: z
      .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
      .transform((v) => (v === "" || v === null || v === undefined ? null : v)),
    validTo: z
      .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
      .transform((v) => (v === "" || v === null || v === undefined ? null : v)),
    active: z.coerce.boolean().default(true),
  })
  .refine(
    (data) => !(data.validFrom && data.validTo) || data.validTo >= data.validFrom,
    { message: "Valid-to must be after valid-from", path: ["validTo"] },
  );

// ------------------------------------------------------------- invoice actions
export const invoiceStatusActionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["CONFIRM", "CANCEL", "MARK_PAID"]),
});

// ---------------------------------------------------------------- payments
export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(PAYMENT_METHODS).default("BANK_TRANSFER"),
  reference: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  note: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  paidAt: z
    .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
    .transform((v) => (v === "" || v === null || v === undefined ? new Date() : v)),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export type QuotationTemplateInput = z.infer<typeof quotationTemplateSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type SubscriptionLineInput = z.infer<typeof subscriptionLineInputSchema>;
export type TaxRuleInput = z.infer<typeof taxRuleSchema>;
export type DiscountRuleInput = z.infer<typeof discountRuleSchema>;
