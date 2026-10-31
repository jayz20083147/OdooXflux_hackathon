import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { Role } from "@/lib/constants";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
}

/** Requires any authenticated user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires an authenticated user with one of the given roles. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/forbidden");
  return user;
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}
