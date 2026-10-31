import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (code) {
      const discount = await prisma.discountRule.findFirst({
        where: { code, active: true },
      });
      if (!discount) {
        return NextResponse.json({ error: "Invalid coupon or discount code" }, { status: 404 });
      }
      return NextResponse.json({ discount });
    }

    const discounts = await prisma.discountRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ discounts });
  } catch (error) {
    console.error("GET /api/discounts error:", error);
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
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
    const code = body.code ? String(body.code).trim().toUpperCase() : null;
    if (!name) {
      return NextResponse.json({ error: "Discount name is required" }, { status: 400 });
    }

    // Support both Trae ("PERCENT"/"FIXED") and Antigravity ("PERCENTAGE"/"FIXED")
    let kind = "PERCENT";
    if (body.kind === "FIXED" || body.type === "FIXED") {
      kind = "FIXED";
    }

    const value = Number(body.value ?? 0);
    const maxUses = Number(body.maxUses ?? 0);
    const minSubtotal = Number(body.minSubtotal ?? 0);
    const minQuantity = Number(body.minQuantity ?? 0);
    const scope = String(body.scope ?? "ALL").toUpperCase();
    const scopeValue = body.scopeValue ?? null;
    const active = body.active !== false && body.isActive !== false;

    const discount = await prisma.discountRule.create({
      data: {
        name,
        code,
        kind,
        value,
        maxUses,
        minSubtotal,
        minQuantity,
        scope,
        scopeValue,
        active,
      },
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error("POST /api/discounts error:", error);
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
  }
}

