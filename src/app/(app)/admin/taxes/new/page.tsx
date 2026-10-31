import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createTaxRuleAction } from "@/app/actions/taxes";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/session";

import { TaxRuleForm } from "../tax-form";

export const metadata = { title: "New tax rule · Brightloop" };

export default async function NewTaxRulePage() {
  await requireRole("ADMIN");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New tax rule" description="Define a tax that is auto-applied to invoices.">
        <Button asChild variant="outline">
          <Link href="/admin/taxes">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <TaxRuleForm
        action={createTaxRuleAction}
        submitLabel="Create tax rule"
        defaultValues={{ scope: "ALL", rate: 0, active: true }}
      />
    </div>
  );
}
