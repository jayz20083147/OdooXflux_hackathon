"use client";

import { useActionState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { createStaffAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldError, initialFormState } from "@/lib/form";

export function StaffForm() {
  const [state, formAction, isPending] = useActionState(
    createStaffAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="staff-name">Full name</Label>
        <Input id="staff-name" name="name" placeholder="Sam Staff" required />
        {fieldError(state, "name") ? (
          <p className="text-xs text-destructive">{fieldError(state, "name")}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="staff-email">Email</Label>
        <Input
          id="staff-email"
          name="email"
          type="email"
          placeholder="sam@brightloop.com"
          required
        />
        {fieldError(state, "email") ? (
          <p className="text-xs text-destructive">{fieldError(state, "email")}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="staff-password">Temporary password</Label>
        <Input id="staff-password" name="password" type="text" required />
        <p className="text-xs text-muted-foreground">
          Min 8 characters with uppercase, lowercase and a special character.
        </p>
        {fieldError(state, "password") ? (
          <p className="text-xs text-destructive">
            {fieldError(state, "password")}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          }
        >
          {state.status === "success" ? <Check className="h-4 w-4" /> : null}
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" /> Creating…
          </>
        ) : (
          "Create staff account"
        )}
      </Button>
    </form>
  );
}
