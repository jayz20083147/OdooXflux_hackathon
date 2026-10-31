import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "./auth.config";
import { ROLE_HOME } from "./lib/constants";

const { auth } = NextAuth(authConfig);

/** Routes that never require authentication. */
const PUBLIC_PATHS = ["/login", "/signup"];

/** Paths only an ADMIN may reach. */
const ADMIN_ONLY_PREFIXES = [
  "/admin/staff",
  "/admin/quotations",
  "/admin/taxes",
  "/admin/discounts",
];

/** Paths an ADMIN or STAFF may reach. */
const STAFF_PREFIXES = ["/admin"];

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;
  const isLoggedIn = Boolean(session?.user);

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Allow API routes to be handled by route handlers directly
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Signed-in users should not see the auth screens.
  if (isPublic) {
    if (isLoggedIn && role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminOnly = ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isAdminOnly && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/forbidden", nextUrl));
  }

  const requiresStaff = STAFF_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (requiresStaff && role !== "ADMIN" && role !== "STAFF") {
    return NextResponse.redirect(new URL("/forbidden", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
