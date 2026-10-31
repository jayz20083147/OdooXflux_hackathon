import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Filter,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  INVOICE_PAYMENT_STATES,
  INVOICE_PAYMENT_STATE_LABEL,
  formatCurrency,
  formatDate,
  invoiceBalance,
  invoicePaymentState,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Finance · Brightloop" };

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("ADMIN", "STAFF");
  const params = await searchParams;

  const customerId = str(params.customer);
  const stateParam = str(params.state);
  const fromParam = str(params.from);
  const toParam = str(params.to);

  const where: Prisma.InvoiceWhereInput = {};
  if (customerId) where.customerId = customerId;
  if (fromParam || toParam) {
    const issuedAt: Prisma.DateTimeFilter = {};
    if (fromParam) {
      const from = new Date(fromParam);
      if (!Number.isNaN(from.getTime())) issuedAt.gte = from;
    }
    if (toParam) {
      const to = new Date(`${toParam}T23:59:59`);
      if (!Number.isNaN(to.getTime())) issuedAt.lte = to;
    }
    if (Object.keys(issuedAt).length > 0) where.issuedAt = issuedAt;
  }

  const [customers, invoices, activeSubscriptionCount] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.invoice.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      include: {
        customer: { select: { name: true } },
        subscription: { select: { reference: true } },
      },
    }),
    prisma.subscription.count({
      where: { status: "ACTIVE", ...(customerId ? { customerId } : {}) },
    }),
  ]);

  const withState = invoices.map((invoice) => ({
    invoice,
    state: invoicePaymentState(invoice),
    balance: invoiceBalance(invoice),
  }));

  const rows = stateParam
    ? withState.filter((row) => row.state === stateParam)
    : withState;

  const settledRows = rows.filter(
    ({ invoice }) => invoice.status !== "DRAFT" && invoice.status !== "CANCELLED",
  );

  const invoiceIds = rows.map(({ invoice }) => invoice.id);
  const revenueAggregate =
    invoiceIds.length > 0
      ? await prisma.payment.aggregate({
          where: { invoiceId: { in: invoiceIds } },
          _sum: { amount: true },
        })
      : null;

  const revenue = revenueAggregate?._sum.amount ?? 0;
  const outstanding = settledRows.reduce((sum, row) => sum + row.balance, 0);
  const overdue = rows
    .filter((row) => row.state === "OVERDUE")
    .reduce((sum, row) => sum + row.balance, 0);
  const overdueCount = rows.filter((row) => row.state === "OVERDUE").length;

  const kpis = [
    {
      label: "Active subscriptions",
      value: String(activeSubscriptionCount),
      hint: customerId ? "for the selected customer" : "currently active",
      icon: FileSpreadsheet,
      tone: "text-primary",
    },
    {
      label: "Revenue collected",
      value: formatCurrency(revenue),
      hint: "payments recorded on filtered invoices",
      icon: Wallet,
      tone: "text-emerald-600",
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstanding),
      hint: "issued and not fully settled",
      icon: CheckCircle2,
      tone: "text-amber-600",
    },
    {
      label: "Overdue",
      value: formatCurrency(overdue),
      hint: `${overdueCount} invoice${overdueCount === 1 ? "" : "s"} past due`,
      icon: AlertTriangle,
      tone: "text-destructive",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Finance"
        description="Revenue, outstanding and overdue balances across the invoice book."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Narrow the book by customer, payment state or issue date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="get"
            className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer</Label>
              <Select id="customer" name="customer" defaultValue={customerId}>
                <option value="">All customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state">Payment state</Label>
              <Select id="state" name="state" defaultValue={stateParam}>
                <option value="">All states</option>
                {INVOICE_PAYMENT_STATES.map((state) => (
                  <option key={state} value={state}>
                    {INVOICE_PAYMENT_STATE_LABEL[state]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="from">Issued from</Label>
              <Input id="from" name="from" type="date" defaultValue={fromParam} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="to">Issued to</Label>
              <Input id="to" name="to" type="date" defaultValue={toParam} />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" className="flex-1">
                <Filter /> Apply
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/admin/finance">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
          <CardDescription>
            {rows.length} invoice{rows.length === 1 ? "" : "s"} match the current filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No invoices match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ invoice, state, balance }) => (
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
                    <TableCell className="text-right text-emerald-700">
                      {formatCurrency(invoice.paidAmount)}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
