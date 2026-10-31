import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { paymentStateVariant } from "@/components/subscription-actions";
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
import {
  INVOICE_PAYMENT_STATE_LABEL,
  formatCurrency,
  formatDate,
  invoiceBalance,
  invoicePaymentState,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "My Invoices · Brightloop" };

export default async function CustomerInvoicesPage() {
  const user = await requireUser();

  const invoices = await prisma.invoice.findMany({
    where: { customerId: user.id },
    orderBy: { issuedAt: "desc" },
    include: { subscription: { select: { reference: true } } },
  });

  const outstanding = invoices
    .filter((invoice) => invoice.status !== "DRAFT" && invoice.status !== "CANCELLED")
    .reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Billing history, payment receipts and invoice settlement options.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border bg-white px-3 py-1.5 shadow-xs">
            <span className="text-xs text-muted-foreground">Outstanding: </span>
            <span className={`font-mono text-sm font-bold ${outstanding > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {formatCurrency(outstanding)}
            </span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Overview
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No invoices found"
              description="You have no generated invoices yet. Invoices appear automatically on recurring billing cycles."
              action={{
                label: "Back to Overview",
                href: "/dashboard",
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Payment State</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const state = invoicePaymentState(invoice);
                  const balance = invoiceBalance(invoice);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-medium">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {invoice.subscription.reference}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(invoice.periodStart)} → {formatDate(invoice.periodEnd)}
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
                        <Button asChild size="sm" variant={balance > 0 ? "default" : "outline"}>
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            {balance > 0 ? "Pay Now" : "Receipt"}
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
    </div>
  );
}
