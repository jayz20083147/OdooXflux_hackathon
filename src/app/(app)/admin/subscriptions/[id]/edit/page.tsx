import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updateSubscriptionAction } from "@/app/actions/subscriptions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { toDateInputValue } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

import { loadSubscriptionFormOptions } from "../../form-data";
import { SubscriptionForm } from "../../subscription-form";

export const metadata = { title: "Edit subscription · Brightloop" };

export default async function EditSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN", "STAFF");
  const { id } = await params;

  const [sub, options] = await Promise.all([
    prisma.subscription.findUnique({
      where: { id },
      include: { lines: true },
    }),
    loadSubscriptionFormOptions(),
  ]);

  if (!sub) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Edit Subscription ${sub.reference}`}
        description="Update customer, plan, pricing lines, or contract window."
      >
        <Button asChild variant="outline">
          <Link href={`/admin/subscriptions/${sub.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to details
          </Link>
        </Button>
      </PageHeader>

      <SubscriptionForm
        action={updateSubscriptionAction}
        submitLabel="Save changes"
        customers={options.customers}
        plans={options.plans}
        templates={options.templates}
        products={options.products}
        defaultValues={{
          id: sub.id,
          customerId: sub.customerId,
          planId: sub.planId,
          templateId: sub.templateId,
          status: sub.status,
          startDate: toDateInputValue(sub.startDate),
          endDate: toDateInputValue(sub.endDate),
          notes: sub.notes ?? "",
          lines: sub.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        }}
      />
    </div>
  );
}

