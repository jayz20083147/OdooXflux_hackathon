# ⚡ Brightloop — Subscription Management & Billing OS

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-100%25%20Passed-brightgreen?style=flat&logo=checkmarx)](https://github.com/jayz20083147/OdooXflux_hackathon)

> A production-grade, full-lifecycle recurring subscription management, invoicing, and financial operations platform built for modern SaaS and recurring businesses.

---

## 🌐 Live Deployment & Links

* **Live Demo App:** **[https://author-envy-try.ngrok-free.dev](https://author-envy-try.ngrok-free.dev)**
* **GitHub Repository:** **[jayz20083147/OdooXflux_hackathon](https://github.com/jayz20083147/OdooXflux_hackathon)**
* **Database Engine:** PostgreSQL 16
* **Custom UI Palette:** [Coolors Palette](https://coolors.co/ebe9e9-f3f8f2-3581b8-fcb07e-dee2d6) (`#f3f8f2`, `#3581b8`, `#fcb07e`, `#dee2d6`, `#ebe9e9`)

---

## 🔐 1-Click Demo Logins for Evaluators

All test accounts follow strict password security (*minimum 8 characters, at least 1 uppercase, 1 lowercase, and 1 special character*).

> 💡 **Quick Login**: The `/login` screen features **1-Click Demo Buttons** to instantly autofill test credentials for each role:

| Role | Email | Password | Access Scope & Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@brightloop.com` | `Admin@123` | **Full Master Access**: Staff provisioning, Products & Variants, Plans, Quotations, Taxes, Discounts, Subscriptions, Invoices, Payments, Executive Finance Dashboard. |
| **STAFF** | `staff1@brightloop.com` | `Staff@123` | **Operations Access**: Subscription management, Invoicing, Payment recording, Finance overview. *Restricted from Staff creation & Admin rules.* |
| **CUSTOMER** | `customer1@brightloop.com` | `Customer@123` | **Strictly Isolated Customer Portal**: My Subscriptions, Self-Service Catalog Checkout, Invoices, Online Invoice Payments. |

*Additional seeded accounts: `staff2@brightloop.com` (`Staff@123`), `customer2@brightloop.com` (`Customer@123`).*

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- **Node.js 18+** (recommended: Node.js 20+)
- **Docker** *(or a local PostgreSQL instance)*
- **npm** or **pnpm**

---

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/jayz20083147/OdooXflux_hackathon.git
cd odooxflux
npm install
```

---

### 3. Start PostgreSQL Database
You can spin up the identical PostgreSQL 16 database with Docker in one command:

```bash
docker compose up -d
```

*(Alternatively, set your existing PostgreSQL connection in `.env`: `DATABASE_URL="postgresql://user:password@localhost:5432/brightloop?schema=public"`)*

---

### 4. Push Schema & Seed Test Data
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed realistic test accounts, products, variants, plans, subscriptions, and invoices
npm run db:seed
```

> 💡 **One-Step Reset**: You can wipe and re-seed the database anytime using `npm run db:reset`.

---

### 5. Start Development Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🎨 Design System & Custom Palette

The interface is custom-tailored around the palette from [coolors.co/ebe9e9-f3f8f2-3581b8-fcb07e-dee2d6](https://coolors.co/ebe9e9-f3f8f2-3581b8-fcb07e-dee2d6):

| Token | Hex | Role in Interface | Description |
| :--- | :--- | :--- | :--- |
| `--background` | `#f3f8f2` | Primary Canvas (Mint Cream) | Soothing, clean, non-sterile background across Admin & Customer portal |
| `--primary` | `#3581b8` | Brand Ocean Blue | Active sidebar navigation, primary buttons, focus rings, brand emblem |
| `--accent` | `#fcb07e` | Warm Peach | High-priority badges, status pills, VIP indicators, subtle warm glows |
| `--border` | `#dee2d6` | Timberwolf Ash | Structural borders, card frames, table separators, input boundaries |
| `--muted` | `#ebe9e9` | Platinum Slate | Table headers, secondary pills, background hover states |

---

## 🏛️ Roles & Architecture

| Area | Route | Permitted Roles | Description |
| :--- | :--- | :--- | :--- |
| **Landing** | `/` | All | Automatically routes to `/admin` or `/dashboard` based on session role |
| **Authentication** | `/login`, `/signup` | Public | 1-click demo logins; Customer registration with live regex checklist |
| **Admin Console** | `/admin` | `ADMIN`, `STAFF` | Main operational dashboard with KPI metric cards & charts |
| **Products & Variants** | `/admin/products/**` | `ADMIN` | Catalog management with attribute surcharges (e.g. Brand "Odoo" +$560) |
| **Subscription Plans** | `/admin/plans/**` | `ADMIN` | Plans CRUD with billing cadences and 4 lifecycle flags |
| **Quotation Templates** | `/admin/quotations/**` | `ADMIN` | Reusable quotation terms, validity windows, and default discounts |
| **Tax & Discount Rules** | `/admin/taxes/**`, `/admin/discounts/**` | `ADMIN` | Multi-tier tax rates and promo code rules with usage limits |
| **Staff Management** | `/admin/staff` | `ADMIN` | Create and manage staff accounts |
| **Subscriptions** | `/admin/subscriptions/**` | `ADMIN`, `STAFF` | Provision subscriptions, line items, transition lifecycle states |
| **Invoicing & Payments** | `/admin/invoices/**` | `ADMIN`, `STAFF` | Idempotent invoice generator, manual payment recording, cancellations |
| **Finance Console** | `/admin/finance` | `ADMIN`, `STAFF` | Executive cashflow dashboard (<160ms) with overdue collection ledger |
| **Customer Portal** | `/dashboard` | `CUSTOMER` (Isolated) | KPI cards, active subscriptions, recent invoices |
| **Self-Service Catalog** | `/dashboard/catalog` | `CUSTOMER` | Browse plans, select variants, apply promo codes, self-subscribe |
| **Customer Invoices** | `/dashboard/invoices/**` | `CUSTOMER` | View personal statements, download receipts, submit online payments |
| **Access Control** | `/forbidden` | All | 403 Forbidden screen when crossing role boundaries |

---

## 💡 Core Platform Capabilities

### 1. Products with Multi-Type Variants & Price Surcharges
- Manage base products with category, SKU, description, and base price.
- Dynamic variants (`BRAND`, `SIZE`, `COLOR`, `PACK`, `FLAVOR`) that add price surcharges (e.g. Brand **Odoo Enterprise Edition** adds **+$560** to base plan).

### 2. Subscription Plans & 4 Operational Flags
- Flexible billing frequencies: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
- 4 Operational lifecycle flags:
  - `autoClose`: Closes subscription automatically on the end date.
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
- Immutable event audit log (`SubscriptionEvent`) recording transitions, timestamps, actors, and notes.

### 4. Billing Engine & Idempotent Invoicing
- **Pure Math Engine** (`src/lib/billing.ts`): Subtotal, scope-based tax calculation (`ALL`, `CATEGORY`, `PRODUCT`), conditioned discount evaluation (`minSubtotal`, `minQuantity`, `maxUses`), and financial rounding.
- **Idempotency Guarantee**: Invoices are strictly keyed by `@@unique([subscriptionId, periodStart, periodEnd])`. Repeated batch runs will never double-bill.
- **Discount Usage Tracking**: Live usage counters in `DiscountUsage`; cancelled invoices automatically release discount slots back to the rule.

### 5. Payment Recording & Atomic Balance Tracking
- Accepts multi-method payments: `CARD`, `BANK_TRANSFER`, `UPI`, `CASH`, `CHEQUE`, `OTHER`.
- Derived state transitions:
  - `OPEN` / `OUTSTANDING`: Issued and unpaid.
  - `PARTIAL`: Partially settled (`paidAmount > 0` but balance remaining).
  - `OVERDUE`: Past due date and not fully settled.
  - `PAID`: Fully settled (`paidAmount >= total`), balance $0, with settlement timestamp.

### 6. Executive Finance Dashboard (<160ms Performance)
- Real-time KPIs: Active Subscriptions, Revenue This Month, Outstanding Receivables, Overdue Invoices Volume.
- Interactive Overdue Collection Ledger with inline payment actions.
- Filterable by customer, payment state, and issue date range.

### 7. Isolated Customer Self-Service Portal
- Strict data isolation: Customers can only query and modify their own subscriptions and invoices.
- Self-service catalog checkout with live promo code calculations.
- Direct online payment on outstanding invoices.

---

## 📡 REST API Overview

All API routes are protected by role-based guards and provide JSON responses:

| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new customer with password policy | Public |
| `POST` | `/api/auth/[...nextauth]` | NextAuth v5 session authentication handlers | Public |
| `GET`, `POST` | `/api/products` | List and create products with variants | `ADMIN`, `STAFF` |
| `GET`, `PUT`, `DELETE` | `/api/products/[id]` | Product detail, updates, and deletion | `ADMIN`, `STAFF` |
| `GET`, `POST` | `/api/plans` | List and create recurring plans | `ADMIN`, `STAFF` |
| `GET`, `POST` | `/api/subscriptions` | Provision subscriptions with discount codes | `ADMIN`, `STAFF`, `CUSTOMER` |
| `GET`, `POST` | `/api/invoices` | Invoices ledger and batch generation | `ADMIN`, `STAFF` |
| `POST` | `/api/payments` | Record payments against invoices | `ADMIN`, `STAFF`, `CUSTOMER` |
| `GET` | `/api/finance` | Executive finance metrics and ledger (<160ms) | `ADMIN`, `STAFF` |
| `GET` | `/api/users/staff` | Staff accounts list | `ADMIN` |

---

## 🧪 Automated Verification Test Suite

Run the complete 7-scene end-to-end verification suite against the application:

```bash
# Run the automated verification test
npm run verify
```

The script exercises all problem statement requirements end-to-end:
* **Scene 1**: New Customer Signup with strict regex policy ✅
* **Scene 2**: Admin Creates Product with Variant (+560), Plan, and Discount Code ✅
* **Scene 3**: Staff Provisions Subscription with Discount ($1,547 recurring) ✅
* **Scene 4**: Verify Auto-Generated Invoice ($1,547 balance, OPEN) ✅
* **Scene 5**: Record Payment (Partial $547 → `PARTIAL`, Final $1,000 → `PAID`) ✅
* **Scene 6**: Customer Portal Isolation (verify customer only sees own data, 403 on admin APIs) ✅
* **Scene 7**: Finance Dashboard KPIs (<160ms query latency) ✅

---

## 📁 Repository Structure

```text
odooxflux/
├── docker-compose.yml         # Instant PostgreSQL 16 container definition
├── prisma/
│   ├── schema.prisma          # PostgreSQL Prisma schema
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
│   │   │   ├── page.tsx       # Executive & Staff operations dashboard
│   │   │   ├── products/      # Products & Variants CRUD + edit pages
│   │   │   ├── plans/         # Plans CRUD with lifecycle flags + edit pages
│   │   │   ├── quotations/    # Quotation templates CRUD + edit pages
│   │   │   ├── subscriptions/ # Subscription management, detail ([id]), & edit
│   │   │   ├── invoices/      # Invoices ledger, detail ([id]), & payment recording
│   │   │   ├── taxes/         # Tax rules CRUD + edit pages
│   │   │   ├── discounts/     # Discount rules CRUD + edit pages
│   │   │   ├── staff/         # Admin-only staff account creation
│   │   │   └── finance/       # High-performance Finance Dashboard
│   │   ├── (auth)/            # Auth shell
│   │   │   ├── login/         # Sign-in with 1-click demo logins
│   │   │   └── signup/        # Customer sign-up with live password validation
│   │   ├── (portal)/dashboard/# Customer Self-Service Portal
│   │   │   ├── page.tsx       # Customer overview & KPI cards
│   │   │   ├── catalog/       # Self-service product catalog & plan checkout
│   │   │   ├── invoices/      # Personal invoices & Pay Now modal
│   │   │   └── subscriptions/ # Customer subscriptions list & detail views
│   │   ├── actions/           # Next.js Server Actions (auth, products, plans, etc.)
│   │   ├── api/               # Secure REST API endpoints (with NextAuth v5 handlers)
│   │   ├── forbidden/         # 403 Forbidden page
│   │   ├── globals.css        # Tailwind CSS variables & custom palette
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home redirector
│   ├── components/            # UI components (sidebar, portal nav, payment form, etc.)
│   │   ├── ui/                # Radix UI primitives (badge, button, card, dialog, table, etc.)
│   │   ├── app-sidebar.tsx    # Admin & staff navigation sidebar
│   │   ├── portal-nav.tsx     # Customer navigation header
│   │   ├── dashboard-charts.tsx # Revenue trends, status distribution & plan bars
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
