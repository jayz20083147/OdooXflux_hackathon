import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, ShoppingBag } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { subscriptionStatusVariant } from "@/components/subscription-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  SUBSCRIPTION_STATUS_LABEL,
  formatCurrency,
  formatDate,
  type Frequency,
  type SubscriptionStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "My Subscriptions · Brightloop" };

export default async function CustomerSubscriptionsPage() {
  const user = await requireUser();

  const subscriptions = await prisma.subscription.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      lines: { include: { product: true, variant: true } },
      invoices: { select: { id: true, status: true, total: true, paidAmount: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Active subscription contracts, recurring billing terms and self-service lifecycle actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Overview
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/catalog">
              <ShoppingBag className="mr-1.5 h-4 w-4" /> Browse Catalog
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {subscriptions.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No subscriptions active"
              description="You do not have any active subscriptions yet. Browse our catalog to choose a software or physical tier."
              action={{
                label: "Browse Catalog & Plans",
                href: "/dashboard/catalog",
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Billing Cadence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contract Window</TableHead>
                  <TableHead className="text-right">Recurring Total</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono font-medium">
                      <Link href={`/dashboard/subscriptions/${sub.id}`} className="hover:underline text-primary">
                        {sub.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {sub.plan?.name ?? "Custom agreement"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {sub.plan ? FREQUENCY_LABEL[sub.plan.frequency as Frequency] : "Periodic"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={subscriptionStatusVariant(sub.status)}>
                          {SUBSCRIPTION_STATUS_LABEL[sub.status as SubscriptionStatus] ?? sub.status}
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
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/subscriptions/${sub.id}`}>
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
