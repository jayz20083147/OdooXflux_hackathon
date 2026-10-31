# 🔀 Brightloop Subscription Management System — Merge Notes

This document details the analysis, architectural decisions, and conflict resolutions applied while creating `brightloop-final` from the three source repositories: `antigravity`, `trae`, and `opencode`.

---

## 1. Source Folder Analysis

| Source | Framework & Auth | Prisma Schema Scope | Key Strengths | Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **`antigravity`** | Next.js 16/15, NextAuth v4 | User, Product, Variant, Plan, Discount, Subscription, Invoice, Payment | • End-to-end 7-scene verification script (`scripts/verify_full.ts`)<br>• Interactive 1-click demo login buttons<br>• Customer self-service catalog checkout<br>• Fast REST API routes in `/api/*`<br>• Real-time password requirement checklist | • Simplified schema lacked Quotation Templates, Tax Rules, and Discount Usage tracking<br>• NextAuth v4 instead of standard v5 |
| **`opencode`** | Next.js 15.5, NextAuth v5 beta, Prisma 5.22 | Phase 1 & 2 models (Products, Variants, Plans, QuotationTemplates, Subscriptions, Invoices, Taxes, Discounts) | • Standard Radix UI primitives (`dialog`, `table`, `card`)<br>• NextAuth v5 credentials setup | • Server actions were partially implemented or stubbed<br>• Seed script lacked realistic billing transactions and payments |
| **`trae`** | Next.js 15.5, NextAuth v5 beta, Prisma 6.19 | Comprehensive enterprise recurring billing model with audit trails, idempotent invoices, and payment tracking | • **Pure Billing Engine** (`src/lib/billing.ts`) with mathematical precision<br>• **Orchestration Service** (`src/lib/billing-service.ts`) with idempotent invoice generation<br>• Full Server Actions in `src/app/actions/*`<br>• Complete RBAC middleware with edge-safe `auth.config.ts`<br>• Dedicated shells: Admin console (`(app)/admin`) & Customer Portal (`(portal)/dashboard`)<br>• Rich seed data with 8 users, 5 products, 11 variants, 5 plans, 3 quotation templates, 2 tax rules, 3 discount rules, 10 subscriptions, 12 invoices covering all payment states | • Customer portal lacked direct self-service plan checkout<br>• Customer payment recording was initially staff-only<br>• Lacked external REST API endpoints for automated verification testing |

---

## 2. Key Merge & Architecture Decisions

### 2.1 Core Architectural Foundation: Next.js 15 + Prisma 6 + NextAuth v5
We selected `trae` as the foundational codebase because it possessed by far the cleanest separation of concerns, the most complete billing logic, and production-grade TypeScript typings.
- **Next.js 15.5.28** (App Router, Server Actions, Server Components)
- **Prisma 6.19.3** with SQLite database (`dev.db`)
- **NextAuth.js v5 (Auth.js beta 32)** with edge-safe `auth.config.ts` and JWT sessions
- **Tailwind CSS + Radix UI primitives** with custom styling

### 2.2 Prisma Schema Harmonization
`trae`'s Prisma schema was adopted as the single source of truth because it natively supports:
- **Products & Variants**: SKU uniqueness, attribute types (`BRAND`, `SIZE`, `COLOR`, `PACK`, `FLAVOR`), and price surcharges.
- **Plans & 4 Operational Flags**: `autoClose`, `earlyClose` (with `earlyCloseDays`), `pauseAllowed`, `autoRenew`, frequencies (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`), and minimum order quantities.
- **Quotation Templates**: Validity periods, terms & conditions, and default discount percentages.
- **Subscriptions & Status Machine**: Transitions (`DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`), billing cursor dates (`currentPeriodStart`, `currentPeriodEnd`), `pausedAt`, `renewCount`, and audit trail events (`SubscriptionEvent`).
- **Invoices & Idempotency**: `@@unique([subscriptionId, periodStart, periodEnd])` ensuring zero duplicate billings when running batch jobs; invoice lines, tax snapshots, discount snapshots, and `DiscountUsage` tracking.
- **Payments**: Multi-method recording (`CASH`, `CARD`, `BANK_TRANSFER`, `UPI`, `CHEQUE`, `OTHER`), balance deduction, and atomic status derivation (`PAID`, `PARTIAL`, `OVERDUE`, `OUTSTANDING`).

### 2.3 Feature Ingestion from `antigravity`
1. **Interactive 1-Click Demo Logins**:
   - Integrated into `src/app/(auth)/login/login-form.tsx`.
   - Users can click **Admin**, **Staff**, or **Customer** pills to instantly populate test credentials and sign in.
2. **Customer Self-Service Subscription Catalog**:
   - Added `/dashboard/catalog` and `CatalogClient` component allowing customers to view all active plans, select product variants, test discount codes, and subscribe.
   - Added `customerSubscribeAction` to `src/app/actions/subscriptions.ts` to provision the subscription, calculate totals, record audit events, and generate the first billing invoice automatically.
   - Added "Catalog & Plans" link to `PortalNav` and a prominent button on `/dashboard`.
3. **Customer Invoice Self-Service Payments**:
   - Updated `recordPaymentAction` in `src/app/actions/invoices.ts` to allow customers to pay their own invoices (`invoice.customerId === user.id`) while preventing them from touching other customers' invoices.
   - Added `PaymentForm` to `src/app/(portal)/dashboard/invoices/[id]/page.tsx` whenever an invoice has an unpaid balance.
4. **REST API Endpoints**:
   - Created REST API routes in `src/app/api/*` (`/auth/register`, `/products`, `/plans`, `/discounts`, `/subscriptions`, `/invoices`, `/payments`, `/finance`, `/users/staff`).
   - Standardized formatters (`formatInvoice`, `formatSubscription`) to guarantee compatibility with both camelCase (`totalAmount`, `amountPaid`, `invoiceNumber`) and snake/direct properties.
5. **Universal Credentials & Seed Compatibility**:
   - Added demo users from both `antigravity` (`admin@brightloop.io`, `staff1@brightloop.io`, `alice@customer.com`) and `opencode` (`admin@brightloop.test`, `staff1@brightloop.test`, `customer1@brightloop.test`) into `prisma/seed.ts`.
   - Added discount codes `LAUNCH20` (20% off) and `BRIGHT50` ($50 off) alongside `WELCOME10`, `BULK5`, and `COFFEE15`.
6. **Automated Verification Suites**:
   - Added `scripts/verify_full.ts` (verifying all 7 problem statement scenes end-to-end) and `scripts/verify.ts`.

### 2.4 Feature Ingestion from `opencode`
- Verified Radix UI primitive patterns across dialogs, tables, and form inputs.
- Preserved role guard patterns and Zod validation schemas.

---

## 3. Conflicts Resolved

| Area | Conflict | Resolution |
| :--- | :--- | :--- |
| **Duplicate Dashboard Route** | `src/app/(app)/dashboard` existed as empty directories while `src/app/(portal)/dashboard` contained the active customer portal. | Deleted empty `src/app/(app)/dashboard` directory to eliminate route collisions. |
| **API Route Middleware Handling** | NextAuth middleware was intercepting `/api/*` and redirecting unauthenticated requests to `/login` HTML. | Updated `src/middleware.ts` to pass `/api/*` requests through to route handlers so REST endpoints return proper `401`/`403` JSON errors and `/api/auth/register` is publicly reachable. |
| **Password Policy Uniformity** | Different builds had slight discrepancies in password requirements. | Standardized on the strict policy: **minimum 8 characters, at least 1 uppercase letter, at least 1 lowercase letter, and at least 1 special character**, enforced in both `src/lib/validators.ts` and `src/app/(auth)/signup/signup-form.tsx`. |
| **Invoice Status vs Payment State** | Trae stores invoice lifecycle (`DRAFT`, `CONFIRMED`, `PAID`, `CANCELLED`) and derives payment state (`OUTSTANDING`, `PARTIAL`, `OVERDUE`, `PAID`), whereas Antigravity stored `status: "OPEN" \| "PARTIAL" \| "PAID"`. | Harmonized in API formatters: `formatInvoice` provides `status: "OPEN" \| "PARTIAL" \| "PAID"` as well as `lifecycleStatus: "CONFIRMED"`, satisfying both UI components and external test suites. |
| **Subscription Creation for Customers** | Trae's admin subscription action redirected non-staff to `/forbidden`. | Added `customerSubscribeAction` dedicated to self-service customer checkout without breaking staff-managed multi-line provisioning. |

---

## 4. Verification & Readiness

The merged repository in `brightloop-final`:
- Contains zero residual files from old workflows.
- Has consistent Next.js 15 + Prisma 6 + NextAuth v5 dependencies.
- Has all working features: Authentication, Products & Variants, Subscription Plans, Quotation Templates, Subscriptions Lifecycle, Idempotent Invoicing, Multi-tier Taxes & Discounts, Payment Recording & History, Executive Finance Dashboard, and Customer Self-Service Portal.
- Is ready to run immediately with:
  ```bash
  npm install
  npx prisma db push
  npm run db:seed
  npm run dev
  ```

