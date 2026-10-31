import Link from "next/link";
import { Package, Pencil, Plus } from "lucide-react";

import { deleteProductAction, toggleProductActiveAction } from "@/app/actions/products";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Products · Brightloop" };

export default async function ProductsPage() {
  const user = await requireRole("ADMIN", "STAFF");
  const canManage = user.role === "ADMIN";

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: { orderBy: { createdAt: "asc" } },
      _count: { select: { plans: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Variants"
        description="Catalog products, SKUs, and tiered variants with customizable pricing surcharges."
      >
        {canManage ? (
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-1.5 h-4 w-4" /> New product
            </Link>
          </Button>
        ) : (
          <Badge variant="secondary">Read-only · Admin access required to edit</Badge>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products in catalog"
              description="Add digital products, software licenses, or physical goods with variant options to offer subscribers."
              action={
                canManage
                  ? {
                      label: "Create Product",
                      href: "/admin/products/new",
                    }
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name & SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Base Price</TableHead>
                  <TableHead>Configured Variants</TableHead>
                  <TableHead className="text-center">Linked Plans</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category || "General"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(product.basePrice)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.variants.length === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          product.variants.map((variant) => (
                            <Badge key={variant.id} variant="outline" className="text-[11px]">
                              {variant.value}
                              {variant.surcharge > 0
                                ? ` (+${formatCurrency(variant.surcharge)})`
                                : ""}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-700">
                        {product._count.plans}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "success" : "secondary"}>
                        {product.active ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/products/${product.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <form action={toggleProductActiveAction.bind(null, product.id)}>
                            <Button size="sm" variant="outline" className="text-xs">
                              {product.active ? "Archive" : "Activate"}
                            </Button>
                          </form>
                          <DeleteButton
                            action={deleteProductAction.bind(null, product.id)}
                            title="Delete product"
                          />
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
