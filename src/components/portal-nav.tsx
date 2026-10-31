"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, ReceiptText, ShoppingBag } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/catalog", label: "Catalog & Plans", icon: ShoppingBag },
  { href: "/dashboard/invoices", label: "Invoices", icon: ReceiptText },
];

export function PortalNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            B
          </span>
          <span className="text-sm font-semibold">Brightloop</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Customer portal
          </span>
        </Link>

        <nav className="flex items-center gap-1">
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
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
