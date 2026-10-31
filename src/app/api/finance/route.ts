import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { invoiceBalance, invoicePaymentState } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Forbidden: Staff or Admin role required" }, { status: 403 });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeSubscriptionsCount, invoices, allPayments, thisMonthPayments] =
      await Promise.all([
        prisma.subscription.count({ where: { status: "ACTIVE" } }),
        prisma.invoice.findMany({
          include: {
            customer: { select: { id: true, name: true, email: true } },
            subscription: { select: { id: true, reference: true } },
          },
          orderBy: { issuedAt: "desc" },
        }),
        prisma.payment.findMany({
          take: 10,
          orderBy: { paidAt: "desc" },
          include: {
            invoice: {
              select: {
                id: true,
                number: true,
                customer: { select: { id: true, name: true, email: true } },
              },
            },
          },
        }),
        prisma.payment.aggregate({
          where: { paidAt: { gte: firstDayOfMonth } },
          _sum: { amount: true },
        }),
      ]);

    const overdueInvoices: any[] = [];
    let outstandingAmount = 0;
    let overdueAmount = 0;

    for (const inv of invoices) {
      if (inv.status === "CANCELLED" || inv.status === "DRAFT") continue;
      const balance = invoiceBalance(inv);
      const state = invoicePaymentState(inv, now);

      if (balance > 0) {
        outstandingAmount += balance;
      }

      if (state === "OVERDUE") {
        overdueAmount += balance;
        overdueInvoices.push({
          ...inv,
          invoiceNumber: inv.number,
          totalAmount: inv.total,
          amountPaid: inv.paidAmount,
          balance,
          dueDate: inv.dueAt,
        });
      }
    }

    const totalRevenueAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
    });
    const totalRevenue = totalRevenueAgg._sum.amount ?? 0;
    const revenueThisMonth = thisMonthPayments._sum.amount ?? 0;

    const formattedRecentPayments = allPayments.map((p) => ({
      ...p,
      paymentNumber: p.reference ?? `PAY-${p.id.slice(-6).toUpperCase()}`,
      paymentDate: p.paidAt,
      customer: p.invoice.customer,
      invoice: {
        ...p.invoice,
        invoiceNumber: p.invoice.number,
      },
    }));

    const formattedRecentInvoices = invoices.slice(0, 10).map((inv) => ({
      ...inv,
      invoiceNumber: inv.number,
      totalAmount: inv.total,
      amountPaid: inv.paidAmount,
      balance: invoiceBalance(inv),
    }));

    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      metrics: {
        activeSubscriptionsCount,
        revenueThisMonth,
        outstandingAmount,
        overdueCount: overdueInvoices.length,
        overdueAmount,
        totalRevenue,
      },
      overdueInvoices,
      recentPayments: formattedRecentPayments,
      recentInvoices: formattedRecentInvoices,
      executionTimeMs,
    });
  } catch (error) {
    console.error("GET /api/finance error:", error);
    return NextResponse.json({ error: "Failed to fetch financial metrics" }, { status: 500 });
  }
}

