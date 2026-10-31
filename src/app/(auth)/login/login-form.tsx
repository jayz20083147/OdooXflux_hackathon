"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Shield, Users, User, ArrowRight } from "lucide-react";

import { loginAction } from "@/app/actions/auth";
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
import { initialFormState } from "@/lib/form";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialFormState,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillRole = (role: "Admin" | "Staff" | "Customer") => {
    if (role === "Admin") {
      setEmail("admin@brightloop.com");
      setPassword("Admin@123");
    } else if (role === "Staff") {
      setEmail("staff1@brightloop.com");
      setPassword("Staff@123");
    } else {
      setEmail("customer1@brightloop.com");
      setPassword("Customer@123");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sign in</CardTitle>
        <CardDescription>
          Use your Brightloop account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Quick Demo 1-Click Role Switcher */}
        <div className="mb-5 rounded-lg border border-dashed bg-muted/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
            1-Click Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              id="demo-btn-admin"
              onClick={() => fillRole("Admin")}
              className="h-8 text-xs font-medium gap-1.5 border-primary/30 hover:bg-primary/10"
            >
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Admin</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              id="demo-btn-staff"
              onClick={() => fillRole("Staff")}
              className="h-8 text-xs font-medium gap-1.5 border-primary/30 hover:bg-primary/10"
            >
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>Staff</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              id="demo-btn-customer"
              onClick={() => fillRole("Customer")}
              className="h-8 text-xs font-medium gap-1.5 border-primary/30 hover:bg-primary/10"
            >
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Customer</span>
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            Click any role to autofill test credentials.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@brightloop.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {state.message ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" id="login-submit-button" className="w-full gap-2" disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
