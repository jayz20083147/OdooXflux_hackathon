import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Package,
  ReceiptText,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
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

export const metadata = { title: "Overview · Brightloop" };

export default async function CustomerOverviewPage() {
  const user = await requireUser();

  const [subscriptions, invoices, plans, products] = await Promise.all([
    prisma.subscription.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true, frequency: true } } },
    }),
    prisma.invoice.findMany({
      where: { customerId: user.id },
      orderBy: { issuedAt: "desc" },
      include: { subscription: { select: { reference: true } } },
    }),
    prisma.plan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { price: "asc" },
      include: { product: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { variants: true },
    }),
  ]);

  const activeCount = subscriptions.filter((sub) => sub.status === "ACTIVE").length;
  const issued = invoices.filter(
    (invoice) => invoice.status !== "DRAFT" && invoice.status !== "CANCELLED",
  );
  const outstanding = issued.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
  const overdue = invoices
    .filter((invoice) => invoicePaymentState(invoice) === "OVERDUE")
    .reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);

  const recentInvoices = invoices.slice(0, 5);

  const kpis = [
    {
      label: "Active subscriptions",
      value: String(activeCount),
      hint: `${subscriptions.length} lifetime contract${subscriptions.length === 1 ? "" : "s"}`,
      icon: CalendarClock,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Outstanding balance",
      value: formatCurrency(outstanding),
      hint: "across issued billing statements",
      icon: Wallet,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      border: "border-amber-200",
    },
    {
      label: "Overdue balance",
      value: formatCurrency(overdue),
      hint: overdue > 0 ? "please settle immediately" : "all payments up to date",
      icon: AlertTriangle,
      color: overdue > 0 ? "text-destructive" : "text-emerald-600",
      bg: overdue > 0 ? "bg-destructive/10" : "bg-emerald-500/10",
      border: overdue > 0 ? "border-destructive/20" : "border-emerald-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {user.name ?? "Customer"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription contracts, recurring billing terms and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild size="sm">
            <Link href="/dashboard/catalog">
              <ShoppingBag className="mr-1.5 h-4 w-4" /> Browse Catalog & Plans
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/invoices">
              <ReceiptText className="mr-1.5 h-4 w-4" /> All Invoices
            </Link>
          </Button>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className={`border bg-card p-5 shadow-sm transition-all ${kpi.border}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {kpi.label}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Subscriptions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <CalendarClock className="h-4 w-4 text-primary" /> My Active Subscriptions ({subscriptions.length})
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/dashboard/subscriptions">
              <span>View all subscriptions</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={CalendarClock}
                title="No active subscriptions yet"
                description="Explore our product catalog to choose a software plan or physical tier."
                action={{
                  label: "Browse Catalog",
                  href: "/dashboard/catalog",
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="flex flex-col justify-between transition-all hover:shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-mono text-base font-semibold text-foreground">
                      {sub.reference}
                    </CardTitle>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Badge variant={subscriptionStatusVariant(sub.status)}>
                        {SUBSCRIPTION_STATUS_LABEL[sub.status as SubscriptionStatus] ??
                          sub.status}
                      </Badge>
                      {sub.pausedAt ? <Badge variant="warning">Paused</Badge> : null}
                    </div>
                  </div>
                  <CardDescription className="font-medium text-foreground">
                    {sub.plan?.name ?? "Custom contract agreement"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <p className="text-2xl font-bold font-mono text-foreground">
                      {formatCurrency(sub.total)}
                      {sub.plan ? (
                        <span className="text-xs font-normal text-muted-foreground font-sans">
                          {" "}
                          / {FREQUENCY_LABEL[sub.plan.frequency as Frequency]?.toLowerCase()}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <dl className="space-y-1.5 text-xs text-muted-foreground bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <dt>Cycle Window</dt>
                      <dd className="font-medium text-foreground">
                        {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Quantity</dt>
                      <dd className="font-medium text-foreground">{sub.quantity}</dd>
                    </div>
                  </dl>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/dashboard/subscriptions/${sub.id}`}>
                      <span>Manage Subscription</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent Invoices Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <ReceiptText className="h-4 w-4 text-primary" /> Recent Invoices
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/dashboard/invoices">
              <span>View all invoices</span>
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="No invoices generated yet"
                description="Once your active subscriptions enter their billing cycle, invoices and receipts will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Remaining Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice) => {
                    const state = invoicePaymentState(invoice);
                    const balance = invoiceBalance(invoice);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-medium">
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="text-primary hover:underline"
                          >
                            {invoice.number}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {invoice.subscription.reference}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(invoice.dueAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={paymentStateVariant(state)}>
                            {INVOICE_PAYMENT_STATE_LABEL[state]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                        <TableCell
                          className={
                            balance > 0
                              ? "text-right font-mono font-semibold text-destructive"
                              : "text-right font-mono text-muted-foreground"
                          }
                        >
                          {formatCurrency(balance)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/invoices/${invoice.id}`}>
                              {balance > 0 ? "Pay" : "View"}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
