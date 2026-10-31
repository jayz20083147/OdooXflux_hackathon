"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { fieldError, initialFormState, type FormState } from "@/lib/form";
import { DISCOUNT_KINDS, DISCOUNT_SCOPES } from "@/lib/constants";

export type DiscountRuleFormValues = {
  id?: string;
  name?: string;
  code?: string | null;
  kind?: string;
  value?: number;
  minSubtotal?: number;
  minQuantity?: number;
  scope?: string;
  scopeValue?: string | null;
  maxUses?: number;
  validFrom?: string | null;
  validTo?: string | null;
  active?: boolean;
};

export function DiscountRuleForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: DiscountRuleFormValues;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialFormState);
  const [scope, setScope] = useState(defaultValues?.scope ?? "ALL");
  const [kind, setKind] = useState(defaultValues?.kind ?? "PERCENT");

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discount rule</CardTitle>
          <p className="text-sm text-muted-foreground">
            Applicable rules are auto-applied to invoices and their usage is tracked.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name ?? ""}
              placeholder="Loyalty 10%"
              required
            />
            {fieldError(state, "name") ? (
              <p className="text-xs text-destructive">{fieldError(state, "name")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code">Code (optional)</Label>
            <Input
              id="code"
              name="code"
              defaultValue={defaultValues?.code ?? ""}
              placeholder="LOYALTY10"
            />
            {fieldError(state, "code") ? (
              <p className="text-xs text-destructive">{fieldError(state, "code")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kind">Type</Label>
            <Select
              id="kind"
              name="kind"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              {DISCOUNT_KINDS.map((value) => (
                <option key={value} value={value}>
                  {value === "PERCENT" ? "Percentage (%)" : "Fixed amount"}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="value">{kind === "PERCENT" ? "Percent (%)" : "Amount"}</Label>
            <Input
              id="value"
              name="value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaultValues?.value ?? 0}
              required
            />
            {fieldError(state, "value") ? (
              <p className="text-xs text-destructive">{fieldError(state, "value")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scope">Scope</Label>
            <Select
              id="scope"
              name="scope"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              {DISCOUNT_SCOPES.map((value) => (
                <option key={value} value={value}>
                  {value === "ALL"
                    ? "Whole invoice"
                    : value === "CATEGORY"
                      ? "Product category"
                      : "Specific product"}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scopeValue">Category or product id</Label>
            <Input
              id="scopeValue"
              name="scopeValue"
              disabled={scope === "ALL"}
              defaultValue={defaultValues?.scopeValue ?? ""}
              placeholder={scope === "ALL" ? "Not required" : "e.g. Coffee"}
            />
            {fieldError(state, "scopeValue") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "scopeValue")}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conditions &amp; limits</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="minSubtotal">Min subtotal</Label>
            <Input
              id="minSubtotal"
              name="minSubtotal"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaultValues?.minSubtotal ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minQuantity">Min quantity</Label>
            <Input
              id="minQuantity"
              name="minQuantity"
              type="number"
              min="0"
              step="1"
              defaultValue={defaultValues?.minQuantity ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxUses">Max uses (0 = unlimited)</Label>
            <Input
              id="maxUses"
              name="maxUses"
              type="number"
              min="0"
              step="1"
              defaultValue={defaultValues?.maxUses ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validFrom">Valid from</Label>
            <Input
              id="validFrom"
              name="validFrom"
              type="date"
              defaultValue={defaultValues?.validFrom ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validTo">Valid to</Label>
            <Input
              id="validTo"
              name="validTo"
              type="date"
              defaultValue={defaultValues?.validTo ?? ""}
            />
            {fieldError(state, "validTo") ? (
              <p className="text-xs text-destructive">{fieldError(state, "validTo")}</p>
            ) : null}
          </div>

          <label className="flex items-start gap-2 rounded-md border p-3 text-sm sm:col-span-3">
            <input
              type="checkbox"
              name="active"
              defaultChecked={defaultValues?.active ?? true}
              className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            <span>
              <span className="font-medium">Active</span>
              <span className="block text-xs text-muted-foreground">
                Inactive rules are skipped by the billing engine.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      {state.status === "error" && state.message ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" /> Saving…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
