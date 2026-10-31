import Link from "next/link";
import { ArrowRight, FileText, RefreshCw, Trash2 } from "lucide-react";

import {
  deleteInvoiceAction,
  generateInvoicesAction,
  invoiceStatusAction,
} from "@/app/actions/invoices";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
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
import { requireRole } from "@/lib/session";

export const metadata = { title: "Invoices · Brightloop" };

function numberParam(value: string | string[] | undefined): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("ADMIN", "STAFF");
  const params = await searchParams;

  const generated = numberParam(params.generated);
  const skipped = numberParam(params.skipped);

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      subscription: { select: { reference: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Generate invoices for due active subscriptions, track payment states, and manage ledger balances."
      >
        <form action={generateInvoicesAction}>
          <Button type="submit">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Generate invoices
          </Button>
        </form>
      </PageHeader>

      {generated !== null ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-xs flex items-center justify-between">
          <p>
            Generated <strong className="font-semibold">{generated}</strong> invoice{generated === 1 ? "" : "s"}
            {skipped ? ` · ${skipped} period${skipped === 1 ? "" : "s"} already billed (idempotent)` : ""}.
          </p>
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices generated yet"
              description="Activate an existing subscription and trigger invoice generation to build billing line items."
              action={{
                label: "Go to Subscriptions",
                href: "/admin/subscriptions",
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Billing Period</TableHead>
                  <TableHead>Payment State</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
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
                          href={`/admin/invoices/${invoice.id}`}
                          className="text-primary hover:underline"
                        >
                          {invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{invoice.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{invoice.customer.email}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {invoice.subscription.reference}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(invoice.periodStart)} → {formatDate(invoice.periodEnd)}
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
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/invoices/${invoice.id}`}>
                              <span>Details</span>
                              <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          {invoice.status === "DRAFT" ? (
                            <DeleteButton
                              id={invoice.id}
                              action={deleteInvoiceAction}
                              title={`Delete invoice ${invoice.number}?`}
                              description="This draft invoice will be removed permanently."
                            />
                          ) : null}
                        </div>
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
