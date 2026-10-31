import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatInvoice } from "../route";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        subscription: { select: { id: true, reference: true } },
        lines: true,
        taxes: true,
        discounts: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Customer Isolation Check
    if (session.user.role === "CUSTOMER" && invoice.customerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Access restricted" }, { status: 403 });
    }

    return NextResponse.json({ invoice: formatInvoice(invoice) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

