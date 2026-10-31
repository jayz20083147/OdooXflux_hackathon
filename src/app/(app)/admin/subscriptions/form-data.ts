import { prisma } from "@/lib/prisma";

import type { ProductOption } from "./subscription-form";

export async function loadSubscriptionFormOptions() {
  const [customers, plans, templates, products] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.plan.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.quotationTemplate.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        basePrice: true,
        variants: { select: { id: true, value: true, surcharge: true } },
      },
    }),
  ]);

  return {
    customers,
    plans,
    templates,
    products: products as ProductOption[],
  };
}
