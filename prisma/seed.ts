import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  computeInvoiceTotals,
  round2,
  type BillingLine,
  type DiscountRuleLike,
  type TaxRuleLike,
} from "../src/lib/billing";

const prisma = new PrismaClient();

const hash = (plain: string) => bcrypt.hashSync(plain, 10);

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

async function main() {
  console.log("Seeding Brightloop...");

  // ---------------------------------------------------------------- users
  const users = [
    {
      email: "admin@brightloop.com",
      name: "Ada Admin",
      role: "ADMIN",
      password: hash("Admin@123"),
    },
    {
      email: "staff1@brightloop.com",
      name: "Sam Staff",
      role: "STAFF",
      password: hash("Staff@123"),
    },
    {
      email: "staff2@brightloop.com",
      name: "Rita Reyes",
      role: "STAFF",
      password: hash("Staff@123"),
    },
    {
      email: "customer1@brightloop.com",
      name: "Chris Customer",
      role: "CUSTOMER",
      password: hash("Customer@123"),
    },
    {
      email: "customer2@brightloop.com",
      name: "Nina Patel",
      role: "CUSTOMER",
      password: hash("Customer@123"),
    },
    {
      email: "customer3@brightloop.com",
      name: "Omar Khan",
      role: "CUSTOMER",
      password: hash("Customer@123"),
    },
    {
      email: "customer4@brightloop.com",
      name: "Priya Sharma",
      role: "CUSTOMER",
      password: hash("Customer@123"),
    },
    {
      email: "customer5@brightloop.com",
      name: "Leo Fernandes",
      role: "CUSTOMER",
      password: hash("Customer@123"),
    },
    // Antigravity demo credentials
    {
      email: "admin@brightloop.io",
      name: "Super Admin",
      role: "ADMIN",
      password: hash("AdminPassword2026!"),
    },
    {
      email: "staff1@brightloop.io",
      name: "Sarah Jenkins",
      role: "STAFF",
      password: hash("StaffPassword2026!"),
    },
    {
      email: "alice@customer.com",
      name: "Alice Johnson",
      role: "CUSTOMER",
      password: hash("CustomerPass2026!"),
    },
    // OpenCode demo credentials
    {
      email: "admin@brightloop.test",
      name: "Admin Tester",
      role: "ADMIN",
      password: hash("Password123!"),
    },
    {
      email: "staff1@brightloop.test",
      name: "Staff Tester",
      role: "STAFF",
      password: hash("Password123!"),
    },
    {
      email: "customer1@brightloop.test",
      name: "Customer Tester",
      role: "CUSTOMER",
      password: hash("Password123!"),
    },
  ];

  const userByEmail: Record<string, string> = {};
  for (const u of users) {
    const upserted = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: u.password },
      create: u,
    });
    userByEmail[u.email] = upserted.id;
  }
  console.log(`  users: ${users.length}`);

  // ------------------------------------------------------------- products
  const products = [
    {
      name: "Arabica Coffee Beans",
      sku: "COF-ARB-001",
      description: "Single-origin Ethiopian arabica beans, roasted weekly.",
      category: "Coffee",
      basePrice: 14.5,
      variants: [
        { type: "BRAND", value: "Brightloop Reserve", surcharge: 4.5 },
        { type: "BRAND", value: "Blue Mountain", surcharge: 9.0 },
        { type: "PACK", value: "1kg Bulk Pack", surcharge: 11.0 },
      ],
    },
    {
      name: "Cold Pressed Juice",
      sku: "JUI-CLD-002",
      description: "Freshly cold pressed seasonal fruit juice.",
      category: "Beverages",
      basePrice: 6.0,
      variants: [
        { type: "BRAND", value: "Pulpy Premium", surcharge: 2.25 },
        { type: "SIZE", value: "1L Family Bottle", surcharge: 3.0 },
      ],
    },
    {
      name: "Organic Sourdough Bread",
      sku: "BRD-SRD-003",
      description: "Naturally leavened sourdough baked every morning.",
      category: "Bakery",
      basePrice: 5.75,
      variants: [
        { type: "BRAND", value: "Artisan Hearth", surcharge: 1.75 },
        { type: "SIZE", value: "Family Loaf", surcharge: 2.5 },
      ],
    },
    {
      name: "Grass-Fed Milk",
      sku: "MLK-GRS-004",
      description: "Pasture raised grass-fed whole milk.",
      category: "Dairy",
      basePrice: 3.4,
      variants: [
        { type: "BRAND", value: "Meadow Gold", surcharge: 0.9 },
        { type: "PACK", value: "6 x 1L Crate", surcharge: 14.0 },
      ],
    },
    {
      name: "Seasonal Fruit Box",
      sku: "FRT-BOX-005",
      description: "Curated box of in-season local fruit.",
      category: "Produce",
      basePrice: 22.0,
      variants: [
        { type: "BRAND", value: "Farm Direct", surcharge: 3.5 },
        { type: "SIZE", value: "Large Box", surcharge: 8.0 },
      ],
    },
  ];

  const productBySku: Record<string, string> = {};
  const categoryBySku: Record<string, string> = {};
  const variantBySku: Record<string, string> = {};

  for (const p of products) {
    const created = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        category: p.category,
        basePrice: p.basePrice,
        active: true,
      },
      create: {
        name: p.name,
        sku: p.sku,
        description: p.description,
        category: p.category,
        basePrice: p.basePrice,
        active: true,
      },
    });
    productBySku[p.sku] = created.id;
    categoryBySku[p.sku] = p.category;

    for (const v of p.variants) {
      const variantSku = `${p.sku}-${v.type}-${v.value.replace(/\s+/g, "").toUpperCase()}`;
      const variant = await prisma.variant.upsert({
        where: { sku: variantSku },
        update: {
          type: v.type,
          value: v.value,
          surcharge: v.surcharge,
          productId: created.id,
        },
        create: {
          productId: created.id,
          type: v.type,
          value: v.value,
          surcharge: v.surcharge,
          sku: variantSku,
        },
      });
      variantBySku[variantSku] = variant.id;
    }
  }
  const variantCount = await prisma.variant.count();
  console.log(`  products: ${products.length} (variants: ${variantCount})`);

  // ---------------------------------------------------------------- plans
  const plans = [
    {
      name: "Daily Coffee Club",
      description: "One fresh coffee pack delivered every day.",
      productSku: "COF-ARB-001",
      price: 12.0,
      frequency: "DAILY",
      minQuantity: 1,
      startDate: daysFromNow(-5),
      endDate: daysFromNow(60),
      autoClose: true,
      earlyClose: true,
      earlyCloseDays: 7,
      pauseAllowed: true,
      autoRenew: false,
      status: "ACTIVE",
    },
    {
      name: "Weekly Juice Reset",
      description: "A week of cold pressed juice, delivered weekly.",
      productSku: "JUI-CLD-002",
      price: 38.0,
      frequency: "WEEKLY",
      minQuantity: 2,
      startDate: daysFromNow(0),
      endDate: daysFromNow(120),
      autoClose: false,
      earlyClose: true,
      earlyCloseDays: 14,
      pauseAllowed: true,
      autoRenew: true,
      status: "ACTIVE",
    },
    {
      name: "Monthly Bakery Bundle",
      description: "Monthly sourdough and pastry bundle.",
      productSku: "BRD-SRD-003",
      price: 45.0,
      frequency: "MONTHLY",
      minQuantity: 3,
      startDate: daysFromNow(-30),
      endDate: daysFromNow(180),
      autoClose: true,
      earlyClose: false,
      earlyCloseDays: 0,
      pauseAllowed: false,
      autoRenew: true,
      status: "ACTIVE",
    },
    {
      name: "Yearly Dairy Membership",
      description: "Annual grass-fed dairy membership with weekly deliveries.",
      productSku: "MLK-GRS-004",
      price: 480.0,
      frequency: "YEARLY",
      minQuantity: 1,
      startDate: daysFromNow(-90),
      endDate: daysFromNow(275),
      autoClose: true,
      earlyClose: true,
      earlyCloseDays: 30,
      pauseAllowed: true,
      autoRenew: true,
      status: "ACTIVE",
    },
    {
      name: "Monthly Fruit Box (Legacy)",
      description: "Legacy produce plan kept for existing members only.",
      productSku: "FRT-BOX-005",
      price: 55.0,
      frequency: "MONTHLY",
      minQuantity: 1,
      startDate: daysFromNow(-200),
      endDate: daysFromNow(-10),
      autoClose: true,
      earlyClose: false,
      earlyCloseDays: 0,
      pauseAllowed: false,
      autoRenew: false,
      status: "INACTIVE",
    },
  ];

  const planByName: Record<string, string> = {};

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    const data = {
      name: plan.name,
      description: plan.description,
      productId: productBySku[plan.productSku] ?? null,
      price: plan.price,
      frequency: plan.frequency,
      minQuantity: plan.minQuantity,
      startDate: plan.startDate,
      endDate: plan.endDate,
      autoClose: plan.autoClose,
      earlyClose: plan.earlyClose,
      earlyCloseDays: plan.earlyCloseDays,
      pauseAllowed: plan.pauseAllowed,
      autoRenew: plan.autoRenew,
      status: plan.status,
    };
    if (existing) {
      await prisma.plan.update({ where: { id: existing.id }, data });
      planByName[plan.name] = existing.id;
    } else {
      const created = await prisma.plan.create({ data });
      planByName[plan.name] = created.id;
    }
  }
  console.log(`  plans: ${plans.length}`);

  // ------------------------------------------------- quotation templates
  const templates = [
    {
      name: "Standard 30-day",
      description: "Default terms for everyday subscriptions.",
      validityDays: 30,
      terms:
        "Prices valid for 30 days. Payment due within 14 days of invoice.",
      defaultDiscountPercent: 0,
      active: true,
    },
    {
      name: "Premium 45-day",
      description: "Extended validity for enterprise deals.",
      validityDays: 45,
      terms: "Prices valid for 45 days. Loyalty discount applied on quote.",
      defaultDiscountPercent: 5,
      active: true,
    },
    {
      name: "Legacy 14-day",
      description: "Short-lived quote for promotional campaigns.",
      validityDays: 14,
      terms: "Promotional pricing, expires in 14 days.",
      defaultDiscountPercent: 0,
      active: false,
    },
  ];

  const templateByName: Record<string, string> = {};
  for (const t of templates) {
    const existing = await prisma.quotationTemplate.findFirst({
      where: { name: t.name },
    });
    if (existing) {
      await prisma.quotationTemplate.update({ where: { id: existing.id }, data: t });
      templateByName[t.name] = existing.id;
    } else {
      const created = await prisma.quotationTemplate.create({ data: t });
      templateByName[t.name] = created.id;
    }
  }
  console.log(`  quotation templates: ${templates.length}`);

  // ---------------------------------------------------------- tax rules
  const taxRules = [
    { name: "Sales Tax (10%)", rate: 10, scope: "CATEGORY", scopeValue: "Physical Goods", active: true },
    {
      name: "Beverage Levy (5%)",
      rate: 5,
      scope: "CATEGORY",
      scopeValue: "Beverages",
      active: true,
    },
  ];
  for (const r of taxRules) {
    const existing = await prisma.taxRule.findFirst({ where: { name: r.name } });
    if (existing) {
      await prisma.taxRule.update({ where: { id: existing.id }, data: r });
    } else {
      await prisma.taxRule.create({ data: r });
    }
  }
  console.log(`  tax rules: ${taxRules.length}`);

  // ----------------------------------------------------- discount rules
  const discountRules = [
    {
      code: "WELCOME10",
      name: "Welcome 10% off",
      kind: "PERCENT",
      value: 10,
      minSubtotal: 40,
      minQuantity: 0,
      scope: "ALL",
      scopeValue: null,
      maxUses: 100,
      validFrom: null,
      validTo: null,
      active: true,
    },
    {
      code: "BULK5",
      name: "Bulk saver $5",
      kind: "FIXED",
      value: 5,
      minSubtotal: 100,
      minQuantity: 0,
      scope: "ALL",
      scopeValue: null,
      maxUses: 0,
      validFrom: null,
      validTo: null,
      active: true,
    },
    {
      code: "COFFEE15",
      name: "Coffee lovers 15%",
      kind: "PERCENT",
      value: 15,
      minSubtotal: 0,
      minQuantity: 2,
      scope: "CATEGORY",
      scopeValue: "Coffee",
      maxUses: 50,
      validFrom: null,
      validTo: null,
      active: true,
    },
    {
      code: "LAUNCH20",
      name: "Launch Special 20%",
      kind: "PERCENT",
      value: 20,
      minSubtotal: 0,
      minQuantity: 0,
      scope: "ALL",
      scopeValue: null,
      maxUses: 100,
      validFrom: null,
      validTo: null,
      active: true,
    },
    {
      code: "BRIGHT50",
      name: "Brightloop $50 Off",
      kind: "FIXED",
      value: 50,
      minSubtotal: 100,
      minQuantity: 0,
      scope: "ALL",
      scopeValue: null,
      maxUses: 50,
      validFrom: null,
      validTo: null,
      active: true,
    },
  ];
  for (const r of discountRules) {
    await prisma.discountRule.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        kind: r.kind,
        value: r.value,
        minSubtotal: r.minSubtotal,
        minQuantity: r.minQuantity,
        scope: r.scope,
        scopeValue: r.scopeValue,
        maxUses: r.maxUses,
        validFrom: r.validFrom,
        validTo: r.validTo,
        active: r.active,
      },
      create: r,
    });
  }
  console.log(`  discount rules: ${discountRules.length}`);

  // Active rules feed the billing engine while seeding totals.
  const activeTaxRules: TaxRuleLike[] = await prisma.taxRule.findMany({
    where: { active: true },
  });
  const activeDiscountRules: DiscountRuleLike[] = await prisma.discountRule.findMany({
    where: { active: true },
  });

  type SeedLine = {
    productSku: string;
    variantSku?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  };

  const buildLines = (seed: SeedLine[]) =>
    seed.map((l) => ({
      productId: productBySku[l.productSku] ?? null,
      variantId: l.variantSku ? variantBySku[l.variantSku] ?? null : null,
      category: categoryBySku[l.productSku] ?? null,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      amount: round2(l.quantity * l.unitPrice),
    }));

  type BuiltLine = ReturnType<typeof buildLines>[number];
  const toBilling = (lines: BuiltLine[]): BillingLine[] =>
    lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      amount: l.amount,
      productId: l.productId,
      category: l.category,
    }));

  // ------------------------------------------------------- subscriptions
  type SeedSubscription = {
    reference: string;
    customerEmail: string;
    planName: string;
    templateName?: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    quotationValidUntil?: Date;
    closedAt?: Date;
    closedReason?: string;
    notes?: string;
    lines: SeedLine[];
  };

  const subscriptionSeeds: SeedSubscription[] = [
    {
      reference: "SUB-0001",
      customerEmail: "customer1@brightloop.com",
      planName: "Daily Coffee Club",
      status: "ACTIVE",
      startDate: daysFromNow(-20),
      endDate: daysFromNow(60),
      currentPeriodStart: daysFromNow(-2),
      currentPeriodEnd: daysFromNow(-1),
      notes: "Daily coffee delivery, Blue Mountain roast.",
      lines: [
        {
          productSku: "COF-ARB-001",
          variantSku: "COF-ARB-001-BRAND-BLUEMOUNTAIN",
          description: "Arabica Coffee Beans · Blue Mountain",
          quantity: 2,
          unitPrice: 23.5,
        },
      ] as SeedLine[],
    },
    {
      reference: "SUB-0002",
      customerEmail: "customer2@brightloop.com",
      planName: "Weekly Juice Reset",
      status: "ACTIVE",
      startDate: daysFromNow(-30),
      endDate: daysFromNow(120),
      currentPeriodStart: daysFromNow(-7),
      currentPeriodEnd: daysFromNow(0),
      notes: "Weekly juice reset, auto-renews.",
      lines: [
        {
          productSku: "JUI-CLD-002",
          variantSku: "JUI-CLD-002-BRAND-PULPYPREMIUM",
          description: "Cold Pressed Juice · Pulpy Premium",
          quantity: 4,
          unitPrice: 8.25,
        },
      ] as SeedLine[],
    },
    {
      reference: "SUB-0003",
      customerEmail: "customer3@brightloop.com",
      planName: "Monthly Bakery Bundle",
      status: "ACTIVE",
      startDate: daysFromNow(-60),
      endDate: daysFromNow(180),
      currentPeriodStart: daysFromNow(-30),
      currentPeriodEnd: daysFromNow(0),
      notes: "Monthly bakery bundle.",
      lines: [
        {
          productSku: "BRD-SRD-003",
          variantSku: "BRD-SRD-003-BRAND-ARTISANHEARTH",
          description: "Organic Sourdough Bread · Artisan Hearth",
          quantity: 3,
          unitPrice: 7.5,
        },
      ] as SeedLine[],
    },
    {
      reference: "SUB-0004",
      customerEmail: "customer1@brightloop.com",
      planName: "Monthly Bakery Bundle",
      status: "DRAFT",
      startDate: daysFromNow(3),
      endDate: daysFromNow(183),
      notes: "Draft bundle awaiting customer review.",
      lines: [
        {
          productSku: "BRD-SRD-003",
          variantSku: "BRD-SRD-003-SIZE-FAMILYLOAF",
          description: "Organic Sourdough Bread · Family Loaf",
          quantity: 2,
          unitPrice: 8.25,
        },
      ] as SeedLine[],
    },
    {
      reference: "SUB-0005",
      customerEmail: "customer2@brightloop.com",
      planName: "Yearly Dairy Membership",
      templateName: "Premium 45-day",
      status: "QUOTATION",
      startDate: daysFromNow(7),
      endDate: daysFromNow(372),
      quotationValidUntil: daysFromNow(45),
      notes: "Annual dairy membership quotation.",
      lines: [
        {
          productSku: "MLK-GRS-004",
          variantSku: "MLK-GRS-004-PACK-6X1LCRATE",
          description: "Grass-Fed Milk · 6 x 1L Crate",
          quantity: 10,
          unitPrice: 17.4,
        },
      ] as SeedLine[],
    },
    {
      reference: "SUB-0006",
      customerEmail: "customer3@brightloop.com",
      planName: "Weekly Juice Reset",
      status: "CONFIRMED",
      startDate: daysFromNow(2),
      endDate: daysFromNow(122),
      notes: "Confirmed, waiting to go live.",
      lines: [
        {
          productSku: "JUI-CLD-002",
          variantSku: "JUI-CLD-002-SIZE-1LFAMILYBOTTLE",
          description: "Cold Pressed Juice · 1L Family Bottle",
          quantity: 2,
          unitPrice: 9.0,
        },
      ] as SeedLine[],
    },
    {
      reference: "SUB-0007",
      customerEmail: "customer1@brightloop.com",
      planName: "Daily Coffee Club",
      status: "CLOSED",
      startDate: daysFromNow(-40),
      endDate: daysFromNow(20),
      closedAt: daysFromNow(-5),
      closedReason: "Early close requested",
      notes: "Closed early by the customer.",
      lines: [
        {
          productSku: "COF-ARB-001",
          variantSku: "COF-ARB-001-BRAND-BRIGHTLOOPRESERVE",
          description: "Arabica Coffee Beans · Brightloop Reserve",
          quantity: 1,
          unitPrice: 19.0,
        },
      ] as SeedLine[],
    },
    {
      reference: "SUB-0008",
      customerEmail: "customer4@brightloop.com",
      planName: "Weekly Juice Reset",
      status: "ACTIVE",
      startDate: daysFromNow(-14),
      endDate: daysFromNow(106),
      currentPeriodStart: daysFromNow(-7),
      currentPeriodEnd: daysFromNow(0),
      notes: "Weekly juice reset for the Sharma household.",
      lines: [
        {
          productSku: "JUI-CLD-002",
          variantSku: "JUI-CLD-002-BRAND-PULPYPREMIUM",
          description: "Cold Pressed Juice · Pulpy Premium",
          quantity: 6,
          unitPrice: 8.25,
        },
        {
          productSku: "JUI-CLD-002",
          variantSku: "JUI-CLD-002-SIZE-1LFAMILYBOTTLE",
          description: "Cold Pressed Juice · 1L Family Bottle",
          quantity: 2,
          unitPrice: 9.0,
        },
      ] as SeedLine[],
    },
    {
      reference: "SUB-0009",
      customerEmail: "customer5@brightloop.com",
      planName: "Monthly Bakery Bundle",
      status: "ACTIVE",
      startDate: daysFromNow(-75),
      endDate: daysFromNow(105),
      currentPeriodStart: daysFromNow(-30),
      currentPeriodEnd: daysFromNow(0),
      notes: "Monthly bakery bundle for the Fernandes café.",
      lines: [
        {
          productSku: "BRD-SRD-003",
          variantSku: "BRD-SRD-003-BRAND-ARTISANHEARTH",
          description: "Organic Sourdough Bread · Artisan Hearth",
          quantity: 12,
          unitPrice: 7.5,
        },
      ] as SeedLine[],
    },
    {
      reference: "SUB-0010",
      customerEmail: "customer4@brightloop.com",
      planName: "Yearly Dairy Membership",
      status: "ACTIVE",
      startDate: daysFromNow(-95),
      endDate: daysFromNow(270),
      currentPeriodStart: daysFromNow(-30),
      currentPeriodEnd: daysFromNow(0),
      notes: "Annual dairy membership.",
      lines: [
        {
          productSku: "MLK-GRS-004",
          variantSku: "MLK-GRS-004-PACK-6X1LCRATE",
          description: "Grass-Fed Milk · 6 x 1L Crate",
          quantity: 4,
          unitPrice: 17.4,
        },
      ] as SeedLine[],
    },
  ];

  const subscriptionByRef: Record<string, { id: string; lines: BuiltLine[] }> = {};

  for (const s of subscriptionSeeds) {
    const lines = buildLines(s.lines);
    const quantity = lines.reduce((sum, l) => sum + l.quantity, 0);
    const payload = {
      customerId: userByEmail[s.customerEmail] ?? "",
      planId: planByName[s.planName] ?? null,
      templateId: s.templateName ? templateByName[s.templateName] ?? null : null,
      status: s.status,
      quantity,
      startDate: s.startDate,
      endDate: s.endDate,
      currentPeriodStart: s.currentPeriodStart ?? null,
      currentPeriodEnd: s.currentPeriodEnd ?? null,
      quotationValidUntil: s.quotationValidUntil ?? null,
      closedAt: s.closedAt ?? null,
      closedReason: s.closedReason ?? null,
      notes: s.notes ?? null,
    };

    const sub = await prisma.subscription.upsert({
      where: { reference: s.reference },
      update: payload,
      create: { reference: s.reference, ...payload },
    });

    // Deterministic: rebuild lines and events on every seed run.
    await prisma.subscriptionLine.deleteMany({ where: { subscriptionId: sub.id } });
    await prisma.subscriptionLine.createMany({
      data: lines.map((l) => ({
        subscriptionId: sub.id,
        productId: l.productId,
        variantId: l.variantId,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        amount: l.amount,
      })),
    });

    const totals = computeInvoiceTotals(
      toBilling(lines),
      activeTaxRules,
      activeDiscountRules,
    );
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        discountTotal: totals.discountTotal,
        total: totals.total,
      },
    });

    await prisma.subscriptionEvent.deleteMany({ where: { subscriptionId: sub.id } });
    await prisma.subscriptionEvent.create({
      data: { subscriptionId: sub.id, type: "CREATE", status: s.status, note: "Seeded" },
    });
    if (s.status === "CLOSED") {
      await prisma.subscriptionEvent.create({
        data: {
          subscriptionId: sub.id,
          type: "EARLY_CLOSE",
          status: "CLOSED",
          note: s.closedReason ?? undefined,
        },
      });
    }

    subscriptionByRef[s.reference] = { id: sub.id, lines };
  }
  console.log(`  subscriptions: ${subscriptionSeeds.length}`);

  // ------------------------------------------------------------ invoices
  type PaymentSeed = {
    /** share of the invoice total to pay (1 = fully settled) */
    portion: number;
    method: string;
    reference?: string;
    paidAt: Date;
  };

  type InvoiceSeed = {
    number: string;
    reference: string;
    customerEmail: string;
    status: string;
    periodStart: Date;
    periodEnd: Date;
    issuedAt?: Date;
    confirmedAt?: Date;
    cancelledAt?: Date;
    dueAt?: Date;
    payments?: PaymentSeed[];
  };

  const staffId = userByEmail["staff1@brightloop.com"];

  const invoiceSeeds: InvoiceSeed[] = [
    {
      // Fully settled — PAID
      number: "INV-0001",
      reference: "SUB-0001",
      customerEmail: "customer1@brightloop.com",
      status: "PAID",
      periodStart: daysFromNow(-5),
      periodEnd: daysFromNow(-4),
      issuedAt: daysFromNow(-5),
      confirmedAt: daysFromNow(-5),
      dueAt: daysFromNow(9),
      payments: [
        {
          portion: 1,
          method: "CARD",
          reference: "VISA-4421",
          paidAt: daysFromNow(-4),
        },
      ],
    },
    {
      // Issued, not yet due, unpaid — OUTSTANDING
      number: "INV-0002",
      reference: "SUB-0001",
      customerEmail: "customer1@brightloop.com",
      status: "CONFIRMED",
      periodStart: daysFromNow(-4),
      periodEnd: daysFromNow(-3),
      issuedAt: daysFromNow(-4),
      confirmedAt: daysFromNow(-4),
      dueAt: daysFromNow(10),
    },
    {
      // Past due, unpaid — OVERDUE
      number: "INV-0003",
      reference: "SUB-0003",
      customerEmail: "customer3@brightloop.com",
      status: "CONFIRMED",
      periodStart: daysFromNow(-60),
      periodEnd: daysFromNow(-30),
      issuedAt: daysFromNow(-60),
      confirmedAt: daysFromNow(-59),
      dueAt: daysFromNow(-46),
    },
    {
      // Void — CANCELLED
      number: "INV-0004",
      reference: "SUB-0007",
      customerEmail: "customer1@brightloop.com",
      status: "CANCELLED",
      periodStart: daysFromNow(-40),
      periodEnd: daysFromNow(-39),
      issuedAt: daysFromNow(-40),
      cancelledAt: daysFromNow(-39),
      dueAt: daysFromNow(-26),
    },
    {
      // Fully settled — PAID
      number: "INV-0005",
      reference: "SUB-0002",
      customerEmail: "customer2@brightloop.com",
      status: "PAID",
      periodStart: daysFromNow(-14),
      periodEnd: daysFromNow(-7),
      issuedAt: daysFromNow(-14),
      confirmedAt: daysFromNow(-14),
      dueAt: daysFromNow(5),
      payments: [
        {
          portion: 1,
          method: "BANK_TRANSFER",
          reference: "NEFT-88213",
          paidAt: daysFromNow(-11),
        },
      ],
    },
    {
      // Partly paid, not yet due — PARTIAL
      number: "INV-0006",
      reference: "SUB-0002",
      customerEmail: "customer2@brightloop.com",
      status: "CONFIRMED",
      periodStart: daysFromNow(-7),
      periodEnd: daysFromNow(0),
      issuedAt: daysFromNow(-7),
      confirmedAt: daysFromNow(-7),
      dueAt: daysFromNow(7),
      payments: [
        {
          portion: 0.4,
          method: "UPI",
          reference: "UPI-5591",
          paidAt: daysFromNow(-3),
        },
      ],
    },
    {
      // Past due and only partly paid — OVERDUE (partial)
      number: "INV-0007",
      reference: "SUB-0003",
      customerEmail: "customer3@brightloop.com",
      status: "CONFIRMED",
      periodStart: daysFromNow(-30),
      periodEnd: daysFromNow(0),
      issuedAt: daysFromNow(-30),
      confirmedAt: daysFromNow(-29),
      dueAt: daysFromNow(-16),
      payments: [
        {
          portion: 0.3,
          method: "CASH",
          reference: "Counter payment",
          paidAt: daysFromNow(-24),
        },
        {
          portion: 0.2,
          method: "CARD",
          reference: "VISA-9930",
          paidAt: daysFromNow(-12),
        },
      ],
    },
    {
      // Issued, not yet due — OUTSTANDING
      number: "INV-0008",
      reference: "SUB-0008",
      customerEmail: "customer4@brightloop.com",
      status: "CONFIRMED",
      periodStart: daysFromNow(-7),
      periodEnd: daysFromNow(0),
      issuedAt: daysFromNow(-7),
      confirmedAt: daysFromNow(-7),
      dueAt: daysFromNow(7),
    },
    {
      // Draft, awaiting confirmation
      number: "INV-0009",
      reference: "SUB-0009",
      customerEmail: "customer5@brightloop.com",
      status: "DRAFT",
      periodStart: daysFromNow(-30),
      periodEnd: daysFromNow(0),
      issuedAt: daysFromNow(-1),
    },
    {
      // Fully settled — PAID
      number: "INV-0010",
      reference: "SUB-0009",
      customerEmail: "customer5@brightloop.com",
      status: "PAID",
      periodStart: daysFromNow(-60),
      periodEnd: daysFromNow(-30),
      issuedAt: daysFromNow(-60),
      confirmedAt: daysFromNow(-60),
      dueAt: daysFromNow(-46),
      payments: [
        {
          portion: 1,
          method: "BANK_TRANSFER",
          reference: "NEFT-77120",
          paidAt: daysFromNow(-52),
        },
      ],
    },
    {
      // Past due, unpaid — OVERDUE
      number: "INV-0011",
      reference: "SUB-0010",
      customerEmail: "customer4@brightloop.com",
      status: "CONFIRMED",
      periodStart: daysFromNow(-60),
      periodEnd: daysFromNow(-30),
      issuedAt: daysFromNow(-60),
      confirmedAt: daysFromNow(-59),
      dueAt: daysFromNow(-40),
    },
    {
      // Issued, not yet due — OUTSTANDING
      number: "INV-0012",
      reference: "SUB-0010",
      customerEmail: "customer4@brightloop.com",
      status: "CONFIRMED",
      periodStart: daysFromNow(-30),
      periodEnd: daysFromNow(0),
      issuedAt: daysFromNow(-30),
      confirmedAt: daysFromNow(-30),
      dueAt: daysFromNow(14),
    },
  ];

  let invoicesCreated = 0;
  let paymentsCreated = 0;

  for (const inv of invoiceSeeds) {
    const sub = subscriptionByRef[inv.reference];
    if (!sub) continue;

    const billing = toBilling(sub.lines);
    const totals = computeInvoiceTotals(billing, activeTaxRules, activeDiscountRules);

    let invoice = await prisma.invoice.findUnique({ where: { number: inv.number } });

    if (!invoice) {
      invoice = await prisma.invoice.create({
        data: {
          number: inv.number,
          subscriptionId: sub.id,
          customerId: userByEmail[inv.customerEmail] ?? "",
          status: inv.status,
          periodStart: inv.periodStart,
          periodEnd: inv.periodEnd,
          issuedAt: inv.issuedAt ?? new Date(),
          confirmedAt: inv.confirmedAt ?? null,
          cancelledAt: inv.cancelledAt ?? null,
          dueAt: inv.dueAt ?? null,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          discountTotal: totals.discountTotal,
          total: totals.total,
          lines: {
            create: billing.map((l) => ({
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

      // Cancelled invoices release their discount usage; all others consume it.
      if (inv.status !== "CANCELLED") {
        for (const applied of totals.discounts) {
          await prisma.discountUsage.create({
            data: {
              discountRuleId: applied.ruleId,
              invoiceId: invoice.id,
              amount: applied.amount,
            },
          });
          await prisma.discountRule.update({
            where: { id: applied.ruleId },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      invoicesCreated += 1;
    }

    // Payments are recorded once; amounts are fractions of the invoice total.
    const existingPayments = await prisma.payment.count({
      where: { invoiceId: invoice.id },
    });
    if (existingPayments === 0 && inv.payments?.length) {
      for (const payment of inv.payments) {
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: round2(totals.total * payment.portion),
            method: payment.method,
            reference: payment.reference ?? null,
            recordedById: staffId,
            paidAt: payment.paidAt,
          },
        });
        paymentsCreated += 1;
      }
    }

    // Derive paidAmount + status from the recorded payments.
    if (inv.status === "CANCELLED") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { paidAmount: 0 },
      });
      continue;
    }

    const aggregate = await prisma.payment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amount: true },
    });
    const paidAmount = round2(aggregate._sum.amount ?? 0);
    const fullyPaid = totals.total > 0 && paidAmount >= totals.total - 0.005;
    const lastPayment = inv.payments?.at(-1)?.paidAt;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount,
        status: fullyPaid ? "PAID" : inv.status,
        paidAt: fullyPaid ? (invoice.paidAt ?? lastPayment ?? new Date()) : null,
        confirmedAt:
          invoice.confirmedAt ??
          inv.confirmedAt ??
          (inv.status === "DRAFT" ? null : (inv.issuedAt ?? new Date())),
      },
    });
  }

  console.log(
    `  invoices: ${invoiceSeeds.length} (created ${invoicesCreated}, payments ${paymentsCreated})`,
  );

  console.log("\nSeed complete. Logins:");
  console.log("  ADMIN    admin@brightloop.com     / Admin@123");
  console.log("  STAFF    staff1@brightloop.com    / Staff@123");
  console.log("  STAFF    staff2@brightloop.com    / Staff@123");
  console.log("  CUSTOMER customer1@brightloop.com / Customer@123");
  console.log("  CUSTOMER customer2@brightloop.com / Customer@123");
  console.log("  CUSTOMER customer3@brightloop.com / Customer@123");
  console.log("  CUSTOMER customer4@brightloop.com / Customer@123");
  console.log("  CUSTOMER customer5@brightloop.com / Customer@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
