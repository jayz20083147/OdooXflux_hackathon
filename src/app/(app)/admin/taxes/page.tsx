import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { deleteTaxRuleAction, toggleTaxRuleAction } from "@/app/actions/taxes";
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
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Tax rules · Brightloop" };

export default async function TaxRulesPage() {
  await requireRole("ADMIN");

  const rules = await prisma.taxRule.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader
        title="Tax rules"
        description="Active tax rules are applied automatically to every generated invoice."
      >
        <Button asChild>
          <Link href="/admin/taxes/new">
            <Plus /> New tax rule
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No tax rules yet.
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.rate}%</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.scope === "ALL"
                          ? "Whole invoice"
                          : `${rule.scope}: ${rule.scopeValue ?? "—"}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.active ? "success" : "secondary"}>
                        {rule.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <form action={toggleTaxRuleAction}>
                          <input type="hidden" name="id" value={rule.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            {rule.active ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/taxes/${rule.id}`}>
                            <Pencil /> Edit
                          </Link>
                        </Button>
                        <DeleteButton
                          id={rule.id}
                          action={deleteTaxRuleAction}
                          title={`Delete “${rule.name}”?`}
                          description="This tax rule will no longer be applied to new invoices."
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
