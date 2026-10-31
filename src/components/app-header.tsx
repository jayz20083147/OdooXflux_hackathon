"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  CalendarClock,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  ReceiptText,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
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
  { href: "/admin/subscriptions", label: "Subscriptions", icon: FileSpreadsheet, roles: ["ADMIN", "STAFF"] },
  { href: "/admin/invoices", label: "Invoices", icon: ReceiptText, roles: ["ADMIN", "STAFF"] },
  { href: "/admin/finance", label: "Finance", icon: TrendingUp, roles: ["ADMIN", "STAFF"] },
  { href: "/admin/plans", label: "Plans", icon: CalendarClock, roles: ["ADMIN", "STAFF"] },
  { href: "/admin/products", label: "Products", icon: Package, roles: ["ADMIN", "STAFF"] },
  { href: "/admin/quotations", label: "Quotation templates", icon: FileText, roles: ["ADMIN"] },
  { href: "/admin/taxes", label: "Tax rules", icon: Percent, roles: ["ADMIN"] },
  { href: "/admin/discounts", label: "Discount rules", icon: BadgePercent, roles: ["ADMIN"] },
  { href: "/admin/staff", label: "Staff", icon: Users, roles: ["ADMIN"] },
];

export function AppHeader({
  user,
}: {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: Role;
  };
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  // Determine current section title for mobile header breadcrumb
  const currentItem = items.find((item) =>
    item.href === "/admin"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="md:hidden -ml-2 h-9 w-9 p-0"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground md:hidden">
              B
            </span>
            <span className="text-sm font-semibold md:hidden">
              {currentItem ? currentItem.label : "Brightloop"}
            </span>
          </div>
        </div>

        {/* User profile & role pill */}
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium leading-none text-foreground">
              {user.name ?? user.email}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              {user.email}
            </p>
          </div>
          <Badge
            variant={user.role === "ADMIN" ? "default" : "secondary"}
            className="font-medium text-xs px-2.5 py-0.5"
          >
            {ROLE_LABEL[user.role]}
          </Badge>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[80vw] flex-col bg-background p-4 shadow-2xl flex border-r z-10 animate-in slide-in-from-left duration-200">
            <div className="flex h-12 items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  B
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Brightloop</p>
                  <p className="text-[11px] text-muted-foreground">Subscription Console</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1 py-4">
              {items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t pt-3">
              <div className="px-3 pb-3">
                <p className="text-xs font-medium text-foreground">{user.name ?? user.email}</p>
                <p className="text-[11px] text-muted-foreground">{ROLE_LABEL[user.role]}</p>
              </div>
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
