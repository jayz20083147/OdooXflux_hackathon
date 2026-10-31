import Link from "next/link";

import { SignupForm } from "./signup-form";

export const metadata = { title: "Create account · Brightloop" };

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
