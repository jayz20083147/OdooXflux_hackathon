import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updateProductAction } from "@/app/actions/products";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

import { ProductForm } from "../product-form";

export const metadata = { title: "Edit product · Brightloop" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  });

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Edit ${product.name}`}
        description="Update product details and manage attribute variants or surcharges."
      >
        <Button asChild variant="outline">
          <Link href="/admin/products">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </PageHeader>

      <ProductForm
        action={updateProductAction}
        defaultValues={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category ?? "",
          description: product.description ?? "",
          basePrice: product.basePrice,
          active: product.active,
          variants: product.variants.map((v) => ({
            id: v.id,
            type: v.type,
            value: v.value,
            surcharge: v.surcharge,
          })),
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}

