import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invoiceBalance, roundMoney } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const method = searchParams.get("method");

    const where: any = {};
    if (session.user.role === "CUSTOMER") {
      where.invoice = { customerId: session.user.id };
    }

    if (method && method !== "ALL") {
      where.method = method;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            total: true,
            paidAmount: true,
            status: true,
            customer: { select: { id: true, name: true, email: true } },
          },
        },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { paidAt: "desc" },
    });

    const formatted = payments.map((p) => {
      const balance = invoiceBalance(p.invoice);
      return {
        ...p,
        paymentNumber: p.reference ?? `PAY-${p.id.slice(-6).toUpperCase()}`,
        paymentDate: p.paidAt,
        customer: p.invoice.customer,
        invoice: {
          ...p.invoice,
          invoiceNumber: p.invoice.number,
          totalAmount: p.invoice.total,
          amountPaid: p.invoice.paidAmount,
          balance,
        },
      };
    });

    return NextResponse.json({ payments: formatted });
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const invoiceId = String(body.invoiceId ?? "").trim();
    const paymentAmount = Number(body.amount ?? 0);
    const method = String(body.method ?? "BANK_TRANSFER").toUpperCase();
    const note = body.note ? String(body.note).trim() : null;
    const paidAt = body.paymentDate ? new Date(body.paymentDate) : new Date();

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Customer Isolation Check: customer can only pay their own invoice
    if (session.user.role === "CUSTOMER" && invoice.customerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only pay your own invoices" },
        { status: 403 },
      );
    }

    const currentBalance = invoiceBalance(invoice);
    if (currentBalance <= 0 || invoice.status === "PAID") {
      return NextResponse.json({ error: "This invoice is already fully paid" }, { status: 400 });
    }

    if (paymentAmount > currentBalance + 0.005) {
      return NextResponse.json(
        { error: `Payment amount exceeds outstanding balance of $${currentBalance.toFixed(2)}` },
        { status: 400 },
      );
    }

    // Atomic transaction: create payment and update invoice state
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: roundMoney(paymentAmount),
          method,
          reference: body.reference ?? `PAY-${Date.now().toString().slice(-6)}`,
          note,
          recordedById: session.user.id,
          paidAt,
        },
      });

      const agg = await tx.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });
      const newPaidAmount = roundMoney(agg._sum.amount ?? 0);
      const isFullyPaid = invoice.total > 0 && newPaidAmount >= invoice.total - 0.005;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? "PAID" : "CONFIRMED",
          paidAt: isFullyPaid ? (invoice.paidAt ?? paidAt) : null,
          confirmedAt: invoice.confirmedAt ?? new Date(),
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    const newBalance = invoiceBalance(result.invoice);
    const formattedInvoice = {
      ...result.invoice,
      invoiceNumber: result.invoice.number,
      totalAmount: result.invoice.total,
      amountPaid: result.invoice.paidAmount,
      balance: newBalance,
      status: result.invoice.status === "PAID" ? "PAID" : (result.invoice.paidAmount > 0 ? "PARTIAL" : "OPEN"),
    };

    return NextResponse.json(
      {
        payment: result.payment,
        invoice: formattedInvoice,
        message:
          result.invoice.status === "PAID"
            ? "Payment recorded. Invoice is now FULLY PAID!"
            : `Payment of $${paymentAmount.toFixed(2)} recorded. Remaining balance: $${newBalance.toFixed(2)}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}

