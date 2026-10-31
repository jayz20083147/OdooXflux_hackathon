import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invoiceBalance, invoicePaymentState } from "@/lib/constants";
import { generateDueInvoices } from "@/lib/billing-service";
import { prisma } from "@/lib/prisma";

export function formatInvoice(inv: any) {
  const balance = invoiceBalance(inv);
  const paymentState = invoicePaymentState(inv);
  const status =
    inv.status === "PAID"
      ? "PAID"
      : inv.status === "CANCELLED"
      ? "CANCELLED"
      : inv.status === "DRAFT"
      ? "DRAFT"
      : inv.paidAmount > 0
      ? "PARTIAL"
      : "OPEN";

  return {
    ...inv,
    lifecycleStatus: inv.status,
    status,
    invoiceNumber: inv.number,
    totalAmount: inv.total,
    amountPaid: inv.paidAmount,
    balance,
    paymentState,
    dueDate: inv.dueAt,
  };
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");
    const status = searchParams.get("status");

    const where: any = {};
    if (session.user.role === "CUSTOMER") {
      where.customerId = session.user.id;
    }

    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (status && status !== "ALL") where.status = status;

    const rawInvoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        subscription: { select: { id: true, reference: true } },
        lines: true,
        payments: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    const invoices = rawInvoices.map(formatInvoice);
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("GET /api/invoices error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role === "CUSTOMER") {
      return NextResponse.json({ error: "Forbidden: Staff or Admin role required" }, { status: 403 });
    }

    const result = await generateDueInvoices();
    return NextResponse.json({ result, message: "Invoices generated" });
  } catch (error) {
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ error: "Failed to generate invoices" }, { status: 500 });
  }
}
