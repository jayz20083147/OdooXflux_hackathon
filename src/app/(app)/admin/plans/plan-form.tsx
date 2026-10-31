"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fieldError, initialFormState, type FormState } from "@/lib/form";
import { FREQUENCIES, FREQUENCY_LABEL, PLAN_STATUSES } from "@/lib/constants";

export type PlanFormValues = {
  id?: string;
  name?: string;
  description?: string;
  productId?: string | null;
  price?: number;
  frequency?: string;
  minQuantity?: number;
  startDate?: string;
  endDate?: string | null;
  autoClose?: boolean;
  earlyClose?: boolean;
  earlyCloseDays?: number;
  pauseAllowed?: boolean;
  autoRenew?: boolean;
  status?: string;
};

export function PlanForm({
  action,
  defaultValues,
  submitLabel,
  products,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: PlanFormValues;
  submitLabel: string;
  products: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialFormState,
  );
  const [earlyClose, setEarlyClose] = useState(defaultValues?.earlyClose ?? false);

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name ?? ""}
              placeholder="Weekly Juice Reset"
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
              placeholder="What the subscriber gets"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="productId">Linked product</Label>
            <Select
              id="productId"
              name="productId"
              defaultValue={defaultValues?.productId ?? ""}
            >
              <option value="">No product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Price per cycle</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.price ?? 0}
              required
            />
            {fieldError(state, "price") ? (
              <p className="text-xs text-destructive">{fieldError(state, "price")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              id="frequency"
              name="frequency"
              defaultValue={defaultValues?.frequency ?? "MONTHLY"}
            >
              {FREQUENCIES.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {FREQUENCY_LABEL[frequency]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="minQuantity">Minimum quantity</Label>
            <Input
              id="minQuantity"
              name="minQuantity"
              type="number"
              min="1"
              step="1"
              defaultValue={defaultValues?.minQuantity ?? 1}
              required
            />
            {fieldError(state, "minQuantity") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "minQuantity")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={defaultValues?.startDate ?? ""}
              required
            />
            {fieldError(state, "startDate") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "startDate")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endDate">End date (optional)</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={defaultValues?.endDate ?? ""}
            />
            {fieldError(state, "endDate") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "endDate")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={defaultValues?.status ?? "ACTIVE"}
            >
              {PLAN_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lifecycle flags</CardTitle>
          <p className="text-sm text-muted-foreground">
            Control what happens when a subscription reaches the end of its window.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              name="autoClose"
              defaultChecked={defaultValues?.autoClose ?? false}
              className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            <span>
              <span className="font-medium">autoClose</span>
              <span className="block text-xs text-muted-foreground">
                Close the subscription automatically on the end date.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              name="pauseAllowed"
              defaultChecked={defaultValues?.pauseAllowed ?? false}
              className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            <span>
              <span className="font-medium">pause</span>
              <span className="block text-xs text-muted-foreground">
                Subscribers may pause deliveries instead of cancelling.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              name="earlyClose"
              checked={earlyClose}
              onChange={(event) => setEarlyClose(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            <span>
              <span className="font-medium">earlyClose</span>
              <span className="block text-xs text-muted-foreground">
                Allow closing before the end date.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
            <input
              type="checkbox"
              name="autoRenew"
              defaultChecked={defaultValues?.autoRenew ?? false}
              className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            <span>
              <span className="font-medium">renew</span>
              <span className="block text-xs text-muted-foreground">
                Renew the subscription automatically at the end date.
              </span>
            </span>
          </label>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="earlyCloseDays">
              Early close window (days before end date)
            </Label>
            <Input
              id="earlyCloseDays"
              name="earlyCloseDays"
              type="number"
              min="0"
              step="1"
              disabled={!earlyClose}
              defaultValue={defaultValues?.earlyCloseDays ?? 0}
            />
            <p className="text-xs text-muted-foreground">
              Only used when earlyClose is enabled.
            </p>
          </div>
        </CardContent>
      </Card>

      {state.status === "error" && state.message ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" /> Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
