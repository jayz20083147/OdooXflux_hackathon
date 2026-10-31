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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/80 backdrop-blur-md md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5 bg-card/60">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-ocean to-[#26628d] text-sm font-bold text-white shadow-xs ring-2 ring-brand-ocean/20">
          B
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold tracking-tight text-foreground">Brightloop</p>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-peach"></span>
          </div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Subscriptions OS
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
                <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-brand-ocean/15 text-brand-ocean font-semibold shadow-xs"
                    : "text-foreground/75 hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-brand-ocean" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="border-t border-border p-3 bg-muted/30">
        <div className="px-3 pb-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">{ROLE_LABEL[role]}</p>
            <p className="text-[11px] text-muted-foreground">Brightloop Enterprise</p>
          </div>
          <span className="rounded-full bg-brand-peach/30 text-[#9a4b16] px-2 py-0.5 text-[10px] font-bold">
            Live
          </span>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
