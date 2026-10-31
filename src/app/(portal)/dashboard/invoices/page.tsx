import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

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

export const metadata = { title: "My invoices · Brightloop" };

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My invoices</h1>
          <p className="text-sm text-muted-foreground">
            Outstanding balance: <span className="font-medium">{formatCurrency(outstanding)}</span>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft /> Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
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
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <FileText /> View
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

      <p className="text-sm text-muted-foreground">
        Invoices are issued by Brightloop staff. Contact support if a payment looks wrong.
      </p>
    </div>
  );
}
