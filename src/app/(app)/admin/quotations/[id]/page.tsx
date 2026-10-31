import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updateQuotationTemplateAction } from "@/app/actions/quotations";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

import { QuotationTemplateForm } from "../template-form";

export const metadata = { title: "Edit quotation template · Brightloop" };

export default async function EditQuotationTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const template = await prisma.quotationTemplate.findUnique({
    where: { id },
  });

  if (!template) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Edit ${template.name}`}
        description="Update validity window, default discount percentage and contractual terms."
      >
        <Button asChild variant="outline">
          <Link href="/admin/quotations">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <QuotationTemplateForm
        action={updateQuotationTemplateAction}
        defaultValues={{
          id: template.id,
          name: template.name,
          description: template.description ?? "",
          validityDays: template.validityDays,
          terms: template.terms ?? "",
          defaultDiscountPercent: template.defaultDiscountPercent,
          active: template.active,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}

