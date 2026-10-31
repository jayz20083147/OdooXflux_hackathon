import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function runVerification() {
  console.log("=================================================");
  console.log("🚀 STARTING BRIGHTLOOP SANITY VERIFICATION TESTS");
  console.log(`🌐 TARGET SERVER: ${BASE_URL}`);
  console.log("=================================================");

  const prisma = new PrismaClient();

  // 1. Password validation tests on Register API
  console.log("\n[TEST 1] Testing Strict Password Policy on Registration...");

  // 1a. Password too short (<8 chars)
  const shortPwdRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "testshort@example.com",
      password: "Short1!", // 7 chars
    }),
  });
  console.log(" - Password <8 chars status:", shortPwdRes.status, "(expected 400)");
  if (shortPwdRes.status !== 400) throw new Error("Expected 400 for short password");

  // 1b. Password missing special char
  const noSpecialRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: "testnospecial@example.com",
      password: "Password12345", // no special char
    }),
  });
  console.log(" - Password without special char status:", noSpecialRes.status, "(expected 400)");
  if (noSpecialRes.status !== 400) throw new Error("Expected 400 for password missing special char");

  // 1c. Valid registration
  const testCustomerEmail = `cust_${Date.now()}@customer.com`;
  const validRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Sanity Customer",
      email: testCustomerEmail,
      password: "CustomerValidPass2026!",
    }),
  });
  const regData = await validRegRes.json();
  console.log(" - Valid Registration status:", validRegRes.status, "(expected 201), role:", regData.user?.role);
  if (validRegRes.status !== 201 || regData.user?.role !== "CUSTOMER") {
    throw new Error("Registration failed or role not CUSTOMER");
  }

  console.log("\n=================================================");
  console.log("🎉 SANITY VERIFICATION PASSED SUCCESSFULLY!");
  console.log("=================================================");

  await prisma.$disconnect();
}

runVerification().catch((err) => {
  console.error("❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});

