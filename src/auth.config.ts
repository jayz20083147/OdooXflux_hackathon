import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe portion of the NextAuth configuration.
 * It must NOT import Prisma or bcrypt so that it can run inside middleware.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? session.user.id;
        session.user.role = token.role ?? "CUSTOMER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
