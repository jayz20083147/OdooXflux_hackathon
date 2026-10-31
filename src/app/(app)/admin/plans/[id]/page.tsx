import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updatePlanAction } from "@/app/actions/plans";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { toDateInputValue } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

import { PlanForm } from "../plan-form";

export const metadata = { title: "Edit plan · Brightloop" };

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const [plan, products] = await Promise.all([
    prisma.plan.findUnique({ where: { id } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!plan) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Edit ${plan.name}`}
        description="Configure billing frequency and the four operational lifecycle flags."
      >
        <Button asChild variant="outline">
          <Link href="/admin/plans">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <PlanForm
        action={updatePlanAction}
        defaultValues={{
          id: plan.id,
          name: plan.name,
          description: plan.description ?? "",
          productId: plan.productId,
          price: plan.price,
          frequency: plan.frequency,
          minQuantity: plan.minQuantity,
          startDate: toDateInputValue(plan.startDate),
          endDate: toDateInputValue(plan.endDate),
          autoClose: plan.autoClose,
          earlyClose: plan.earlyClose,
          earlyCloseDays: plan.earlyCloseDays,
          pauseAllowed: plan.pauseAllowed,
          autoRenew: plan.autoRenew,
          status: plan.status,
        }}
        submitLabel="Save changes"
        products={products}
      />
    </div>
  );
}

