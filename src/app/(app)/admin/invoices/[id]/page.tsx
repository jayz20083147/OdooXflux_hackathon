import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, DollarSign, Receipt, Trash2, User, XCircle } from "lucide-react";

import { deletePaymentAction, invoiceStatusAction } from "@/app/actions/invoices";
import { PageHeader } from "@/components/page-header";
import { PaymentForm } from "@/components/payment-form";
import { paymentStateVariant } from "@/components/subscription-actions";
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
  INVOICE_PAYMENT_STATE_LABEL,
  INVOICE_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  formatCurrency,
  formatDate,
  formatDateTime,
  invoiceBalance,
  invoicePaymentState,
  type InvoicePaymentState,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Invoice Details · Brightloop" };

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("ADMIN", "STAFF");
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      subscription: { select: { id: true, reference: true, status: true } },
      lines: true,
      taxes: true,
      discounts: true,
      payments: {
        orderBy: { paidAt: "desc" },
        include: { recordedBy: { select: { name: true, role: true } } },
      },
    },
  });

  if (!invoice) notFound();

  const balance = invoiceBalance(invoice);
  const pState = invoicePaymentState(invoice);
  const canConfirm = invoice.status === "DRAFT";
  const canCancel = invoice.status !== "CANCELLED" && invoice.status !== "PAID";
  const canMarkPaid = invoice.status === "CONFIRMED" && balance > 0;
  const canPay = invoice.status === "CONFIRMED" && balance > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.number}`}
        description={`Issued for Subscription ${invoice.subscription.reference}`}
      >
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/invoices">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to invoices
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Action Controls Bar */}
      <Card className="border-border bg-slate-50/50">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={paymentStateVariant(pState)} className="text-sm">
              {INVOICE_PAYMENT_STATE_LABEL[pState]}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Lifecycle: {INVOICE_STATUS_LABEL[invoice.status as InvoiceStatus] ?? invoice.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canConfirm ? (
              <form action={invoiceStatusAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <input type="hidden" name="status" value="CONFIRMED" />
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Confirm Invoice
                </Button>
              </form>
            ) : null}

            {canMarkPaid ? (
              <form action={invoiceStatusAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <input type="hidden" name="status" value="PAID" />
                <Button type="submit" size="sm" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                  <DollarSign className="mr-1.5 h-4 w-4" /> Mark as Paid
                </Button>
              </form>
            ) : null}

            {canCancel ? (
              <form action={invoiceStatusAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <input type="hidden" name="status" value="CANCELLED" />
                <Button type="submit" size="sm" variant="destructive">
                  <XCircle className="mr-1.5 h-4 w-4" /> Void / Cancel
                </Button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Summary Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" /> Customer & Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">{invoice.customer.name}</p>
            <p className="text-muted-foreground">{invoice.customer.email}</p>
            <p className="pt-2 text-xs text-muted-foreground">
              Subscription:{" "}
              <Link
                href={`/admin/subscriptions/${invoice.subscription.id}`}
                className="font-medium text-primary hover:underline"
              >
                {invoice.subscription.reference}
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Receipt className="h-4 w-4" /> Billing Window & Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Cycle:{" "}
              <span className="font-medium text-foreground">
                {formatDate(invoice.periodStart)} → {formatDate(invoice.periodEnd)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Issued: {formatDate(invoice.issuedAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              Due: <span className="font-semibold text-foreground">{formatDate(invoice.dueAt)}</span>
            </p>
            {invoice.paidAt ? (
              <p className="text-xs text-emerald-600 font-medium">
                Paid at: {formatDateTime(invoice.paidAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" /> Balance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Invoiced</span>
              <span className="font-medium">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Paid to date</span>
              <span className="font-semibold">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold">
              <span>Remaining Balance</span>
              <span className={balance > 0 ? "text-destructive text-base" : "text-emerald-600 text-base"}>
                {formatCurrency(balance)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Lines Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items ({invoice.lines.length})</CardTitle>
          <CardDescription>Billed subscription services and variants.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.description}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(line.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Subtotal, Discounts, Taxes, Total Footer */}
          <div className="border-t bg-muted/20 p-4">
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discounts.map((d) => (
                <div key={d.id} className="flex justify-between text-emerald-600 text-xs">
                  <span>Discount ({d.name})</span>
                  <span>-{formatCurrency(d.amount)}</span>
                </div>
              ))}
              {invoice.taxes.map((t) => (
                <div key={t.id} className="flex justify-between text-muted-foreground text-xs">
                  <span>Tax ({t.name} {t.rate}%)</span>
                  <span>+{formatCurrency(t.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-1 font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Section */}
      {canPay ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Record Payment</CardTitle>
            <CardDescription>
              Accept full or partial payment against the outstanding balance of {formatCurrency(balance)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm invoiceId={invoice.id} outstanding={balance} />
          </CardContent>
        </Card>
      ) : null}

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History ({invoice.payments.length})</CardTitle>
          <CardDescription>Audit log of all payments applied to this invoice.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {user.role === "ADMIN" ? <TableHead className="text-right">Action</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={user.role === "ADMIN" ? 7 : 6} className="py-6 text-center text-muted-foreground">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                invoice.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(p.paidAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PAYMENT_METHOD_LABEL[p.method as PaymentMethod] ?? p.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {p.recordedBy ? `${p.recordedBy.name} (${p.recordedBy.role})` : "Self-service / System"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.note ?? "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    {user.role === "ADMIN" ? (
                      <TableCell className="text-right">
                        <form action={deletePaymentAction}>
                          <input type="hidden" name="id" value={p.id} />
                          <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
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
