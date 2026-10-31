import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { deleteProductAction, toggleProductActiveAction } from "@/app/actions/products";
import { DeleteButton } from "@/components/delete-button";
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
    <div>
      <PageHeader
        title="Products"
        description="Products and their variants (e.g. brand surcharges)."
      >
        {canManage ? (
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus /> New product
            </Link>
          </Button>
        ) : (
          <Badge variant="secondary">Read-only · Admin access required to edit</Badge>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base price</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Plans</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 7 : 6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No products yet. Seed data provides 5 products with variants.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <p className="font-medium">{product.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.category || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(product.basePrice)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.variants.length === 0 ? (
                          <span className="text-xs text-muted-foreground">none</span>
                        ) : (
                          product.variants.map((variant) => (
                            <Badge key={variant.id} variant="outline">
                              {variant.type}: {variant.value}
                              {variant.surcharge > 0
                                ? ` +${formatCurrency(variant.surcharge)}`
                                : ""}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product._count.plans}</TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "success" : "secondary"}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <form action={toggleProductActiveAction}>
                            <input type="hidden" name="id" value={product.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              {product.active ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/products/${product.id}`}>
                              <Pencil /> Edit
                            </Link>
                          </Button>
                          <DeleteButton
                            id={product.id}
                            action={deleteProductAction}
                            title={`Delete “${product.name}”?`}
                            description="This removes the product and all of its variants. Plans linked to it will keep their history but lose the product link."
                          />
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
