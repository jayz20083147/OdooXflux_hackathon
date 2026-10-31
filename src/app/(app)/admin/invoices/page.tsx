import Link from "next/link";
import { FileText, RefreshCw } from "lucide-react";

import {
  deleteInvoiceAction,
  generateInvoicesAction,
  invoiceStatusAction,
} from "@/app/actions/invoices";
import { DeleteButton } from "@/components/delete-button";
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
      customer: { select: { name: true } },
      subscription: { select: { reference: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Generate invoices for due active subscriptions, then confirm, cancel or mark them paid."
      >
        <form action={generateInvoicesAction}>
          <Button type="submit">
            <RefreshCw /> Generate invoices
          </Button>
        </form>
      </PageHeader>

      {generated !== null ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Generated {generated} invoice{generated === 1 ? "" : "s"}
          {skipped ? ` · ${skipped} period${skipped === 1 ? "" : "s"} already billed` : ""}.
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Period</TableHead>
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
                    No invoices yet. Activate a subscription and click “Generate invoices”.
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
                          href={`/admin/invoices/${invoice.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.customer.name}</TableCell>
                      <TableCell className="text-muted-foreground">
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
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell
                        className={
                          balance > 0
                            ? "text-right text-destructive"
                            : "text-right text-muted-foreground"
                        }
                      >
                        {formatCurrency(balance)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {invoice.status === "DRAFT" ? (
                            <form action={invoiceStatusAction}>
                              <input type="hidden" name="id" value={invoice.id} />
                              <input type="hidden" name="action" value="CONFIRM" />
                              <Button type="submit" variant="ghost" size="sm">
                                Confirm
                              </Button>
                            </form>
                          ) : null}
                          {invoice.status === "DRAFT" || invoice.status === "CONFIRMED" ? (
                            <>
                              <form action={invoiceStatusAction}>
                                <input type="hidden" name="id" value={invoice.id} />
                                <input type="hidden" name="action" value="MARK_PAID" />
                                <Button type="submit" variant="ghost" size="sm">
                                  Mark paid
                                </Button>
                              </form>
                              <form action={invoiceStatusAction}>
                                <input type="hidden" name="id" value={invoice.id} />
                                <input type="hidden" name="action" value="CANCEL" />
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  Cancel
                                </Button>
                              </form>
                            </>
                          ) : null}
                          {invoice.status === "DRAFT" ? (
                            <DeleteButton
                              id={invoice.id}
                              action={deleteInvoiceAction}
                              title={`Delete ${invoice.number}?`}
                              description="The draft invoice and its usage records will be removed."
                            />
                          ) : null}
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/invoices/${invoice.id}`}>
                              <FileText /> {balance > 0 ? "Record payment" : "View"}
                            </Link>
                          </Button>
                        </div>
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
