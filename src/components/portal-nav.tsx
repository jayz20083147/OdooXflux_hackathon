"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, LayoutDashboard, LogOut, Menu, ReceiptText, ShoppingBag, X } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: CalendarClock },
  { href: "/dashboard/catalog", label: "Catalog & Plans", icon: ShoppingBag },
  { href: "/dashboard/invoices", label: "Invoices", icon: ReceiptText },
];

export function PortalNav({ userName }: { userName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-ocean to-[#26628d] text-sm font-bold text-white shadow-xs ring-2 ring-brand-ocean/20">
            B
          </span>
          <span className="text-sm font-bold tracking-tight text-foreground">Brightloop</span>
          <span className="hidden rounded-full border border-border bg-brand-mint px-2 py-0.5 text-[11px] font-semibold text-brand-ocean md:inline">
            Customer Portal
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/dashboard"
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-brand-ocean/15 text-brand-ocean font-semibold shadow-2xs"
                    : "text-foreground/75 hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-brand-ocean" : "text-muted-foreground")} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User & Sign Out (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs font-semibold text-[#7c2d12] bg-brand-peach/25 border border-brand-peach/40 px-3 py-1 rounded-full">
            {userName}
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </form>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="px-2 pb-2 text-xs font-medium text-muted-foreground border-b">
            Signed in as <span className="font-semibold text-foreground">{userName}</span>
          </div>
          <nav className="space-y-1">
            {LINKS.map((link) => {
              const active =
                link.href === "/dashboard"
                  ? pathname === link.href
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="pt-2 border-t">
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full gap-2 text-xs">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
