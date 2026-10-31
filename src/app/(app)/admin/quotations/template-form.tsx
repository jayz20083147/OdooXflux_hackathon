"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fieldError, initialFormState, type FormState } from "@/lib/form";

export type QuotationTemplateFormValues = {
  id?: string;
  name?: string;
  description?: string;
  validityDays?: number;
  terms?: string;
  defaultDiscountPercent?: number;
  active?: boolean;
};

export function QuotationTemplateForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: QuotationTemplateFormValues;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name ?? ""}
              placeholder="Standard 12-month quote"
              required
            />
            {fieldError(state, "name") ? (
              <p className="text-xs text-destructive">{fieldError(state, "name")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={defaultValues?.description ?? ""}
              placeholder="When this template should be used"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="validityDays">Validity (days)</Label>
            <Input
              id="validityDays"
              name="validityDays"
              type="number"
              min="1"
              step="1"
              defaultValue={defaultValues?.validityDays ?? 30}
              required
            />
            {fieldError(state, "validityDays") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "validityDays")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="defaultDiscountPercent">Default discount (%)</Label>
            <Input
              id="defaultDiscountPercent"
              name="defaultDiscountPercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={defaultValues?.defaultDiscountPercent ?? 0}
            />
            {fieldError(state, "defaultDiscountPercent") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "defaultDiscountPercent")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="terms">Terms &amp; conditions</Label>
            <Textarea
              id="terms"
              name="terms"
              defaultValue={defaultValues?.terms ?? ""}
              placeholder="Payment due within 14 days. Quotation subject to availability."
            />
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
                Active templates can be selected when quoting a subscription.
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
