import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updateTaxRuleAction } from "@/app/actions/taxes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

import { TaxRuleForm } from "../tax-form";

export const metadata = { title: "Edit tax rule · Brightloop" };

export default async function EditTaxRulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const rule = await prisma.taxRule.findUnique({
    where: { id },
  });

  if (!rule) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Edit ${rule.name}`}
        description="Update rate percentage and application scope (All, Category, or Product)."
      >
        <Button asChild variant="outline">
          <Link href="/admin/taxes">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <TaxRuleForm
        action={updateTaxRuleAction}
        defaultValues={{
          id: rule.id,
          name: rule.name,
          rate: rule.rate,
          scope: rule.scope,
          scopeValue: rule.scopeValue,
          active: rule.active,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}

