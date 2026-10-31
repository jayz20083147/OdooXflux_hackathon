import Link from "next/link";
import { CalendarClock, FileSpreadsheet, Package, ReceiptText, Tags, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
  ROLE_LABEL,
  formatCurrency,
  formatDate,
  type Frequency,
  type Role,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Admin · Brightloop" };

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN", "STAFF");

  const [
    productCount,
    variantCount,
    activePlanCount,
    planCount,
    subscriptionCount,
    activeSubscriptionCount,
    invoiceCount,
    paidInvoiceCount,
    users,
    recentPlans,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.variant.count(),
    prisma.plan.count({ where: { status: "ACTIVE" } }),
    prisma.plan.count(),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: "PAID" } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.plan.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { product: { select: { name: true } } },
    }),
  ]);

  const usersByRole = users.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.role] = entry._count._all;
    return acc;
  }, {});

  const stats = [
    {
      label: "Subscriptions",
      value: subscriptionCount,
      hint: `${activeSubscriptionCount} active`,
      icon: FileSpreadsheet,
      href: "/admin/subscriptions",
    },
    {
      label: "Invoices",
      value: invoiceCount,
      hint: `${paidInvoiceCount} paid`,
      icon: ReceiptText,
      href: "/admin/invoices",
    },
    {
      label: "Products",
      value: productCount,
      hint: `${variantCount} variants`,
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Plans",
      value: planCount,
      hint: `${activePlanCount} active`,
      icon: CalendarClock,
      href: "/admin/plans",
    },
    {
      label: "Variants",
      value: variantCount,
      hint: "brand surcharges included",
      icon: Tags,
      href: "/admin/products",
    },
    {
      label: "Users",
      value: Object.values(usersByRole).reduce((a, b) => a + b, 0),
      hint: `${usersByRole.ADMIN ?? 0} admin · ${usersByRole.STAFF ?? 0} staff · ${
        usersByRole.CUSTOMER ?? 0
      } customers`,
      icon: Users,
      href: user.role === "ADMIN" ? "/admin/staff" : "/admin",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name ?? "there"}`}
        description={`Signed in as ${ROLE_LABEL[user.role]}. Phase 2 — quotations, subscriptions, billing, taxes and discounts.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recently updated plans</CardTitle>
          <CardDescription>
            Lifecycle flags control how each subscription ends or renews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Lifecycle</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No plans yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.product?.name ?? "No product linked"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {FREQUENCY_LABEL[plan.frequency as Frequency] ?? plan.frequency}
                    </TableCell>
                    <TableCell>{formatCurrency(plan.price)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan.autoClose ? <Badge variant="success">auto-close</Badge> : null}
                        {plan.earlyClose ? <Badge variant="warning">early-close</Badge> : null}
                        {plan.pauseAllowed ? <Badge variant="secondary">pause</Badge> : null}
                        {plan.autoRenew ? <Badge>renew</Badge> : null}
                        {!plan.autoClose && !plan.earlyClose && !plan.pauseAllowed && !plan.autoRenew ? (
                          <span className="text-xs text-muted-foreground">none</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.status === "ACTIVE" ? "success" : "secondary"}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Accounts by role</CardTitle>
          <CardDescription>
            {user.role === "ADMIN"
              ? "Administrators can add staff accounts from the Staff page."
              : "Only administrators can create staff accounts."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
            <div
              key={role}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{ROLE_LABEL[role]}</span>
              <span className="font-semibold">{usersByRole[role] ?? 0}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
