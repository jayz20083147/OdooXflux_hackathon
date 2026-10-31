import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runFullVerification() {
  console.log("=====================================================================");
  console.log("🚀 STARTING COMPLETE BRIGHTLOOP E2E PROBLEM STATEMENT SCENE VERIFICATION");
  console.log(`🌐 TARGET SERVER: ${BASE_URL}`);
  console.log("=====================================================================");

  const prisma = new PrismaClient();

  // Helper to get CSRF token and cookie
  async function getCsrfToken() {
    const res = await fetch(`${BASE_URL}/api/auth/csrf`);
    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie") || ""];
    const cookieHeader = rawCookies.map((c) => c.split(";")[0]).join("; ");
    const data = await res.json();
    return { csrfToken: data.csrfToken, cookieHeader };
  }

  // Helper to sign in and retrieve session cookie
  async function loginAs(email: string, password: string) {
    const { csrfToken, cookieHeader } = await getCsrfToken();
    const params = new URLSearchParams();
    params.append("csrfToken", csrfToken);
    params.append("email", email);
    params.append("password", password);
    params.append("redirectTo", "false");
    params.append("json", "true");

    const res = await fetch(`${BASE_URL}/api/auth/callback/credentials?`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: params.toString(),
      redirect: "manual",
    });

    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie") || ""];
    const parsedCookie = setCookies.map((c) => c.split(";")[0]).join("; ");
    return parsedCookie;
  }

  // --------------------------------------------------------------------------------
  // SCENE 1: New Customer Signup
  // --------------------------------------------------------------------------------
  console.log("\n[SCENE 1] New Customer Signup");
  const customerEmail = `e2e_cust_${Date.now()}@brightcustomer.io`;
  const customerPassword = "SecureCustomer2026!";
  const customerName = "E2E Enterprise Customer";

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: customerName,
      email: customerEmail,
      password: customerPassword,
    }),
  });
  const regData = await regRes.json();
  console.log(` - Register Status: ${regRes.status} (expected 201)`);
  console.log(` - Registered User: ${regData.user?.email}, Role: ${regData.user?.role}`);
  if (regRes.status !== 201 || regData.user?.role !== "CUSTOMER") {
    throw new Error("Scene 1 Failed: Customer signup did not succeed or role is not CUSTOMER");
  }
  const newCustomerId = regData.user.id;

  // --------------------------------------------------------------------------------
  // SCENE 2: Admin Creates Product, Plan, and Discount Code
  // --------------------------------------------------------------------------------
  console.log("\n[SCENE 2] Admin Creates Product with Variant, Plan, and Discount Code");
  const adminCookie = await loginAs("admin@brightloop.com", "Admin@123");

  // 2a. Admin creates Product with Odoo Variant (+560)
  const productRes = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      name: `Brightloop ERP Synchronizer Pro ${Date.now()}`,
      type: "SERVICE",
      salesPrice: 400.0,
      costPrice: 120.0,
      notes: "E2E Scene test product with brand variant",
      variants: [
        {
          attributeName: "Brand",
          attributeValue: "Odoo Enterprise Edition",
          priceExtra: 560.0,
        },
      ],
    }),
  });
  const prodData = await productRes.json();
  console.log(` - Admin Product Created: ${prodData.product?.name} (ID: ${prodData.product?.id})`);
  console.log(` - Variants:`, prodData.product?.variants?.map((v: any) => `${v.type || v.attributeName}: ${v.value || v.attributeValue} (+$${v.surcharge ?? v.priceExtra})`));
  if (productRes.status !== 201 || !prodData.product?.id) {
    throw new Error("Scene 2 Failed: Product creation failed");
  }
  const testProductId = prodData.product.id;
  const testVariantId = prodData.product.variants[0]?.id;

  // 2b. Admin creates Plan
  const planRes = await fetch(`${BASE_URL}/api/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      productId: testProductId,
      name: "ERP Sync Monthly Pro Tier",
      billingFrequency: "MONTHLY",
      price: 350.0,
      minQuantity: 1,
      autoCloseOnEnd: false,
      allowEarlyClose: true,
      allowPause: true,
      allowRenew: true,
    }),
  });
  const planData = await planRes.json();
  console.log(` - Admin Plan Created: ${planData.plan?.name} (ID: ${planData.plan?.id}, Price: $${planData.plan?.price}/mo)`);
  if (planRes.status !== 201 || !planData.plan?.id) {
    throw new Error("Scene 2 Failed: Plan creation failed");
  }
  const testPlanId = planData.plan.id;

  // 2c. Admin creates Discount Code
  const discountCode = `PROMO${Math.floor(1000 + Math.random() * 9000)}`;
  const discountRes = await fetch(`${BASE_URL}/api/discounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      code: discountCode,
      name: "15% E2E Promo Special",
      type: "PERCENTAGE",
      value: 15.0, // 15% discount
      maxUses: 50,
      isActive: true,
    }),
  });
  const discountData = await discountRes.json();
  console.log(` - Admin Discount Created: ${discountData.discount?.code} (${discountData.discount?.value}% OFF, Name: ${discountData.discount?.name})`);
  if (discountRes.status !== 201 || !discountData.discount?.id) {
    throw new Error(`Scene 2 Failed: Discount creation failed with status ${discountRes.status}`);
  }

  // --------------------------------------------------------------------------------
  // SCENE 3: Staff Provisions Subscription for Customer with Discount
  // --------------------------------------------------------------------------------
  console.log("\n[SCENE 3] Staff Creates Subscription for Customer with Discount");
  const staffCookie = await loginAs("staff1@brightloop.com", "Staff@123");

  // Expected math:
  // Base Plan = $350.00
  // Variant Extra (Odoo Enterprise) = +$560.00
  // Unit Price = 350 + 560 = $910.00
  // Quantity = 2
  // Subtotal before discount = 910 * 2 = $1,820.00
  // Discount = 15% of 1820 = $273.00
  // Expected Recurring Total = 1820 - 273 = $1,547.00
  const subRes = await fetch(`${BASE_URL}/api/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: staffCookie },
    body: JSON.stringify({
      customerId: newCustomerId,
      planId: testPlanId,
      variantId: testVariantId,
      discountCode: discountCode,
      quantity: 2,
      generateFirstInvoice: true,
    }),
  });
  const subData = await subRes.json();
  console.log(` - Staff Created Subscription Status: ${subRes.status}`);
  console.log(` - Sub Number: ${subData.subscription?.subscriptionNumber || subData.subscription?.reference}, Status: ${subData.subscription?.status}`);
  console.log(` - Unit Price: $${subData.subscription?.unitPrice}, Qty: ${subData.subscription?.quantity}`);
  console.log(` - Discount: $${subData.subscription?.discountAmount}, Recurring Total: $${subData.subscription?.recurringTotal || subData.subscription?.total}`);
  
  if (subRes.status !== 201 || !subData.subscription?.id) {
    throw new Error(`Scene 3 Failed: Subscription creation failed: ${JSON.stringify(subData)}`);
  }
  const recurringTotal = Number(subData.subscription.recurringTotal ?? subData.subscription.total);
  if (recurringTotal !== 1547) {
    throw new Error(`Scene 3 Pricing Math mismatch: expected $1547, got ${recurringTotal}`);
  }
  const testSubscriptionId = subData.subscription.id;

  // --------------------------------------------------------------------------------
  // SCENE 4: Verify Initial Auto-Generated Invoice
  // --------------------------------------------------------------------------------
  console.log("\n[SCENE 4] Verify Auto-Generated Invoice for Subscription");
  const invoicesRes = await fetch(`${BASE_URL}/api/invoices`, {
    headers: { Cookie: staffCookie },
  });
  const invoicesData = await invoicesRes.json();
  const matchingInvoice = invoicesData.invoices?.find((inv: any) => inv.subscriptionId === testSubscriptionId);
  
  if (!matchingInvoice) {
    throw new Error("Scene 4 Failed: No auto-generated invoice found for subscription");
  }

  console.log(` - Invoice Number: ${matchingInvoice.invoiceNumber || matchingInvoice.number}`);
  console.log(` - Total: $${matchingInvoice.totalAmount || matchingInvoice.total}, Paid: $${matchingInvoice.amountPaid || matchingInvoice.paidAmount}, Balance: $${matchingInvoice.balance}, Status: ${matchingInvoice.status}`);
  const invTotal = Number(matchingInvoice.totalAmount ?? matchingInvoice.total);
  const invBalance = Number(matchingInvoice.balance);
  if ((matchingInvoice.status !== "OPEN" && matchingInvoice.status !== "CONFIRMED") || invTotal !== 1547 || invBalance !== 1547) {
    throw new Error(`Scene 4 Failed: Invoice status or amount is incorrect (status: ${matchingInvoice.status}, total: ${invTotal}, balance: ${invBalance})`);
  }
  const testInvoiceId = matchingInvoice.id;

  // --------------------------------------------------------------------------------
  // SCENE 5: Record Payment Against Invoice (Verify auto-update to PAID)
  // --------------------------------------------------------------------------------
  console.log("\n[SCENE 5] Record Payment Against Invoice (Testing auto-status transition to PAID)");

  // 5a. First record a partial payment of $547
  console.log(" - Step 5a: Recording partial payment of $547.00...");
  const partialPayRes = await fetch(`${BASE_URL}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: staffCookie },
    body: JSON.stringify({
      invoiceId: testInvoiceId,
      amount: 547.0,
      method: "CREDIT_CARD",
      paymentDate: new Date().toISOString(),
      note: "Partial payment installment 1",
    }),
  });
  const partialPayData = await partialPayRes.json();
  console.log(`   Partial Payment Status: ${partialPayRes.status}, Payment ID: ${partialPayData.payment?.id}`);
  
  // Verify invoice updated to PARTIAL with balance $1000
  const verifyPartialRes = await fetch(`${BASE_URL}/api/invoices/${testInvoiceId}`, {
    headers: { Cookie: staffCookie },
  });
  const verifyPartialData = await verifyPartialRes.json();
  const pPaid = Number(verifyPartialData.invoice?.amountPaid ?? verifyPartialData.invoice?.paidAmount);
  const pBal = Number(verifyPartialData.invoice?.balance);
  console.log(`   Invoice after partial payment: Status=${verifyPartialData.invoice?.status}, Paid=$${pPaid}, Remaining Balance=$${pBal}`);
  if (verifyPartialData.invoice?.status !== "PARTIAL" || pPaid !== 547 || pBal !== 1000) {
    throw new Error("Scene 5a Failed: Partial payment did not update invoice to PARTIAL");
  }

  // 5b. Record remaining payment of $1000
  console.log(" - Step 5b: Recording final payment of $1,000.00...");
  const finalPayRes = await fetch(`${BASE_URL}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: staffCookie },
    body: JSON.stringify({
      invoiceId: testInvoiceId,
      amount: 1000.0,
      method: "BANK_TRANSFER",
      paymentDate: new Date().toISOString(),
      note: "Full settlement wire transfer",
    }),
  });
  const finalPayData = await finalPayRes.json();
  console.log(`   Final Payment Status: ${finalPayRes.status}, Payment ID: ${finalPayData.payment?.id}`);

  // Verify invoice updated to PAID with balance $0 and paidAt timestamp set
  const verifyPaidRes = await fetch(`${BASE_URL}/api/invoices/${testInvoiceId}`, {
    headers: { Cookie: staffCookie },
  });
  const verifyPaidData = await verifyPaidRes.json();
  const fBal = Number(verifyPaidData.invoice?.balance);
  console.log(`   Invoice after final payment: Status=${verifyPaidData.invoice?.status}, Paid=$${verifyPaidData.invoice?.paidAmount}, Balance=$${fBal}, PaidAt=${verifyPaidData.invoice?.paidAt}`);
  if (verifyPaidData.invoice?.status !== "PAID" || fBal !== 0 || !verifyPaidData.invoice?.paidAt) {
    throw new Error("Scene 5b Failed: Full payment did not transition invoice to PAID or balance is not zero");
  }

  // --------------------------------------------------------------------------------
  // SCENE 6: Customer Portal Isolation Verification
  // --------------------------------------------------------------------------------
  console.log("\n[SCENE 6] Customer Portal Isolation Verification");
  const customerCookie = await loginAs(customerEmail, customerPassword);

  // 6a. Customer queries their subscriptions
  const custSubsRes = await fetch(`${BASE_URL}/api/subscriptions`, {
    headers: { Cookie: customerCookie },
  });
  const custSubsData = await custSubsRes.json();
  console.log(` - Customer Subscriptions count: ${custSubsData.subscriptions?.length}`);
  const hasOnlyOwnSub = custSubsData.subscriptions?.every((s: any) => s.customerId === newCustomerId);
  console.log(` - Customer only sees own subscriptions: ${hasOnlyOwnSub}`);
  if (!hasOnlyOwnSub || custSubsData.subscriptions?.length !== 1) {
    throw new Error("Scene 6 Failed: Customer sees subscriptions belonging to others or missing own subscription");
  }

  // 6b. Customer queries their invoices
  const custInvoicesRes = await fetch(`${BASE_URL}/api/invoices`, {
    headers: { Cookie: customerCookie },
  });
  const custInvoicesData = await custInvoicesRes.json();
  console.log(` - Customer Invoices count: ${custInvoicesData.invoices?.length}`);
  const hasOnlyOwnInvoices = custInvoicesData.invoices?.every((inv: any) => inv.customerId === newCustomerId);
  console.log(` - Customer only sees own invoices: ${hasOnlyOwnInvoices}`);
  if (!hasOnlyOwnInvoices || custInvoicesData.invoices?.length !== 1) {
    throw new Error("Scene 6 Failed: Customer invoice isolation failed");
  }

  // 6c. Security test: Customer tries to access staff/admin restricted endpoints
  const custTriesStaffCreation = await fetch(`${BASE_URL}/api/users/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: customerCookie },
    body: JSON.stringify({ email: "evil@customer.com" }),
  });
  console.log(` - Customer calls /api/users/staff: Status ${custTriesStaffCreation.status} (expected 403 Forbidden)`);
  if (custTriesStaffCreation.status !== 403) {
    throw new Error("Scene 6 Failed: Customer was not blocked from staff creation endpoint");
  }

  const custTriesCreateProduct = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: customerCookie },
    body: JSON.stringify({ name: "Hacked Product" }),
  });
  console.log(` - Customer calls /api/products (POST): Status ${custTriesCreateProduct.status} (expected 403 Forbidden)`);
  if (custTriesCreateProduct.status !== 403) {
    throw new Error("Scene 6 Failed: Customer was not blocked from product creation endpoint");
  }

  // --------------------------------------------------------------------------------
  // SCENE 7: Finance Dashboard Verification for Admin/Staff
  // --------------------------------------------------------------------------------
  console.log("\n[SCENE 7] Finance Dashboard Metrics Verification for Staff/Admin");
  const financeStart = performance.now();
  const financeRes = await fetch(`${BASE_URL}/api/finance`, {
    headers: { Cookie: staffCookie },
  });
  const financeElapsed = (performance.now() - financeStart).toFixed(1);
  const financeData = await financeRes.json();

  console.log(` - Finance API Response Time: ${financeElapsed} ms (Fast!)`);
  console.log(` - Metrics:`);
  console.log(`   * Active Subscriptions Count: ${financeData.metrics?.activeSubscriptionsCount}`);
  console.log(`   * Revenue This Month: $${financeData.metrics?.revenueThisMonth}`);
  console.log(`   * Total Settled Revenue: $${financeData.metrics?.totalRevenue}`);
  console.log(`   * Outstanding Receivables: $${financeData.metrics?.outstandingAmount}`);
  console.log(`   * Overdue Invoices Count: ${financeData.metrics?.overdueCount} (Sum: $${financeData.metrics?.overdueAmount})`);

  if (financeRes.status !== 200 || !financeData.metrics) {
    throw new Error("Scene 7 Failed: Finance metrics API failed");
  }
  if (typeof financeData.metrics.activeSubscriptionsCount !== "number" || financeData.metrics.activeSubscriptionsCount < 1) {
    throw new Error("Scene 7 Failed: Active subscriptions count is invalid");
  }

  console.log("\n=====================================================================");
  console.log("🎉 ALL 7 PROBLEM STATEMENT SCENES VERIFIED WITH 100% SUCCESS!");
  console.log("=====================================================================");

  await prisma.$disconnect();
}

runFullVerification().catch((err) => {
  console.error("❌ E2E VERIFICATION FAILED:", err);
  process.exit(1);
});

