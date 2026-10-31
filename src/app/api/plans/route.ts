import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { status: "ACTIVE" },
      include: { product: { include: { variants: true } } },
      orderBy: { price: "asc" },
    });
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("GET /api/plans error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await req.json();

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    const frequency = String(body.frequency ?? body.billingFrequency ?? "MONTHLY").toUpperCase();
    const price = Number(body.price ?? 0);
    const minQuantity = Math.max(1, parseInt(body.minQuantity ?? 1, 10) || 1);
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const endDate = body.endDate ? new Date(body.endDate) : null;

    const autoClose = Boolean(body.autoClose ?? body.autoCloseOnEnd);
    const earlyClose = Boolean(body.earlyClose ?? body.allowEarlyClose);
    const earlyCloseDays = Number(body.earlyCloseDays ?? 0);
    const pauseAllowed = Boolean(body.pauseAllowed ?? body.allowPause);
    const autoRenew = Boolean(body.autoRenew ?? body.allowRenew);

    const plan = await prisma.plan.create({
      data: {
        name,
        description: body.description ?? "",
        productId: body.productId || null,
        price,
        frequency,
        minQuantity,
        startDate,
        endDate,
        autoClose,
        earlyClose,
        earlyCloseDays,
        pauseAllowed,
        autoRenew,
        status: body.status ?? "ACTIVE",
      },
      include: { product: { include: { variants: true } } },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("POST /api/plans error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

