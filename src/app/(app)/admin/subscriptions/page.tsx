import Link from "next/link";
import { ArrowRight, FileSpreadsheet, Plus } from "lucide-react";

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
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Draft → Quotation → Confirmed → Active → Closed, with lines, billing terms and lifecycle controls."
      >
        <Button asChild>
          <Link href="/admin/subscriptions/new">
            <Plus className="mr-1.5 h-4 w-4" /> New subscription
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {subscriptions.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="No subscriptions created yet"
              description="Create a subscription draft, attach products or plans, and progress it through quotations to active billing."
              action={{
                label: "Create Subscription",
                href: "/admin/subscriptions/new",
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing Window</TableHead>
                  <TableHead className="text-right">Recurring Total</TableHead>
                  <TableHead className="text-center">Invoices</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono font-medium">
                      <Link
                        href={`/admin/subscriptions/${sub.id}`}
                        className="text-primary hover:underline"
                      >
                        {sub.reference}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{sub.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.customer.email}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.plan?.name ?? "Custom contract"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
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
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatCurrency(sub.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-700">
                        {sub._count.invoices}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/subscriptions/${sub.id}`}>
                          <span>Manage</span>
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
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
