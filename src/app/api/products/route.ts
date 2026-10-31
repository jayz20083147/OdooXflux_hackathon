import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
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
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const basePrice = Number(body.basePrice ?? body.salesPrice ?? body.price ?? 0);
    const description = body.description ?? body.notes ?? "";
    const category = body.category ?? body.type ?? "General";
    const sku =
      body.sku ??
      `PROD-${name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const rawVariants: any[] = Array.isArray(body.variants) ? body.variants : [];
    const variantsData = rawVariants.map((v: any, index: number) => {
      const type = (v.type ?? v.attributeName ?? "BRAND").toUpperCase();
      const value = String(v.value ?? v.attributeValue ?? `Option ${index + 1}`).trim();
      const surcharge = Number(v.surcharge ?? v.priceExtra ?? 0);
      const varSku = `${sku}-${type}-${value.replace(/\s+/g, "").toUpperCase()}`;
      return { type, value, surcharge, sku: varSku };
    });

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        category,
        basePrice,
        active: body.active !== false,
        variants: {
          create: variantsData,
        },
      },
      include: { variants: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

