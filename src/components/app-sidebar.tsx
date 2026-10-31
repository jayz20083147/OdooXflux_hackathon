"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  CalendarClock,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    icon: FileSpreadsheet,
    roles: ["ADMIN", "STAFF"],
  },
  { href: "/admin/invoices", label: "Invoices", icon: ReceiptText, roles: ["ADMIN", "STAFF"] },
  {
    href: "/admin/finance",
    label: "Finance",
    icon: TrendingUp,
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/admin/plans",
    label: "Plans",
    icon: CalendarClock,
    roles: ["ADMIN", "STAFF"],
  },
  { href: "/admin/products", label: "Products", icon: Package, roles: ["ADMIN", "STAFF"] },
  {
    href: "/admin/quotations",
    label: "Quotation templates",
    icon: FileText,
    roles: ["ADMIN"],
  },
  { href: "/admin/taxes", label: "Tax rules", icon: Percent, roles: ["ADMIN"] },
  {
    href: "/admin/discounts",
    label: "Discount rules",
    icon: BadgePercent,
    roles: ["ADMIN"],
  },
  { href: "/admin/staff", label: "Staff", icon: Users, roles: ["ADMIN"] },
];

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-slate-50/70 md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          B
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Brightloop</p>
          <p className="text-xs text-muted-foreground">Subscriptions</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/admin" || item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <p className="px-3 pb-2 text-xs text-muted-foreground">
          Signed in as {ROLE_LABEL[role]}
        </p>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
