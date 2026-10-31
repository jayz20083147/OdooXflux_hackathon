import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, FileSpreadsheet, Receipt, User } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  SubscriptionActions,
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
  formatDateTime,
  invoicePaymentState,
  type Frequency,
  type SubscriptionStatus,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Subscription Details · Brightloop" };

export default async function AdminSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await params;

  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      plan: true,
      template: true,
      lines: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
          variant: { select: { id: true, type: true, value: true, surcharge: true } },
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, role: true } } },
      },
      invoices: {
        orderBy: { periodStart: "desc" },
        include: { payments: true },
      },
    },
  });

  if (!sub) notFound();

  const isStaff = user.role === "ADMIN" || user.role === "STAFF";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Subscription ${sub.reference}`}
        description={`Status: ${SUBSCRIPTION_STATUS_LABEL[sub.status as SubscriptionStatus] ?? sub.status}`}
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/subscriptions/${sub.id}/edit`}>
              Edit details
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/subscriptions">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to list
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Visual Status Banner */}
      {sub.status === "ACTIVE" && !sub.pausedAt ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-xs">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-200/80 text-emerald-800 font-bold text-xs">✓</span>
          <p><strong className="font-semibold">Active Subscription Contract:</strong> Recurring billing is active on this agreement.</p>
        </div>
      ) : sub.pausedAt ? (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-xs">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-amber-800 font-bold text-xs">⏸</span>
          <p><strong className="font-semibold">Subscription Paused:</strong> Automatic invoice generation and recurring cycles are suspended until resumed.</p>
        </div>
      ) : sub.status === "QUOTATION" ? (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-xs">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200/80 text-blue-800 font-bold text-xs">ⓘ</span>
          <p><strong className="font-semibold">Quotation Phase:</strong> Awaiting customer confirmation before contract activation.</p>
        </div>
      ) : null}

      {/* Lifecycle Actions Bar */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Subscription Lifecycle Controls</CardTitle>
              <CardDescription>
                State Machine transitions: DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={subscriptionStatusVariant(sub.status)} className="text-sm">
                {SUBSCRIPTION_STATUS_LABEL[sub.status as SubscriptionStatus] ?? sub.status}
              </Badge>
              {sub.pausedAt ? <Badge variant="warning">Paused</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SubscriptionActions subscription={sub} isStaff={isStaff} />
        </CardContent>
      </Card>

      {/* Overview Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" /> Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">{sub.customer.name}</p>
            <p className="text-muted-foreground">{sub.customer.email}</p>
            <p className="font-mono text-xs text-muted-foreground">ID: {sub.customer.id}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" /> Plan & Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">{sub.plan?.name ?? "Custom / No Plan"}</p>
            <p className="text-muted-foreground">
              Frequency:{" "}
              <span className="font-medium text-foreground">
                {sub.plan ? FREQUENCY_LABEL[sub.plan.frequency as Frequency] : "—"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Window: {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
            </p>
            {sub.renewCount > 0 ? (
              <p className="text-xs text-primary font-medium">Renewed: {sub.renewCount} time(s)</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Receipt className="h-4 w-4" /> Pricing & Financials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(sub.subtotal)}</span>
            </div>
            {sub.discountTotal > 0 ? (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-{formatCurrency(sub.discountTotal)}</span>
              </div>
            ) : null}
            {sub.taxTotal > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Taxes</span>
                <span>+{formatCurrency(sub.taxTotal)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-1 font-semibold text-foreground">
              <span>Recurring Total</span>
              <span className="text-base text-primary">{formatCurrency(sub.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription Line Items ({sub.lines.length})</CardTitle>
          <CardDescription>Products and variant surcharges provisioned in this contract.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product / Description</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sub.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">
                    {line.product?.name ?? line.description}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {line.product?.sku ?? "—"}
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

      {/* Generated Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generated Invoices ({sub.invoices.length})</CardTitle>
          <CardDescription>
            Invoices generated for each billing cycle with idempotency guarantees.
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
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sub.invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    No invoices generated yet. Invoices are generated once active or on due dates.
                  </TableCell>
                </TableRow>
              ) : (
                sub.invoices.map((inv) => {
                  const pState = invoicePaymentState(inv);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono font-medium">
                        <Link href={`/admin/invoices/${inv.id}`} className="hover:underline text-primary">
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
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatCurrency(inv.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/invoices/${inv.id}`}>View Invoice</Link>
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

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" /> Audit Trail ({sub.events.length})
          </CardTitle>
          <CardDescription>
            Immutable event log tracking all lifecycle actions, transitions, and actors.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sub.events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No recorded events.
                  </TableCell>
                </TableRow>
              ) : (
                sub.events.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(evt.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {evt.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {evt.actor ? `${evt.actor.name} (${evt.actor.role})` : "System"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {evt.note ?? "—"}
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
