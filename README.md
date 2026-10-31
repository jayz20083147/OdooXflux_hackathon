<div align="center">

# ⚡ Brightloop

### Subscription Management & Billing OS

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5_beta-purple)](https://authjs.dev)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-100%25%20Passed-brightgreen?style=flat&logo=checkmarx)](https://github.com/jayz20083147/OdooXflux_hackathon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A complete, production-grade recurring subscription lifecycle, mathematical billing engine, idempotent invoice management, and real-time financial analytics platform.**

*Built for the OdooXFlux Hackathon 2026*

</div>

---

## 🌐 Live Deployment & Demo Links

* 🚀 **Live Demo App:** **[https://author-envy-try.ngrok-free.dev](https://author-envy-try.ngrok-free.dev)**
* 💻 **GitHub Repository:** **[jayz20083147/OdooXflux_hackathon](https://github.com/jayz20083147/OdooXflux_hackathon)**
* 🐘 **Database Engine:** PostgreSQL 16 (Docker & Production-ready)
* 🎨 **Custom Design Palette:** [Coolors Palette](https://coolors.co/ebe9e9-f3f8f2-3581b8-fcb07e-dee2d6) (`#f3f8f2`, `#3581b8`, `#fcb07e`, `#dee2d6`, `#ebe9e9`)

---

## 🔐 1-Click Demo Logins for Evaluators

All test accounts follow strict password security (*minimum 8 characters, at least 1 uppercase, 1 lowercase, and 1 special character*).

> 💡 **Instant Evaluation**: The `/login` screen features **1-Click Demo Buttons** to autofill credentials for each role:

| Role | Email | Password | Access Scope & Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@brightloop.com` | `Admin@123` | **Full Master Access**: Staff provisioning, Products & Variants, Plans, Quotations, Taxes, Discounts, Subscriptions, Invoices, Payments, Executive Finance Dashboard. |
| **STAFF** | `staff1@brightloop.com` | `Staff@123` | **Operations Access**: Subscription management, Invoicing, Payment recording, Finance overview. *Restricted from Staff creation & Admin rules.* |
| **CUSTOMER** | `customer1@brightloop.com` | `Customer@123` | **Strictly Isolated Customer Portal**: My Subscriptions, Self-Service Catalog Checkout, Invoices, Online Invoice Payments. |

*Additional seeded accounts: `staff2@brightloop.com` (`Staff@123`), `customer2@brightloop.com` (`Customer@123`).*

---

## 📋 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Solution Overview](#-solution-overview)
3. [Key Features](#-key-features)
4. [Roles & Permissions](#-roles--permissions)
5. [Design System & Palette](#-design-system--custom-palette)
6. [Subscription Lifecycle](#-subscription-lifecycle)
7. [Technology Stack](#-technology-stack)
8. [System Architecture](#-system-architecture)
9. [Database Schema](#-database-schema)
10. [Quick Start (Local & Docker)](#-quick-start)
11. [Environment Variables](#-environment-variables)
12. [Project Structure](#-project-structure)
13. [Application Modules & API Routes](#-application-modules--api-routes)
14. [Billing Engine & Idempotency](#-billing-engine)
15. [Dashboard Analytics](#-dashboard-analytics)
16. [Security & Isolation](#-security)
17. [Automated Verification Tests](#-automated-testing)
18. [Screenshots & Routes](#-screenshots)
19. [Deployment](#-deployment)
20. [Team & License](#-team)

---

## 🎯 Problem Statement

> **Hackathon Theme:** Subscription Management System

Modern SaaS and recurring businesses face a fragmented operational challenge:

- **Manually managed subscriptions** across spreadsheets and disconnected tools
- **No automated billing lifecycle** — renewals, pauses, early closures handled ad-hoc
- **Inaccurate financial reporting** — revenue, outstanding receivables, and overdue invoices not tracked in real time
- **No customer self-service** — customers cannot browse catalogs, apply promo codes, view personal invoices, or pay online
- **Security gaps** — lack of role-based access control separating administrative authorities, operational staff, and customers

---

## 💡 Solution Overview

**Brightloop** is a unified full-stack subscription operations OS that orchestrates the **complete recurring billing lifecycle** from product catalog through to financial settlement, with role-isolated dashboards for every stakeholder.

```text
Admin → Product Catalog → Plan → Quotation → Customer → Subscription → Idempotent Invoicing → Payment → Executive Analytics
```

Built as a Next.js 15 App Router application with Prisma ORM 6 and PostgreSQL 16 — no separate backend service required. All operations are powered by **Server Actions** and **REST API route handlers**.

---

## ✨ Key Features

| Category | Capability |
|---|---|
| **Product Catalog** | Products with SKU, categories, and typed variants (`BRAND`, `SIZE`, `COLOR`, `PACK`, `FLAVOR`) with price surcharges (e.g. Brand "Odoo Enterprise" +$560) |
| **Subscription Plans** | Configurable billing frequencies (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`) with 4 lifecycle flags (`autoClose`, `earlyClose`, `pauseAllowed`, `autoRenew`) |
| **Subscription Lifecycle** | 5-state machine (`DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `CLOSED`) with immutable audit trail (`SubscriptionEvent`) |
| **Billing Engine** | Pure math engine for subtotals, scope-based taxes (`ALL`, `CATEGORY`, `PRODUCT`), conditional discounts (`minSubtotal`, `minQuantity`, `maxUses`), and decimal-safe rounding |
| **Idempotent Invoicing** | Unique constraint on `@@unique([subscriptionId, periodStart, periodEnd])` — batch runs never double-bill |
| **Partial Payments** | Multi-method payment recording (`CASH`, `CARD`, `BANK_TRANSFER`, `UPI`, `CHEQUE`, `OTHER`) with atomic balance tracking (`OUTSTANDING` → `PARTIAL` → `PAID` → `OVERDUE`) |
| **Discount Rules** | `FIXED` or `PERCENT` discounts with promo codes, usage counters, validity windows, and scope targeting |
| **Tax Rules** | Auto-applied tax rates scoped to `ALL`, `CATEGORY`, or specific `PRODUCT` |
| **Finance Dashboard** | Real-time KPIs (<160ms latency), revenue trends, payment distribution charts, overdue collection ledger |
| **Customer Portal** | Isolated self-service: browse catalog, test promo codes with live math, checkout, pay invoices online |
| **Role-Based Access** | Edge-safe middleware-enforced RBAC: `ADMIN` / `STAFF` / `CUSTOMER` with route-level boundary defense |
| **Audit Trail** | `SubscriptionEvent` log captures every state transition, actor, timestamp, and context notes |

---

## 👥 Roles & Permissions

### Role Permission Matrix

| Feature | ADMIN | STAFF | CUSTOMER |
|---|:---:|:---:|:---:|
| Products & Variants | ✅ Full CRUD | 👁 Read | ❌ |
| Plans | ✅ Full CRUD | 👁 Read | 👁 Catalog |
| Quotation Templates | ✅ Full CRUD | ❌ | ❌ |
| Tax & Discount Rules | ✅ Full CRUD | ❌ | ❌ |
| Staff Provisioning | ✅ Full CRUD | ❌ | ❌ |
| Subscriptions | ✅ Full CRUD | ✅ Full CRUD | 👁 Own only |
| Invoices & Payments | ✅ Full CRUD | ✅ Full CRUD | 👁 Own only |
| Finance Dashboard | ✅ Full Access | ✅ Full Access | ❌ |
| Customer Portal | ❌ | ❌ | ✅ Isolated |
| Self-Service Checkout | ❌ | ❌ | ✅ Self-service |

---

## 🎨 Design System & Custom Palette

The user interface is tailored around the curated palette from [coolors.co/ebe9e9-f3f8f2-3581b8-fcb07e-dee2d6](https://coolors.co/ebe9e9-f3f8f2-3581b8-fcb07e-dee2d6):

| Token | Hex Code | Interface Role | Description |
| :--- | :--- | :--- | :--- |
| `--background` | `#f3f8f2` | Primary Canvas (Mint Cream) | Soothing, clean, non-sterile background across Admin & Customer portal |
| `--primary` | `#3581b8` | Brand Ocean Blue | Active sidebar navigation, primary buttons, focus rings, brand emblem |
| `--accent` | `#fcb07e` | Warm Peach | High-priority badges, status pills, VIP indicators, warm glow accents |
| `--border` | `#dee2d6` | Timberwolf Ash | Structural borders, card frames, table separators, input boundaries |
| `--muted` | `#ebe9e9` | Platinum Slate | Table headers, secondary badges, background hover states |

---

## 🔄 Subscription Lifecycle

```text
DRAFT ──▶ QUOTATION ──▶ CONFIRMED ──▶ ACTIVE ──▶ CLOSED
  ▲            │              │
  └────────────┘◀─────────────┘
       (revert allowed)
```

### States

| State | Description |
|---|---|
| `DRAFT` | Initial creation — editable, no billing, not yet presented |
| `QUOTATION` | Presented to customer — validity window set, terms snapshot computed |
| `CONFIRMED` | Customer has accepted quotation — ready for activation |
| `ACTIVE` | Billing is live — invoices generated automatically per billing period |
| `CLOSED` | Terminated — no further billing |

### Operational Plan Flags

| Action | Condition |
|---|---|
| **Pause** | `plan.pauseAllowed = true` and subscription is `ACTIVE` |
| **Resume** | Subscription is currently paused |
| **Early Close** | `plan.earlyClose = true` and within `earlyCloseDays` window |
| **Auto Renew** | `plan.autoRenew = true` — extends subscription period upon expiry |
| **Auto Close** | `plan.autoClose = true` — closes automatically at `endDate` |

---

## 🛠 Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15.5 | Server Components, Server Actions, API routes |
| **Frontend** | React | 19.0 | Concurrent UI primitives, optimistic updates |
| **Language** | TypeScript | 5.9 | End-to-end type safety |
| **Database** | PostgreSQL | 16 | Relational data integrity, unique constraints |
| **ORM** | Prisma | 6.19 | Type-safe schema modeling and queries |
| **Authentication** | NextAuth.js / Auth.js | 5.0-beta.32 | Edge-safe JWT sessions and credentials auth |
| **Styling** | Tailwind CSS | 3.4 | Custom Coolors design system implementation |
| **Components** | Radix UI | Latest | Accessible primitives (Dialog, Table, Badge, Card) |
| **Container** | Docker & Compose | Latest | 1-command reproducible PostgreSQL setup |
| **Test Runner** | tsx | 4.x | Automated 7-scene end-to-end verification |

---

## 🏗 System Architecture

```mermaid
flowchart TD
    Browser["🌐 Browser / Client"]

    subgraph Next.js App Router
        MW["Middleware\n(RBAC Route Guard)"]
        subgraph Pages
            AdminPages["Admin & Staff Pages\n/admin/**"]
            CustomerPages["Customer Portal\n/dashboard/**"]
            AuthPages["Auth Pages\n/login · /signup"]
        end
        subgraph Backend
            Actions["Server Actions\n/app/actions/**"]
            API["REST API Route Handlers\n/app/api/**"]
        end
        subgraph Core Libraries
            Billing["billing.ts\nPure Math Billing Engine"]
            BillingService["billing-service.ts\nDB Orchestration"]
            Constants["constants.ts\nState Machines · Formatters"]
            Session["session.ts\nrequireRole · requireUser"]
        end
    end

    subgraph Data Layer
        Prisma["Prisma ORM 6"]
        Postgres[("PostgreSQL 16\nDocker / Cloud")]
    end

    Browser --> MW
    MW --> Pages
    Pages --> Actions
    Pages --> API
    Actions --> BillingService
    BillingService --> Billing
    Actions --> Session
    API --> Session
    Actions --> Prisma
    API --> Prisma
    Prisma --> Postgres
```

### Request Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant MW as Middleware
    participant Page as Server Page
    participant Action as Server Action
    participant DB as Prisma + PostgreSQL

    U->>MW: GET /admin/invoices
    MW->>MW: Check JWT session + role
    MW-->>U: 302 /login (if unauth)
    MW->>Page: Authorized request
    Page->>DB: prisma.invoice.findMany()
    DB-->>Page: Invoice rows
    Page-->>U: Rendered HTML
    U->>Action: POST (record payment)
    Action->>Action: requireRole("ADMIN","STAFF")
    Action->>DB: prisma.payment.create()
    DB-->>Action: Payment record
    Action->>DB: Update invoice.paidAmount & derived status
    DB-->>Action: Updated invoice
    Action-->>U: Redirect with success
```

---

## 🗄 Database Schema

```mermaid
erDiagram
    User {
        string id PK
        string email
        string name
        string password
        string role
        datetime createdAt
    }

    Product {
        string id PK
        string name
        string sku
        string category
        float basePrice
        boolean active
    }

    Variant {
        string id PK
        string productId FK
        string type
        string value
        string sku
        float surcharge
    }

    Plan {
        string id PK
        string productId FK
        string name
        float price
        string frequency
        int minQuantity
        boolean autoClose
        boolean earlyClose
        int earlyCloseDays
        boolean pauseAllowed
        boolean autoRenew
        string status
    }

    QuotationTemplate {
        string id PK
        string name
        int validityDays
        float defaultDiscountPercent
        boolean active
    }

    Subscription {
        string id PK
        string reference
        string customerId FK
        string planId FK
        string templateId FK
        string status
        int quantity
        float subtotal
        float taxTotal
        float discountTotal
        float total
        datetime startDate
        datetime endDate
    }

    SubscriptionLine {
        string id PK
        string subscriptionId FK
        string productId FK
        string variantId FK
        string description
        int quantity
        float unitPrice
        float amount
    }

    SubscriptionEvent {
        string id PK
        string subscriptionId FK
        string actorId FK
        string type
        string status
        string note
        datetime createdAt
    }

    Invoice {
        string id PK
        string number
        string subscriptionId FK
        string customerId FK
        string status
        datetime periodStart
        datetime periodEnd
        float subtotal
        float taxTotal
        float discountTotal
        float total
        float paidAmount
        datetime dueAt
    }

    Payment {
        string id PK
        string invoiceId FK
        string recordedById FK
        float amount
        string method
        string reference
        datetime paidAt
    }

    InvoiceLine {
        string id PK
        string invoiceId FK
        string description
        float unitPrice
        float amount
    }

    InvoiceTax {
        string id PK
        string invoiceId FK
        string name
        float rate
        float amount
    }

    InvoiceDiscount {
        string id PK
        string invoiceId FK
        string name
        string kind
        float value
        float amount
    }

    TaxRule {
        string id PK
        string name
        float rate
        string scope
        string scopeValue
        boolean active
    }

    DiscountRule {
        string id PK
        string name
        string code
        string kind
        float value
        float minSubtotal
        int minQuantity
        int maxUses
        int usedCount
        boolean active
    }

    DiscountUsage {
        string id PK
        string discountRuleId FK
        string invoiceId FK
        float amount
    }

    User ||--o{ Subscription : "customer"
    User ||--o{ SubscriptionEvent : "actor"
    User ||--o{ Invoice : "customer"
    User ||--o{ Payment : "recordedBy"
    Product ||--o{ Variant : "has"
    Product ||--o{ Plan : "linked to"
    Product ||--o{ SubscriptionLine : "used in"
    Variant ||--o{ SubscriptionLine : "selected"
    Plan ||--o{ Subscription : "governs"
    QuotationTemplate ||--o{ Subscription : "applied to"
    Subscription ||--o{ SubscriptionLine : "contains"
    Subscription ||--o{ SubscriptionEvent : "audit"
    Subscription ||--o{ Invoice : "generates"
    Invoice ||--o{ Payment : "settled by"
    Invoice ||--o{ InvoiceLine : "line items"
    Invoice ||--o{ InvoiceTax : "taxes"
    Invoice ||--o{ InvoiceDiscount : "discounts"
    Invoice ||--o{ DiscountUsage : "tracks"
    DiscountRule ||--o{ DiscountUsage : "consumed by"
```

### Key Database Constraints

| Model | Unique Constraint | Purpose |
|---|---|---|
| `User` | `email` | Unique account credential |
| `Product` | `sku` | Unique product identifier |
| `Variant` | `sku` | Unique variant identifier |
| `DiscountRule` | `code` | Unique coupon / promo code |
| `Invoice` | `number` | Human-readable sequential invoice ID |
| `Invoice` | `(subscriptionId, periodStart, periodEnd)` | **Idempotency** — strictly prevents double-billing |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 18+** (Node.js 20+ recommended)
- **Docker** *(or existing PostgreSQL instance)*
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
Spin up the PostgreSQL 16 container with Docker:

```bash
docker compose up -d
```

*(Alternatively, supply your existing PostgreSQL database URL in `.env`: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brightloop?schema=public"`)*

---

### 4. Push Schema & Seed Test Data
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed realistic demo accounts, products, variants, plans, subscriptions, and invoices
npm run db:seed
```

> 💡 **One-Step Reset**: You can wipe and re-seed the database anytime using `npm run db:reset`.

---

### 5. Start Development Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and click any of the **1-Click Demo Buttons** on the login page.

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brightloop?schema=public"

# NextAuth.js JWT secret (Generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="brightloop-super-secure-production-secret-key-32chars"

# Application URL
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📁 Project Structure

```text
odooxflux/
├── docker-compose.yml         # 1-command PostgreSQL 16 container definition
├── prisma/
│   ├── schema.prisma          # PostgreSQL Prisma schema (15 models)
│   └── seed.ts                # Idempotent demo data seeder with 14 accounts
├── public/
│   └── logo.svg               # Application brand icon
├── scripts/
│   ├── verify.ts              # Quick sanity script
│   └── verify_full.ts         # Complete 7-scene E2E automated test suite
├── src/
│   ├── app/
│   │   ├── (app)/admin/       # Admin & Staff Console
│   │   │   ├── page.tsx       # Executive operations dashboard
│   │   │   ├── products/      # Products & Variants CRUD
│   │   │   ├── plans/         # Subscription Plans CRUD + lifecycle flags
│   │   │   ├── quotations/    # Quotation Templates CRUD
│   │   │   ├── subscriptions/ # Subscription management & detail ([id])
│   │   │   ├── invoices/      # Invoice ledger, detail ([id]), payment recording
│   │   │   ├── taxes/         # Tax Rules CRUD
│   │   │   ├── discounts/     # Discount Rules & Promo Codes
│   │   │   ├── staff/         # Admin-only staff account creation
│   │   │   └── finance/       # High-performance Finance Dashboard (<160ms)
│   │   ├── (auth)/
│   │   │   ├── login/         # Sign-in with 1-click demo buttons
│   │   │   └── signup/        # Customer registration with live regex checklist
│   │   ├── (portal)/dashboard/# Customer Self-Service Portal
│   │   │   ├── page.tsx       # Customer overview & KPI cards
│   │   │   ├── catalog/       # Self-service product catalog & plan checkout
│   │   │   ├── invoices/      # Personal invoices & Pay Now modal
│   │   │   └── subscriptions/ # Customer subscriptions list & detail views
│   │   ├── actions/           # Next.js Server Actions (auth, products, plans, etc.)
│   │   ├── api/               # Secure REST API endpoints (with NextAuth v5 handlers)
│   │   ├── forbidden/         # 403 Forbidden page
│   │   ├── globals.css        # Tailwind CSS variables & custom Coolors palette
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home redirector
│   ├── components/            # UI components (sidebar, portal nav, payment form, etc.)
│   │   ├── ui/                # Radix UI primitives (badge, button, card, dialog, table)
│   │   ├── app-sidebar.tsx    # Admin & staff navigation sidebar
│   │   ├── portal-nav.tsx     # Customer navigation header
│   │   ├── dashboard-charts.tsx # Revenue trends, status distribution & plan bars
│   │   ├── payment-form.tsx   # Payment entry form
│   │   └── subscription-actions.tsx # Lifecycle action triggers
│   ├── lib/
│   │   ├── billing.ts         # Pure mathematical billing engine
│   │   ├── billing-service.ts # DB orchestration service (idempotent generator)
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

---

## 🔌 Application Modules & API Routes

### Server Actions (`src/app/actions/`)

| File | Key Actions | Description |
|---|---|---|
| `auth.ts` | `loginAction`, `registerAction` | Credentials sign-in, customer self-registration |
| `products.ts` | `createProductAction`, `updateProductAction`, `deleteProductAction` | Product & variant management |
| `plans.ts` | `createPlanAction`, `updatePlanAction`, `deletePlanAction` | Plan lifecycle management |
| `subscriptions.ts` | `createSubscriptionAction`, `updateSubscriptionStatusAction`, `customerSubscribeAction` | Subscription provisioning & status transitions |
| `invoices.ts` | `generateInvoicesAction`, `invoiceStatusAction`, `recordPaymentAction`, `deleteInvoiceAction` | Invoice generation & payment recording |
| `quotations.ts` | `createQuotationTemplateAction`, `deleteQuotationTemplateAction` | Quotation template management |
| `taxes.ts` | `createTaxRuleAction`, `updateTaxRuleAction`, `deleteTaxRuleAction` | Tax rule management |
| `discounts.ts` | `createDiscountRuleAction`, `updateDiscountRuleAction`, `deleteDiscountRuleAction` | Discount & promo code management |
| `staff.ts` | `createStaffAction`, `deleteUserAction` | Admin-only staff account management |

### REST API Routes (`src/app/api/`)

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Customer self-registration with password policy |
| `POST` | `/api/auth/[...nextauth]` | Public | NextAuth v5 authentication handlers |
| `GET`, `POST` | `/api/products` | `ADMIN`, `STAFF` | List and create products with variants |
| `GET`, `PUT`, `DELETE` | `/api/products/[id]` | `ADMIN`, `STAFF` | Product detail, updates, and deletion |
| `GET`, `POST` | `/api/plans` | `ADMIN`, `STAFF` | List and create recurring plans |
| `GET`, `POST` | `/api/subscriptions` | `ADMIN`, `STAFF`, `CUSTOMER` | Provision subscriptions with discount codes |
| `GET`, `POST` | `/api/invoices` | `ADMIN`, `STAFF` | Invoices ledger and batch generation |
| `POST` | `/api/payments` | `ADMIN`, `STAFF`, `CUSTOMER` | Record payments against invoices |
| `GET` | `/api/finance` | `ADMIN`, `STAFF` | Executive finance metrics and ledger (<160ms) |
| `GET` | `/api/users/staff` | `ADMIN` | Staff accounts list |

---

## 💰 Billing Engine & Idempotency

### Calculation Pipeline (`src/lib/billing.ts`)

The billing engine is a **pure mathematical function module** without database side-effects:

```text
Subscription Lines
       │
       ▼
  [1] Subtotal = Σ (quantity × unitPrice) per line
       │
       ▼
  [2] Discount Engine
       ├── Filter rules: active, within validFrom–validTo window
       ├── Check conditions: minSubtotal, minQuantity, maxUses
       ├── Promo-gated rules: apply only when matching promo code provided
       ├── Compute scope base: ALL | CATEGORY | PRODUCT
       └── Apply: PERCENT (%) or FIXED ($) — capped at scope base
       │
       ▼
  [3] Tax Engine
       ├── Filter rules: active
       ├── Compute scope base: ALL | CATEGORY | PRODUCT
       └── Apply rate to net-of-discount scope base
       │
       ▼
  [4] Total = Subtotal − discountTotal + taxTotal
       │
       ▼
  round2() — Math.round(value × 100) / 100
```

### Idempotent Invoice Generation (`src/lib/billing-service.ts`)

```text
generateDueInvoices()
    │
    ├── Find all ACTIVE subscriptions where currentPeriodEnd ≤ now
    │
    ├── For each subscription:
    │   ├── Compute period (currentPeriodStart → currentPeriodEnd)
    │   ├── prisma.invoice.upsert (unique: subscriptionId + periodStart + periodEnd)
    │   │   └── Already exists → SKIP (idempotent guarantee)
    │   ├── Apply billing.calculateTotals(lines, taxRules, discountRules)
    │   ├── Snapshot InvoiceLines, InvoiceTaxes, InvoiceDiscounts
    │   ├── Track DiscountUsage (increment usedCount)
    │   └── Advance currentPeriodStart/End by one billing frequency
    │
    └── Return { generated, skipped } counts
```

### Invoice Payment States

| State | Condition |
|---|---|
| `OUTSTANDING` | Invoice confirmed, no payments recorded, not yet past due |
| `PARTIAL` | Partial payment recorded, remaining balance > $0 |
| `OVERDUE` | Balance > $0 and current date > `dueAt` |
| `PAID` | `paidAmount >= total` — balance is $0, `paidAt` settlement timestamp recorded |
| `DRAFT` | Invoice draft state |
| `CANCELLED` | Invoice voided — discount usage slots released back to rule |

---

## 📊 Dashboard Analytics

### Admin Executive Dashboard (`/admin`)
- 💰 **Monthly Recurring Revenue (MRR)** — normalized from all active subscriptions
- 📋 **Active Subscriptions** — live count of subscriptions in `ACTIVE` state
- ✅ **Revenue Collected** — total settled payments
- ⚠️ **Outstanding Receivables** — sum of unpaid invoice balances
- 📈 **Monthly Revenue Trend** & 🥧 **Payment Status Distribution** charts
- 🔴 Overdue Invoices collection list & upcoming renewals table

### Finance Console (`/admin/finance`)
- High-performance API response (<160ms query latency)
- Filterable by Customer, Payment State, and Issue Date Range
- Real-time collection ledger with inline payment actions

### Customer Portal (`/dashboard`)
- Data isolation: Customers only view their personal subscriptions and invoices
- Self-service Catalog (`/dashboard/catalog`) with real-time promo code math and checkout
- Self-service invoice online settlement with partial payment support

---

## 🔒 Security

### Route Authorization Architecture

```mermaid
flowchart LR
    Request --> MW["Middleware\nJWT check"]
    MW -->|"No session"| Login["/login redirect"]
    MW -->|"Has session"| RouteCheck["Route prefix match"]
    RouteCheck -->|"/admin/staff\n/admin/quotations\n/admin/taxes\n/admin/discounts"| AdminOnly["ADMIN only\n403 if STAFF/CUSTOMER"]
    RouteCheck -->|"/admin/**"| StaffOK["ADMIN + STAFF\n403 if CUSTOMER"]
    RouteCheck -->|"/dashboard/**"| CustomerOK["CUSTOMER only\n403 if ADMIN/STAFF"]
    AdminOnly --> Handler["Route Handler"]
    StaffOK --> Handler
    CustomerOK --> Handler
    Handler -->|"requireRole()"| ServerGuard["Server-side double-check\n(defense in depth)"]
```

---

## 🧪 Automated Testing

### Complete 7-Scene E2E Verification Suite

Run the automated test suite directly against the running application:

```bash
npm run verify
```

The script exercises all problem statement requirements end-to-end:

| Scene | What is Tested | Result |
|---|---|:---:|
| **1 — Customer Signup** | `POST /api/auth/register` with strict password policy | ✅ `201 Created` |
| **2 — Admin Catalog Setup** | Create Product (+$560 variant), Plan ($350/mo), Discount (15% promo) | ✅ All created |
| **3 — Staff Subscription** | Staff provisions subscription with discount applied | ✅ **$1,547** total |
| **4 — Auto Invoice** | Verify idempotent invoice generation | ✅ **$1,547** balance, `OPEN` |
| **5 — Payments** | Partial $547 → `PARTIAL`; Final $1,000 → `PAID`, $0 balance | ✅ States & timestamps |
| **6 — Customer Isolation** | Customer sees only own records; returns `403` on admin endpoints | ✅ Isolation enforced |
| **7 — Finance Metrics** | `GET /api/finance` response time & executive KPI structure | ✅ **<160ms latency** |

---

## 📸 Screenshots & Key Routes

| View | Route | Description |
|---|---|---|
| Login | `/login` | 1-Click Demo Account buttons for instant access |
| Admin Dashboard | `/admin` | KPI cards, revenue charts, overdue invoices |
| Subscriptions | `/admin/subscriptions` | Full lifecycle table with status badges |
| Invoice Detail | `/admin/invoices/[id]` | Line items, tax/discount breakdown, payment form |
| Finance Ledger | `/admin/finance` | Filterable cashflow ledger with overdue tracking |
| Customer Portal | `/dashboard` | Self-service overview with KPI cards |
| Plan Catalog | `/dashboard/catalog` | Promo code checkout with live price preview |
| Customer Invoice | `/dashboard/invoices/[id]` | Pay Now with partial payment support |

---

## 🚢 Deployment

### 1. Live Public Deployment (Current)
The project is deployed and accessible publicly at:
**[https://author-envy-try.ngrok-free.dev](https://author-envy-try.ngrok-free.dev)**

### 2. Docker Setup
To run the full stack locally with PostgreSQL:
```bash
docker compose up -d
npm install
npx prisma db push
npm run db:seed
npm run dev
```

### 3. Production Cloud Hosting (Vercel / Render / VPS)
Connect your PostgreSQL database in `.env` (`DATABASE_URL`), set `NEXTAUTH_SECRET`, and execute:
```bash
npm run build
npm run start
```

---

## 👥 Team

**OdooXFlux — Hackathon 2026**

| Name | Role |
|---|---|
| Team OdooXFlux | Full-Stack Engineering & Design |

**Repository:** [github.com/jayz20083147/OdooXflux_hackathon](https://github.com/jayz20083147/OdooXflux_hackathon)

---

## 📄 License

This project is licensed under the **MIT License**.

<div align="center">

Built with ❤️ using **Next.js 15**, **Prisma**, **PostgreSQL**, **Auth.js v5**, and **Tailwind CSS**

*OdooXFlux Hackathon 2026*

</div>
