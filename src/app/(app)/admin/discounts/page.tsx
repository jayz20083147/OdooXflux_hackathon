import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import {
  deleteDiscountRuleAction,
  toggleDiscountRuleAction,
} from "@/app/actions/discounts";
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

export const metadata = { title: "Discount rules · Brightloop" };

export default async function DiscountRulesPage() {
  await requireRole("ADMIN");

  const rules = await prisma.discountRule.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Discount rules"
        description="Auto-applied to invoices when their conditions match, with usage tracking."
      >
        <Button asChild>
          <Link href="/admin/discounts/new">
            <Plus /> New discount
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No discount rules yet.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {rule.code ?? "No code"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {rule.kind === "PERCENT"
                        ? `${rule.value}%`
                        : formatCurrency(rule.value)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="space-y-0.5">
                        <p>
                          scope: {rule.scope === "ALL" ? "invoice" : `${rule.scope} ${rule.scopeValue ?? ""}`}
                        </p>
                        {rule.minSubtotal > 0 ? (
                          <p>min subtotal {formatCurrency(rule.minSubtotal)}</p>
                        ) : null}
                        {rule.minQuantity > 0 ? <p>min qty {rule.minQuantity}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rule.maxUses > 0
                        ? `${rule.usedCount} / ${rule.maxUses}`
                        : `${rule.usedCount} used`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.active ? "success" : "secondary"}>
                        {rule.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <form action={toggleDiscountRuleAction}>
                          <input type="hidden" name="id" value={rule.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            {rule.active ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/discounts/${rule.id}`}>
                            <Pencil /> Edit
                          </Link>
                        </Button>
                        <DeleteButton
                          id={rule.id}
                          action={deleteDiscountRuleAction}
                          title={`Delete “${rule.name}”?`}
                          description="This discount will no longer be applied to new invoices."
                        />
                      </div>
                    </TableCell>
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
