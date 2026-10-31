import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createSubscriptionAction } from "@/app/actions/subscriptions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { toDateInputValue } from "@/lib/constants";
import { requireRole } from "@/lib/session";

import { loadSubscriptionFormOptions } from "../form-data";
import { SubscriptionForm } from "../subscription-form";

export const metadata = { title: "New subscription · Brightloop" };

export default async function NewSubscriptionPage() {
  await requireRole("ADMIN", "STAFF");

  const options = await loadSubscriptionFormOptions();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New subscription"
        description="Create a draft, add lines, then move it through the status machine."
      >
        <Button asChild variant="outline">
          <Link href="/admin/subscriptions">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <SubscriptionForm
        action={createSubscriptionAction}
        submitLabel="Create subscription"
        customers={options.customers}
        plans={options.plans}
        templates={options.templates}
        products={options.products}
        defaultValues={{
          status: "DRAFT",
          startDate: toDateInputValue(new Date()),
        }}
      />
    </div>
  );
}
