import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { formatSubscription } from "../route";

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
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: true,
        template: true,
        lines: { include: { variant: true } },
        invoices: true,
        events: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Role verification: Customers can only view their own subscriptions
    if (session.user.role === "CUSTOMER" && subscription.customerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Access restricted" }, { status: 403 });
    }

    return NextResponse.json({ subscription: formatSubscription(subscription) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}
