import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Brightloop" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="space-y-4">
      <LoginForm callbackUrl={callbackUrl ?? ""} />
      <p className="text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create a customer account
        </Link>
      </p>
    </div>
  );
}
