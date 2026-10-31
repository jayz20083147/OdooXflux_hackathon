import Link from "next/link";
import { Plus } from "lucide-react";

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
import { subscriptionStatusVariant } from "@/components/subscription-actions";
import {
  SUBSCRIPTION_STATUS_LABEL,
  formatCurrency,
  formatDate,
  type SubscriptionStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Subscriptions · Brightloop" };

export default async function SubscriptionsPage() {
  await requireRole("ADMIN", "STAFF");

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      plan: { select: { name: true } },
      _count: { select: { invoices: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Draft → Quotation → Confirmed → Active → Closed, with lines and lifecycle controls."
      >
        <Button asChild>
          <Link href="/admin/subscriptions/new">
            <Plus /> New subscription
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Invoices</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No subscriptions yet.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Link
                        href={`/admin/subscriptions/${sub.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {sub.reference}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{sub.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.customer.email}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.plan?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={subscriptionStatusVariant(sub.status)}>
                          {SUBSCRIPTION_STATUS_LABEL[sub.status as SubscriptionStatus] ??
                            sub.status}
                        </Badge>
                        {sub.pausedAt ? <Badge variant="warning">Paused</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(sub.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub._count.invoices}
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
