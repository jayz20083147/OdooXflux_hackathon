import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createProductAction } from "@/app/actions/products";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/session";

import { ProductForm } from "../product-form";

export const metadata = { title: "New product · Brightloop" };

export default async function NewProductPage() {
  await requireRole("ADMIN");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New product"
        description="Create a product and optionally add variants such as brand surcharges."
      >
        <Button asChild variant="outline">
          <Link href="/admin/products">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <ProductForm action={createProductAction} submitLabel="Create product" />
    </div>
  );
}
