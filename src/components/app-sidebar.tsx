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
  section?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"], section: "Overview" },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    icon: FileSpreadsheet,
    roles: ["ADMIN", "STAFF"],
    section: "Operations",
  },
  { href: "/admin/invoices", label: "Invoices", icon: ReceiptText, roles: ["ADMIN", "STAFF"], section: "Operations" },
  {
    href: "/admin/finance",
    label: "Financial Ledger",
    icon: TrendingUp,
    roles: ["ADMIN", "STAFF"],
    section: "Operations",
  },
  {
    href: "/admin/plans",
    label: "Plans",
    icon: CalendarClock,
    roles: ["ADMIN", "STAFF"],
    section: "Catalog",
  },
  { href: "/admin/products", label: "Products", icon: Package, roles: ["ADMIN", "STAFF"], section: "Catalog" },
  {
    href: "/admin/quotations",
    label: "Quotation templates",
    icon: FileText,
    roles: ["ADMIN"],
    section: "Settings",
  },
  { href: "/admin/taxes", label: "Tax rules", icon: Percent, roles: ["ADMIN"], section: "Settings" },
  {
    href: "/admin/discounts",
    label: "Discount rules",
    icon: BadgePercent,
    roles: ["ADMIN"],
    section: "Settings",
  },
  { href: "/admin/staff", label: "Staff members", icon: Users, roles: ["ADMIN"], section: "Settings" },
];

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  let lastSection = "";

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-slate-50/70 md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          B
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">Brightloop</p>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Subscriptions
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto space-y-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/admin" || item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          const showSection = item.section && item.section !== lastSection;
          if (showSection) lastSection = item.section!;

          return (
            <div key={item.href}>
              {showSection && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-primary" : "text-slate-400 group-hover:text-slate-700",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="border-t border-slate-200/80 p-3 bg-slate-50/50">
        <div className="px-3 pb-2">
          <p className="text-xs font-medium text-slate-700">Role: {ROLE_LABEL[role]}</p>
          <p className="text-[11px] text-muted-foreground">Brightloop Enterprise</p>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-slate-200/50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
