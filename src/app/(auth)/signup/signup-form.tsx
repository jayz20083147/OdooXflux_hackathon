"use client";

import { useActionState, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { signupAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldError, initialFormState } from "@/lib/form";
import { cn } from "@/lib/utils";

/** Same rules as passwordSchema in src/lib/validators.ts */
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  {
    label: "One special character",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
];

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(
    signupAction,
    initialFormState,
  );
  const [password, setPassword] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create your account</CardTitle>
        <CardDescription>
          Self sign-up creates a Customer account. Staff accounts are created by
          an administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" placeholder="Jane Doe" required />
            {fieldError(state, "name") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "name")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
            {fieldError(state, "email") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "email")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <ul className="mt-2 grid gap-1">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(password);
                return (
                  <li
                    key={rule.label}
                    className={cn(
                      "flex items-center gap-1.5 text-xs",
                      passed ? "text-emerald-600" : "text-muted-foreground",
                    )}
                  >
                    <Check
                      className={cn(
                        "h-3 w-3",
                        passed ? "opacity-100" : "opacity-30",
                      )}
                    />
                    {rule.label}
                  </li>
                );
              })}
            </ul>
            {fieldError(state, "password") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "password")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
            />
            {fieldError(state, "confirmPassword") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "confirmPassword")}
              </p>
            ) : null}
          </div>

          {state.status === "error" && state.message ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" /> Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
