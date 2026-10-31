import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createDiscountRuleAction } from "@/app/actions/discounts";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/session";

import { DiscountRuleForm } from "../discount-form";

export const metadata = { title: "New discount rule · Brightloop" };

export default async function NewDiscountRulePage() {
  await requireRole("ADMIN");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New discount rule"
        description="Set the value, scope and conditions that decide when this discount applies."
      >
        <Button asChild variant="outline">
          <Link href="/admin/discounts">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <DiscountRuleForm
        action={createDiscountRuleAction}
        submitLabel="Create discount"
        defaultValues={{
          kind: "PERCENT",
          scope: "ALL",
          value: 0,
          minSubtotal: 0,
          minQuantity: 0,
          maxUses: 0,
          active: true,
        }}
      />
    </div>
  );
}
