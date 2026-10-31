import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Package,
  ReceiptText,
  ShoppingBag,
  Wallet,
} from "lucide-react";

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
      hint: `${subscriptions.length} total`,
      icon: CalendarClock,
      tone: "text-primary",
    },
    {
      label: "Outstanding balance",
      value: formatCurrency(outstanding),
      hint: "across issued invoices",
      icon: Wallet,
      tone: "text-amber-600",
    },
    {
      label: "Overdue",
      value: formatCurrency(overdue),
      hint: "please settle these",
      icon: AlertTriangle,
      tone: "text-destructive",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hi {user.name ?? "there"}</h1>
          <p className="text-sm text-muted-foreground">
            Your subscriptions, invoices and balances in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/catalog">
              <ShoppingBag className="mr-1.5 h-4 w-4" /> Browse Catalog & Plans
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/invoices">
              <ReceiptText /> All invoices
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.tone}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{kpi.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarClock className="h-4 w-4" /> My subscriptions ({subscriptions.length})
        </h2>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You have no subscriptions yet. Contact Brightloop to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{sub.reference}</CardTitle>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Badge variant={subscriptionStatusVariant(sub.status)}>
                        {SUBSCRIPTION_STATUS_LABEL[sub.status as SubscriptionStatus] ??
                          sub.status}
                      </Badge>
                      {sub.pausedAt ? <Badge variant="warning">Paused</Badge> : null}
                    </div>
                  </div>
                  <CardDescription>{sub.plan?.name ?? "No plan linked"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-semibold">
                    {formatCurrency(sub.total)}
                    {sub.plan ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / {FREQUENCY_LABEL[sub.plan.frequency as Frequency]?.toLowerCase()}
                      </span>
                    ) : null}
                  </p>
                  <dl className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <dt>Window</dt>
                      <dd className="text-foreground">
                        {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Quantity</dt>
                      <dd className="text-foreground">{sub.quantity}</dd>
                    </div>
                  </dl>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/dashboard/subscriptions/${sub.id}`}>
                      Manage subscription
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <ReceiptText className="h-4 w-4" /> Recent invoices
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No invoices yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInvoices.map((invoice) => {
                    const state = invoicePaymentState(invoice);
                    const balance = invoiceBalance(invoice);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {invoice.number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
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
                        <TableCell className="text-right">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                        <TableCell
                          className={
                            balance > 0
                              ? "text-right font-medium text-destructive"
                              : "text-right text-muted-foreground"
                          }
                        >
                          {formatCurrency(balance)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarClock className="h-4 w-4" /> Available plans ({plans.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <Badge variant="outline">
                    {FREQUENCY_LABEL[plan.frequency as Frequency] ?? plan.frequency}
                  </Badge>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-semibold">
                  {formatCurrency(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {plan.frequency.toLowerCase()}
                  </span>
                </p>
                <dl className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Product</dt>
                    <dd className="text-foreground">{plan.product?.name ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Minimum quantity</dt>
                    <dd className="text-foreground">{plan.minQuantity}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Runs</dt>
                    <dd className="text-foreground">
                      {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-1">
                  {plan.earlyClose ? (
                    <Badge variant="warning">
                      early close{plan.earlyCloseDays > 0 ? ` ${plan.earlyCloseDays}d` : ""}
                    </Badge>
                  ) : null}
                  {plan.pauseAllowed ? <Badge variant="secondary">pausable</Badge> : null}
                  {plan.autoRenew ? <Badge>auto renew</Badge> : null}
                  {plan.autoClose ? <Badge variant="success">auto close</Badge> : null}
                </div>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active plans right now.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Package className="h-4 w-4" /> Product catalogue ({products.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle className="text-base">{product.name}</CardTitle>
                <CardDescription>
                  {product.category || "Uncategorised"} · {product.sku}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold">
                  {formatCurrency(product.basePrice)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {product.variants.map((variant) => (
                    <Badge key={variant.id} variant="outline">
                      {variant.value}
                      {variant.surcharge > 0 ? ` +${formatCurrency(variant.surcharge)}` : ""}
                    </Badge>
                  ))}
                  {product.variants.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No variants</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
