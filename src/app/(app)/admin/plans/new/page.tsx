import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createPlanAction } from "@/app/actions/plans";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toDateInputValue } from "@/lib/constants";

import { PlanForm } from "../plan-form";

export const metadata = { title: "New plan · Brightloop" };

export default async function NewPlanPage() {
  await requireRole("ADMIN");

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New plan"
        description="Define frequency, minimum quantity, active window and lifecycle behaviour."
      >
        <Button asChild variant="outline">
          <Link href="/admin/plans">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <PlanForm
        action={createPlanAction}
        submitLabel="Create plan"
        products={products}
        defaultValues={{
          frequency: "MONTHLY",
          minQuantity: 1,
          status: "ACTIVE",
          startDate: toDateInputValue(new Date()),
        }}
      />
    </div>
  );
}
