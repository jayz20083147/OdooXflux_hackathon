import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createQuotationTemplateAction } from "@/app/actions/quotations";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/session";

import { QuotationTemplateForm } from "../template-form";

export const metadata = { title: "New quotation template · Brightloop" };

export default async function NewQuotationTemplatePage() {
  await requireRole("ADMIN");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New quotation template"
        description="Define reusable terms, validity and an optional default discount."
      >
        <Button asChild variant="outline">
          <Link href="/admin/quotations">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <QuotationTemplateForm
        action={createQuotationTemplateAction}
        submitLabel="Create template"
        defaultValues={{ validityDays: 30, defaultDiscountPercent: 0, active: true }}
      />
    </div>
  );
}
