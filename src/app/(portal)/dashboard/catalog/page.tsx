import { ShoppingBag } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { CatalogClient } from "./catalog-client";

export const metadata = { title: "Catalog & Plans · Brightloop" };

export default async function CustomerCatalogPage() {
  await requireUser();

  const [plans, discountRules] = await Promise.all([
    prisma.plan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { price: "asc" },
      include: {
        product: {
          include: {
            variants: { orderBy: { surcharge: "asc" } },
          },
        },
      },
    }),
    prisma.discountRule.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        code: true,
        kind: true,
        value: true,
        minSubtotal: true,
        minQuantity: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span>Product Catalog & Subscription Plans</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse available recurring subscription cadences, select product variants, and apply promotional discounts.
          </p>
        </div>
      </div>

      <CatalogClient
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          frequency: p.frequency,
          minQuantity: p.minQuantity,
          earlyClose: p.earlyClose,
          earlyCloseDays: p.earlyCloseDays,
          pauseAllowed: p.pauseAllowed,
          autoRenew: p.autoRenew,
          product: p.product
            ? {
                id: p.product.id,
                name: p.product.name,
                sku: p.product.sku,
                category: p.product.category,
                variants: p.product.variants.map((v) => ({
                  id: v.id,
                  type: v.type,
                  value: v.value,
                  surcharge: v.surcharge,
                })),
              }
            : null,
        }))}
        discountRules={discountRules}
      />
    </div>
  );
}

