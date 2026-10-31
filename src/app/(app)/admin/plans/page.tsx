import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { deletePlanAction, togglePlanStatusAction } from "@/app/actions/plans";
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
import {
  FREQUENCY_LABEL,
  formatCurrency,
  formatDate,
  type Frequency,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Plans · Brightloop" };

export default async function PlansPage() {
  const user = await requireRole("ADMIN", "STAFF");
  const canManage = user.role === "ADMIN";

  const plans = await prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Subscription plans with frequency, minimum quantity, dates and lifecycle flags."
      >
        {canManage ? (
          <Button asChild>
            <Link href="/admin/plans/new">
              <Plus /> New plan
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
                <TableHead>Plan</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Min qty</TableHead>
                <TableHead>Active window</TableHead>
                <TableHead>Lifecycle</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 8 : 7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No plans yet.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.product?.name ?? "No product linked"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {FREQUENCY_LABEL[plan.frequency as Frequency] ??
                          plan.frequency}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(plan.price)}
                    </TableCell>
                    <TableCell>{plan.minQuantity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(plan.startDate)}
                      <br />→ {formatDate(plan.endDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan.autoClose ? <Badge variant="success">autoClose</Badge> : null}
                        {plan.earlyClose ? (
                          <Badge variant="warning">
                            earlyClose{plan.earlyCloseDays > 0 ? ` (${plan.earlyCloseDays}d)` : ""}
                          </Badge>
                        ) : null}
                        {plan.pauseAllowed ? <Badge variant="secondary">pause</Badge> : null}
                        {plan.autoRenew ? <Badge>renew</Badge> : null}
                        {!plan.autoClose &&
                        !plan.earlyClose &&
                        !plan.pauseAllowed &&
                        !plan.autoRenew ? (
                          <span className="text-xs text-muted-foreground">none</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.status === "ACTIVE" ? "success" : "secondary"}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <form action={togglePlanStatusAction}>
                            <input type="hidden" name="id" value={plan.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              {plan.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/plans/${plan.id}`}>
                              <Pencil /> Edit
                            </Link>
                          </Button>
                          <DeleteButton
                            id={plan.id}
                            action={deletePlanAction}
                            title={`Delete “${plan.name}”?`}
                            description="This permanently removes the plan."
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
