import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
  PAYMENT_METHOD_LABEL,
  formatCurrency,
  formatDate,
  formatDateTime,
  invoiceBalance,
  invoicePaymentState,
  type PaymentMethod,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Invoice · Brightloop" };

export default async function CustomerInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      subscription: { select: { id: true, reference: true } },
      lines: true,
      taxes: true,
      discounts: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  // Strict Customer Isolation: customers may only see their own invoices.
  if (!invoice || invoice.customerId !== user.id) notFound();

  const state = invoicePaymentState(invoice);
  const balance = invoiceBalance(invoice);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{invoice.number}</h1>
          <p className="text-sm text-muted-foreground">
            Subscription{" "}
            <Link
              href={`/dashboard/subscriptions/${invoice.subscription.id}`}
              className="text-primary hover:underline"
            >
              {invoice.subscription.reference}
            </Link>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/invoices">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Summary</CardTitle>
            <CardDescription>
              Period {formatDate(invoice.periodStart)} → {formatDate(invoice.periodEnd)}
            </CardDescription>
          </div>
          <Badge variant={paymentStateVariant(state)}>
            {INVOICE_PAYMENT_STATE_LABEL[state]}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issued</span>
            <span>{formatDate(invoice.issuedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due</span>
            <span>{formatDate(invoice.dueAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.description}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>-{formatCurrency(invoice.discountTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(invoice.taxTotal)}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid</span>
            <span>{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 font-semibold">
            <span>Balance due</span>
            <span className={balance > 0 ? "text-destructive" : ""}>
              {formatCurrency(balance)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Self-Service Payment Form for Customer */}
      {balance > 0 && invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pay this invoice</CardTitle>
            <CardDescription>
              Remaining balance: <strong className="text-destructive">{formatCurrency(balance)}</strong>. You can settle the full amount or make a partial payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm invoiceId={invoice.id} outstanding={balance} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments</CardTitle>
          <CardDescription>
            {invoice.payments.length === 0
              ? "No payments recorded yet."
              : `${invoice.payments.length} payment${invoice.payments.length === 1 ? "" : "s"} recorded.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invoice.payments.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Payments recorded by you or Brightloop staff will appear here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(payment.paidAt)}
                    </TableCell>
                    <TableCell>
                      {PAYMENT_METHOD_LABEL[payment.method as PaymentMethod] ?? payment.method}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.reference ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
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

