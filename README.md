# ⚡ Brightloop — Subscription Management & Billing OS

A complete, production-grade recurring subscription management, invoicing, and financial operations platform built with **Next.js 15 App Router**, **Prisma ORM**, **NextAuth.js v5 (Auth.js)**, **React 19**, and **Tailwind CSS**.

`brightloop-final` merges the best architectural patterns, billing engines, UI interfaces, and automated verification suites into a single, cohesive, and runnable application.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 18+** (recommended: Node.js 20+)
- **npm** or **pnpm**

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize & Seed Database
```bash
# Push Prisma schema to local SQLite database (dev.db)
npx prisma db push

# Populate with realistic test accounts, products, variants, plans, subscriptions, and invoices
npm run db:seed
```

> 💡 **One-Step Reset**: You can also run `npm run db:reset` to wipe and re-seed the database in one command.

### 4. Start Development Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Demo Credentials

All test accounts follow the strict password policy: **minimum 8 characters, at least 1 uppercase letter, at least 1 lowercase letter, and at least 1 special character.**

> 💡 **Quick Login**: The `/login` page features **1-Click Demo Buttons** to automatically autofill Admin, Staff, or Customer credentials with a single click.

| Role | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@brightloop.com` | `Admin@123` | Full system access: Staff creation, Products, Plans, Quotations, Taxes, Discounts, Subscriptions, Invoices, Payments, Finance Dashboard |
| **STAFF** | `staff1@brightloop.com` | `Staff@123` | Operational access: Subscriptions, Invoicing, Payment recording, Finance console. *Restricted from Staff creation & Admin rules.* |
| **STAFF** | `staff2@brightloop.com` | `Staff@123` | Operational access (same as Staff 1) |
| **CUSTOMER** | `customer1@brightloop.com` | `Customer@123` | **Strictly Isolated Customer Portal**: My Subscriptions, Self-Service Catalog Checkout, Invoices, Online Invoice Payments |
| **CUSTOMER** | `customer2@brightloop.com` | `Customer@123` | Isolated Customer Portal |

*Alternative demo credentials (`admin@brightloop.io` / `AdminPassword2026!`, `admin@brightloop.test` / `Password123!`) are also seeded and fully functional.*

---

## 🏛️ Roles & Routing Architecture

| Area | Route | Permitted Roles | Description |
| :--- | :--- | :--- | :--- |
| **Landing** | `/` | All | Auto-redirects to `/admin` or `/dashboard` based on session role |
| **Authentication** | `/login`, `/signup` | Public | Sign-in with 1-click demo buttons; Customer registration with live regex feedback |
| **Admin Console** | `/admin` | `ADMIN`, `STAFF` | Main operational dashboard with KPI counters |
| **Products & Variants** | `/admin/products/**` | `ADMIN` | Catalog management with attribute surcharges (e.g. Brand "Odoo" +$560) |
| **Subscription Plans** | `/admin/plans/**` | `ADMIN` | Plans CRUD with frequencies and 4 lifecycle flags |
| **Quotation Templates** | `/admin/quotations/**` | `ADMIN` | Reusable quotation terms and validity rules |
| **Tax & Discount Rules** | `/admin/taxes/**`, `/admin/discounts/**` | `ADMIN` | Multi-tier tax rates and promo code rules with usage limits |
| **Staff Management** | `/admin/staff` | `ADMIN` (Admin only) | Create and manage staff accounts |
| **Subscriptions** | `/admin/subscriptions/**` | `ADMIN`, `STAFF` | Provision subscriptions, manage lines, transition lifecycle states |
| **Invoicing & Payments** | `/admin/invoices/**` | `ADMIN`, `STAFF` | Idempotent invoice generator, manual payment recording, mark paid, cancel |
| **Finance Console** | `/admin/finance` | `ADMIN`, `STAFF` | Executive cashflow dashboard (<200ms) with overdue collection table |
| **Customer Portal** | `/dashboard` | `CUSTOMER` (Own data only) | Overview KPIs, my subscriptions, recent invoices |
| **Self-Service Catalog** | `/dashboard/catalog` | `CUSTOMER` | Browse plans, select variants, apply promo codes, self-subscribe |
| **Customer Invoices** | `/dashboard/invoices/**` | `CUSTOMER` | View personal statements, receipts, and submit online payments |
| **Forbidden** | `/forbidden` | All | Displays 403 access denied when a role boundary is reached |

---

## 💡 Key Platform Capabilities

### 1. Products with Multi-Type Variants & Surcharges
- Manage base products with category, SKU, description, and base price.
- Dynamic variants (`BRAND`, `SIZE`, `COLOR`, `PACK`, `FLAVOR`) that add price surcharges (e.g. Brand **Odoo Enterprise Edition** adds **+$560** to base plan).

### 2. Subscription Plans & 4 Lifecycle Flags
- Billing frequencies: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
- 4 Operational lifecycle flags:
  - `autoClose`: Automatically closes subscription on the end date.
  - `earlyClose` & `earlyCloseDays`: Allows customers or staff to close early within the designated window.
  - `pauseAllowed`: Enables pausing deliveries without cancelling.
  - `autoRenew`: Automatically extends subscription window upon reaching the period end.

### 3. Subscription Status Machine & Audit Trail
```text
DRAFT ──▶ QUOTATION ──▶ CONFIRMED ──▶ ACTIVE ──▶ CLOSED
  ▲           │             │
  └───────────┘◀────────────┘
```
- Full lifecycle controls (Pause, Resume, Early Close, Renew) gated by plan flags.
- Immutable event audit log (`SubscriptionEvent`) recording transitions, actors, and notes.

### 4. Billing Engine & Idempotent Invoicing
- **Pure Math Engine** (`src/lib/billing.ts`): Subtotal, scope-based tax calculation (`ALL`, `CATEGORY`, `PRODUCT`), conditioned discount evaluation (`minSubtotal`, `minQuantity`, `maxUses`), and rounding.
- **Idempotency Guarantee**: `Invoice` enforced by `@@unique([subscriptionId, periodStart, periodEnd])`. Repeated batch runs will never double-bill.
- **Discount Usage Tracking**: Live usage counters in `DiscountUsage`; cancelled invoices automatically release discount slots back to the rule.

### 5. Payment Recording & Atomic Balance Tracking
- Accepts multi-method payments: `CARD`, `BANK_TRANSFER`, `UPI`, `CASH`, `CHEQUE`, `OTHER`.
- Derived status machine:
  - `OPEN` / `OUTSTANDING`: Issued and unpaid.
  - `PARTIAL`: Partially settled (`paidAmount > 0` but balance remaining).
  - `OVERDUE`: Past due date and not fully settled.
  - `PAID`: Fully settled (`paidAmount >= total`), balance $0, with settlement timestamp.

### 6. Executive Finance Dashboard (<200ms Performance)
- Real-time KPIs: Active Subscriptions, Revenue This Month, Outstanding Receivables, Overdue Invoices Volume.
- Interactive Overdue Collection Ledger with inline payment actions.
- Filterable by customer, payment state, and issue date range.

### 7. Isolated Customer Self-Service Portal
- Strict data isolation: Customers can only query and modify their own subscriptions and invoices.
- Self-service catalog checkout with live promo code calculations.
- Direct online payment on outstanding invoices.

---

## 🧪 Automated Verification Test Suite

Run the complete 7-scene end-to-end verification suite against the application:

```bash
# 1. Start server (if not already running)
npm run dev

# 2. Run the automated verification test (in another terminal)
npm run verify
```

The script exercises:
- **Scene 1**: New Customer Signup with strict regex policy
- **Scene 2**: Admin Creates Product with Variant (+560), Plan, and Discount Code
- **Scene 3**: Staff Provisions Subscription with Discount ($1,547 recurring)
- **Scene 4**: Verify Auto-Generated Invoice ($1,547 balance, OPEN)
- **Scene 5**: Record Payment:
  - Partial payment ($547) → Status: `PARTIAL`, Balance: $1,000
  - Final payment ($1,000) → Status: `PAID`, Balance: $0, `paidAt` timestamp
- **Scene 6**: Customer Portal Isolation (verify customer only sees own data, 403 on admin APIs)
- **Scene 7**: Finance Dashboard KPIs (<200ms query latency)

---

## 📁 Clean Project Structure

```text
brightloop-final/
├── prisma/
│   ├── dev.db                 # Local SQLite database
│   ├── schema.prisma          # Comprehensive Prisma schema
│   └── seed.ts                # Idempotent seed with realistic business data
├── public/
│   ├── logo.svg               # Application SVG brand icon
│   └── .gitkeep               # Public static assets directory
├── scripts/
│   ├── verify.ts              # Sanity test suite
│   └── verify_full.ts         # Complete 7-Scene E2E automated test suite
├── src/
│   ├── app/
│   │   ├── (app)/admin/       # Admin & Staff Console
│   │   │   ├── page.tsx       # Admin overview metrics
│   │   │   ├── products/      # Products & Variants CRUD
│   │   │   ├── plans/         # Plans CRUD with lifecycle flags
│   │   │   ├── quotations/    # Quotation templates CRUD
│   │   │   ├── subscriptions/ # Subscription management & provisioning
│   │   │   ├── invoices/      # Invoices ledger & idempotency generator
│   │   │   ├── taxes/         # Tax rules CRUD
│   │   │   ├── discounts/     # Discount rules CRUD
│   │   │   ├── staff/         # Admin-only staff account creation
│   │   │   └── finance/       # High-performance Finance Dashboard
│   │   ├── (auth)/            # Auth shell
│   │   │   ├── login/         # Sign-in with 1-click demo logins
│   │   │   └── signup/        # Customer sign-up with live password validation
│   │   ├── (portal)/dashboard/# Customer Self-Service Portal
│   │   │   ├── page.tsx       # Customer overview & KPI cards
│   │   │   ├── catalog/       # Self-service product catalog & plan checkout
│   │   │   ├── invoices/      # Personal invoices & Pay Now modal
│   │   │   └── subscriptions/ # Personal subscription management
│   │   ├── actions/           # Next.js Server Actions (auth, products, plans, etc.)
│   │   ├── api/               # Secure REST API endpoints (/auth, /products, /plans, etc.)
│   │   ├── forbidden/         # 403 Forbidden page
│   │   ├── globals.css        # Tailwind CSS variables & styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home redirector
│   ├── components/            # UI components (sidebar, portal nav, payment form, etc.)
│   │   ├── ui/                # Radix UI primitives (badge, button, card, dialog, table, etc.)
│   │   ├── app-sidebar.tsx    # Admin & staff navigation sidebar
│   │   ├── portal-nav.tsx     # Customer navigation header
│   │   ├── payment-form.tsx   # Payment entry component
│   │   └── subscription-actions.tsx # Lifecycle action triggers
│   ├── lib/
│   │   ├── billing.ts         # Pure mathematical billing engine
│   │   ├── billing-service.ts # DB orchestration service (idempotent generator, etc.)
│   │   ├── constants.ts       # State machines, enums, formatters
│   │   ├── prisma.ts          # Prisma singleton client
│   │   ├── session.ts         # Role guard helpers (requireUser, requireRole)
│   │   ├── utils.ts           # Tailwind className merge helper
│   │   └── validators.ts      # Zod validation schemas
│   ├── types/
│   │   └── next-auth.d.ts     # NextAuth custom type definitions
│   ├── auth.config.ts         # Edge-safe NextAuth configuration
│   ├── auth.ts                # NextAuth Credentials provider with Prisma & bcrypt
│   └── middleware.ts          # RBAC route protection middleware
├── .env                       # Local environment variables
├── .env.example               # Environment variables template
├── .gitignore                 # Clean standard Git ignore rules
├── next.config.mjs            # Next.js 15 configuration
├── package.json               # Next.js dependencies & scripts
├── README.md                  # Project documentation
├── tailwind.config.ts         # Tailwind CSS styling configuration
└── tsconfig.json              # TypeScript configuration
```
