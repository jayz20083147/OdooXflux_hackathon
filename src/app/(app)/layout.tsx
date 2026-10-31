import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/constants";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="md:hidden">
            <p className="text-sm font-semibold">Brightloop</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">
                {user.name ?? user.email}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {ROLE_LABEL[user.role]}
            </Badge>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
