"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { fieldError, initialFormState, type FormState } from "@/lib/form";
import { TAX_SCOPES } from "@/lib/constants";

export type TaxRuleFormValues = {
  id?: string;
  name?: string;
  rate?: number;
  scope?: string;
  scopeValue?: string | null;
  active?: boolean;
};

export function TaxRuleForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: TaxRuleFormValues;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialFormState);
  const [scope, setScope] = useState(defaultValues?.scope ?? "ALL");

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax rule</CardTitle>
          <p className="text-sm text-muted-foreground">
            Active tax rules are applied automatically when invoices are generated.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name ?? ""}
              placeholder="VAT"
              required
            />
            {fieldError(state, "name") ? (
              <p className="text-xs text-destructive">{fieldError(state, "name")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rate">Rate (%)</Label>
            <Input
              id="rate"
              name="rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={defaultValues?.rate ?? 0}
              required
            />
            {fieldError(state, "rate") ? (
              <p className="text-xs text-destructive">{fieldError(state, "rate")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scope">Applies to</Label>
            <Select
              id="scope"
              name="scope"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              {TAX_SCOPES.map((value) => (
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

          <div className="space-y-1.5 sm:col-span-2">
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

          <label className="flex items-start gap-2 rounded-md border p-3 text-sm sm:col-span-2">
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
