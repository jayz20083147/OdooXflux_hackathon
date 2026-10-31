import { redirect } from "next/navigation";

import { PortalNav } from "@/components/portal-nav";
import { requireUser } from "@/lib/session";

/**
 * Customer portal shell — a separate, lighter chrome from the staff/admin app.
 * Only customers may use it; staff and admins are sent back to the console.
 */
export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  if (user.role !== "CUSTOMER") redirect("/admin");

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalNav userName={user.name ?? user.email ?? "Customer"} />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
