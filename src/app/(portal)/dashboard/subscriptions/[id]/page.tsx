import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, CreditCard, Pause, Play, ReceiptText, ShieldAlert } from "lucide-react";

import {
  pauseSubscriptionAction,
  resumeSubscriptionAction,
  earlyCloseSubscriptionAction,
} from "@/app/actions/subscriptions";
import {
  paymentStateVariant,
  subscriptionStatusVariant,
} from "@/components/subscription-actions";
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
  INVOICE_PAYMENT_STATE_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  formatCurrency,
  formatDate,
  invoiceBalance,
  invoicePaymentState,
  type Frequency,
  type SubscriptionStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Subscription Details · Brightloop" };

export default async function CustomerSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: {
      plan: true,
      lines: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, type: true, value: true, surcharge: true } },
        },
      },
      invoices: {
        orderBy: { periodStart: "desc" },
        include: { payments: true },
      },
    },
  });

  // Strict Customer Isolation
  if (!sub || sub.customerId !== user.id) notFound();

  const isPaused = Boolean(sub.pausedAt);
  const plan = sub.plan;
  const canPause = plan?.pauseAllowed && sub.status === "ACTIVE" && !isPaused;
  const canResume = sub.status === "ACTIVE" && isPaused;
  const canEarlyClose = plan?.earlyClose && sub.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Subscription {sub.reference}</h1>
            <Badge variant={subscriptionStatusVariant(sub.status)}>
              {SUBSCRIPTION_STATUS_LABEL[sub.status as SubscriptionStatus] ?? sub.status}
            </Badge>
            {isPaused ? <Badge variant="warning">Paused</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {plan?.name ?? "Custom contract"} · Billed{" "}
            {plan ? FREQUENCY_LABEL[plan.frequency as Frequency]?.toLowerCase() : "periodically"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/subscriptions">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> My Subscriptions
          </Link>
        </Button>
      </div>

      {/* Customer Self-Service Lifecycle Controls */}
      {canPause || canResume || canEarlyClose ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subscription Management</CardTitle>
            <CardDescription>
              Your plan permits self-service pause and lifecycle adjustments.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            {canPause ? (
              <form action={pauseSubscriptionAction}>
                <input type="hidden" name="id" value={sub.id} />
                <Button type="submit" variant="outline" size="sm">
                  <Pause className="mr-1.5 h-4 w-4" /> Pause Deliveries
                </Button>
              </form>
            ) : null}

            {canResume ? (
              <form action={resumeSubscriptionAction}>
                <input type="hidden" name="id" value={sub.id} />
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="mr-1.5 h-4 w-4" /> Resume Deliveries
                </Button>
              </form>
            ) : null}

            {canEarlyClose ? (
              <form action={earlyCloseSubscriptionAction}>
                <input type="hidden" name="id" value={sub.id} />
                <Button type="submit" variant="destructive" size="sm">
                  <ShieldAlert className="mr-1.5 h-4 w-4" /> Cancel / Early Close
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Information Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" /> Recurring Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-bold text-foreground">{formatCurrency(sub.total)}</p>
            <p className="text-xs text-muted-foreground">
              per {plan ? FREQUENCY_LABEL[plan.frequency as Frequency]?.toLowerCase() : "period"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" /> Current Billing Cycle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">
              {formatDate(sub.currentPeriodStart || sub.startDate)} → {formatDate(sub.currentPeriodEnd || sub.endDate)}
            </p>
            <p className="text-xs text-muted-foreground">
              Contract Start: {formatDate(sub.startDate)}
            </p>
            {sub.endDate ? (
              <p className="text-xs text-muted-foreground">
                Contract End: {formatDate(sub.endDate)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <ReceiptText className="h-4 w-4" /> Invoices & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">
              {sub.invoices.length} billing statement{sub.invoices.length === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground">
              {sub.invoices.filter((i) => i.status === "PAID").length} settled ·{" "}
              {sub.invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").length} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription Items ({sub.lines.length})</CardTitle>
          <CardDescription>Products and selected variants under this subscription.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sub.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">
                    {line.product?.name ?? line.description}
                  </TableCell>
                  <TableCell>
                    {line.variant ? (
                      <Badge variant="outline">
                        {line.variant.type}: {line.variant.value}
                        {line.variant.surcharge > 0
                          ? ` (+${formatCurrency(line.variant.surcharge)})`
                          : ""}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(line.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoices list with direct payment links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing History & Invoices</CardTitle>
          <CardDescription>
            All generated invoices for this subscription. Unpaid invoices can be settled directly online.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sub.invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    No invoices generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                sub.invoices.map((inv) => {
                  const pState = invoicePaymentState(inv);
                  const balance = invoiceBalance(inv);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono font-medium">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="text-primary hover:underline">
                          {inv.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(inv.periodStart)} → {formatDate(inv.periodEnd)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(inv.dueAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStateVariant(pState)}>
                          {INVOICE_PAYMENT_STATE_LABEL[pState]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(inv.total)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {balance > 0 ? (
                          <span className="text-destructive">{formatCurrency(balance)}</span>
                        ) : (
                          <span className="text-emerald-600">$0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant={balance > 0 ? "default" : "outline"}>
                          <Link href={`/dashboard/invoices/${inv.id}`}>
                            {balance > 0 ? "Pay Now" : "View Statement"}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

