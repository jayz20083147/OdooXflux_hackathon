import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updateDiscountRuleAction } from "@/app/actions/discounts";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { toDateInputValue } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

import { DiscountRuleForm } from "../discount-form";

export const metadata = { title: "Edit discount rule · Brightloop" };

export default async function EditDiscountRulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const rule = await prisma.discountRule.findUnique({
    where: { id },
  });

  if (!rule) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Edit ${rule.name}`}
        description="Update discount value, eligibility conditions, scope and usage limits."
      >
        <Button asChild variant="outline">
          <Link href="/admin/discounts">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <DiscountRuleForm
        action={updateDiscountRuleAction}
        defaultValues={{
          id: rule.id,
          name: rule.name,
          code: rule.code,
          kind: rule.kind,
          value: rule.value,
          minSubtotal: rule.minSubtotal,
          minQuantity: rule.minQuantity,
          scope: rule.scope,
          scopeValue: rule.scopeValue,
          maxUses: rule.maxUses,
          validFrom: toDateInputValue(rule.validFrom),
          validTo: toDateInputValue(rule.validTo),
          active: rule.active,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}

