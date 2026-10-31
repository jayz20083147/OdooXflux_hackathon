import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import {
  deleteQuotationTemplateAction,
  toggleQuotationTemplateAction,
} from "@/app/actions/quotations";
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

export const metadata = { title: "Quotation templates · Brightloop" };

export default async function QuotationTemplatesPage() {
  const user = await requireRole("ADMIN", "STAFF");
  const canManage = user.role === "ADMIN";

  const templates = await prisma.quotationTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Quotation templates"
        description="Reusable quotation terms and validity windows applied when quoting a subscription."
      >
        {canManage ? (
          <Button asChild>
            <Link href="/admin/quotations/new">
              <Plus /> New template
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
                <TableHead>Template</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Default discount</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No quotation templates yet.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {template.description || "—"}
                      </p>
                    </TableCell>
                    <TableCell>{template.validityDays} days</TableCell>
                    <TableCell>
                      {template.defaultDiscountPercent > 0
                        ? `${template.defaultDiscountPercent}%`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.active ? "success" : "secondary"}>
                        {template.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <form action={toggleQuotationTemplateAction}>
                            <input type="hidden" name="id" value={template.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              {template.active ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/quotations/${template.id}`}>
                              <Pencil /> Edit
                            </Link>
                          </Button>
                          <DeleteButton
                            id={template.id}
                            action={deleteQuotationTemplateAction}
                            title={`Delete “${template.name}”?`}
                            description="Subscriptions using this template will fall back to no template."
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
