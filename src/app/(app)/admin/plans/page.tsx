import Link from "next/link";
import { CalendarClock, Pencil, Plus } from "lucide-react";

import { deletePlanAction, togglePlanStatusAction } from "@/app/actions/plans";
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
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Configurable billing intervals, minimum contract quantities, and automated renewal lifecycle rules."
      >
        {canManage ? (
          <Button asChild>
            <Link href="/admin/plans/new">
              <Plus className="mr-1.5 h-4 w-4" /> New plan
            </Link>
          </Button>
        ) : (
          <Badge variant="secondary">Read-only · Admin access required to edit</Badge>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {plans.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No subscription plans configured"
              description="Create recurring plans linked to products with customizable frequencies and renewal terms."
              action={
                canManage
                  ? {
                      label: "Create Plan",
                      href: "/admin/plans/new",
                    }
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Details</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Min qty</TableHead>
                  <TableHead>Active window</TableHead>
                  <TableHead>Lifecycle rules</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <p className="font-semibold text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.product?.name ? `Product: ${plan.product.name}` : "No product linked"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {FREQUENCY_LABEL[plan.frequency as Frequency] ?? plan.frequency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(plan.price)}
                    </TableCell>
                    <TableCell className="text-center font-mono">{plan.minQuantity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan.autoRenew ? <Badge variant="secondary" className="text-[10px]">auto-renew</Badge> : null}
                        {plan.pauseAllowed ? <Badge variant="secondary" className="text-[10px]">pausable</Badge> : null}
                        {plan.earlyClose ? (
                          <Badge variant="warning" className="text-[10px]">
                            early-close{plan.earlyCloseDays > 0 ? ` (${plan.earlyCloseDays}d)` : ""}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.status === "ACTIVE" ? "success" : "secondary"}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/plans/${plan.id}`}>
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <form action={togglePlanStatusAction}>
                            <input type="hidden" name="id" value={plan.id} />
                            <Button size="sm" variant="outline" className="text-xs">
                              {plan.status === "ACTIVE" ? "Archive" : "Activate"}
                            </Button>
                          </form>
                          <DeleteButton
                            id={plan.id}
                            action={deletePlanAction}
                            title={`Delete “${plan.name}”?`}
                            description="This plan will be removed from future subscription selections."
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
