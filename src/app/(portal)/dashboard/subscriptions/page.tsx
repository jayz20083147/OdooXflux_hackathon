import Link from "next/link";
import { ArrowLeft, CalendarClock, ShoppingBag } from "lucide-react";

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            View active contracts, recurring cycles and plan specifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Overview
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/catalog">
              <ShoppingBag className="mr-1.5 h-4 w-4" /> Browse Catalog
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription Contracts ({subscriptions.length})</CardTitle>
          <CardDescription>All your subscriptions across all product categories.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead className="text-right">Recurring Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <p>You do not have any active subscriptions yet.</p>
                    <Button asChild size="sm" className="mt-4">
                      <Link href="/dashboard/catalog">Browse our catalog & plans</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono font-medium">
                      <Link href={`/dashboard/subscriptions/${sub.id}`} className="hover:underline text-primary">
                        {sub.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {sub.plan?.name ?? "Custom contract"}
                    </TableCell>
                    <TableCell>
                      {sub.plan ? FREQUENCY_LABEL[sub.plan.frequency as Frequency] : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={subscriptionStatusVariant(sub.status)}>
                          {SUBSCRIPTION_STATUS_LABEL[sub.status as SubscriptionStatus] ?? sub.status}
                        </Badge>
                        {sub.pausedAt ? <Badge variant="warning">Paused</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(sub.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/subscriptions/${sub.id}`}>Manage</Link>
                      </Button>
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

