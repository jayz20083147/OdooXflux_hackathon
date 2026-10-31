import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";

export const metadata = { title: "Access denied · Brightloop" };

export default async function ForbiddenPage() {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-bold text-primary">403</p>
      <h1 className="text-xl font-semibold">You do not have access to this page</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {user
          ? `Your role (${user.role}) is not permitted to view this area. Only administrators can manage staff accounts.`
          : "Please sign in with an account that has the required permissions."}
      </p>
      <Button asChild>
        <Link href={user ? ROLE_HOME[user.role] : "/login"}>
          {user ? "Back to dashboard" : "Go to sign in"}
        </Link>
      </Button>
    </div>
  );
}
