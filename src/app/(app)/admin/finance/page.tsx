import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Filter,
  Wallet,
} from "lucide-react";

import { EmptyState } from "@/components/empty-state";
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
        customer: { select: { name: true, email: true } },
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
    ? withState.filter((item) => item.state === stateParam)
    : withState;

  const invoiceIds = invoices.map((i) => i.id);
  const revenueAggregate =
    invoiceIds.length > 0
      ? await prisma.payment.aggregate({
          where: { invoiceId: { in: invoiceIds } },
          _sum: { amount: true },
        })
      : null;

  const settledRows = rows.filter((r) => r.invoice.status !== "CANCELLED");
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
      hint: customerId ? "for the selected customer" : "currently under billing",
      icon: FileSpreadsheet,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Revenue collected",
      value: formatCurrency(revenue),
      hint: "settled payments on filtered book",
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      border: "border-emerald-200",
    },
    {
      label: "Outstanding balance",
      value: formatCurrency(outstanding),
      hint: "issued and pending completion",
      icon: CheckCircle2,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      border: "border-amber-200",
    },
    {
      label: "Overdue balance",
      value: formatCurrency(overdue),
      hint: `${overdueCount} invoice${overdueCount === 1 ? "" : "s"} past due date`,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Ledger"
        description="Cash collections, outstanding balances and overdue receivables across the active invoice book."
      />

      {/* Top Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Filter Control Card */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Filter className="h-4 w-4 text-primary" /> Filter Financial Records
          </CardTitle>
          <CardDescription>Narrow the invoice ledger by customer, payment state or issue date.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer</Label>
              <Select id="customer" name="customer" defaultValue={customerId}>
                <option value="">All customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? c.email}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state">Payment state</Label>
              <Select id="state" name="state" defaultValue={stateParam}>
                <option value="">All payment states</option>
                {INVOICE_PAYMENT_STATES.map((s) => (
                  <option key={s} value={s}>
                    {INVOICE_PAYMENT_STATE_LABEL[s]}
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

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Apply filters</Button>
              <Button asChild variant="outline">
                <Link href="/admin/finance">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No matching invoices found"
              description="No financial records match your current filter parameters. Try resetting your search filters."
              action={{
                label: "Reset Filters",
                href: "/admin/finance",
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Payment state</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ invoice, state, balance }) => (
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
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {invoice.subscription.reference}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(invoice.issuedAt)}
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
                    <TableCell className="text-right font-mono text-emerald-600">
                      {formatCurrency(invoice.paidAmount)}
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
                        <Link href={`/admin/invoices/${invoice.id}`}>
                          <span>View</span>
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
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
