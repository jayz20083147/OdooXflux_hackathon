"use client";

import { useActionState, useMemo, useState } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fieldError, initialFormState, type FormState } from "@/lib/form";
import { SUBSCRIPTION_STATUSES, SUBSCRIPTION_STATUS_LABEL } from "@/lib/constants";

export type SubscriptionLineValues = {
  productId: string | null;
  variantId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type ProductOption = {
  id: string;
  name: string;
  basePrice: number;
  variants: { id: string; value: string; surcharge: number }[];
};

export type SubscriptionFormValues = {
  id?: string;
  customerId?: string;
  planId?: string | null;
  templateId?: string | null;
  status?: string;
  startDate?: string;
  endDate?: string | null;
  notes?: string;
  lines?: SubscriptionLineValues[];
};

type EditableLine = {
  key: string;
  productId: string;
  variantId: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

const newKey = () => Math.random().toString(36).slice(2);

function toEditable(line?: SubscriptionLineValues): EditableLine {
  return {
    key: newKey(),
    productId: line?.productId ?? "",
    variantId: line?.variantId ?? "",
    description: line?.description ?? "",
    quantity: line?.quantity ?? 1,
    unitPrice: line?.unitPrice ?? 0,
  };
}

export function SubscriptionForm({
  action,
  defaultValues,
  submitLabel,
  customers,
  plans,
  templates,
  products,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: SubscriptionFormValues;
  submitLabel: string;
  customers: { id: string; name: string; email: string }[];
  plans: { id: string; name: string }[];
  templates: { id: string; name: string }[];
  products: ProductOption[];
}) {
  const [state, formAction, isPending] = useActionState(action, initialFormState);
  const [lines, setLines] = useState<EditableLine[]>(
    defaultValues?.lines && defaultValues.lines.length > 0
      ? defaultValues.lines.map(toEditable)
      : [toEditable()],
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  function updateLine(key: string, patch: Partial<EditableLine>) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function onProductChange(key: string, productId: string) {
    const product = productById.get(productId);
    updateLine(key, {
      productId,
      variantId: "",
      description: product?.name ?? "",
      unitPrice: product?.basePrice ?? 0,
    });
  }

  function onVariantChange(key: string, variantId: string) {
    const line = lines.find((item) => item.key === key);
    const product = line ? productById.get(line.productId) : undefined;
    const variant = product?.variants.find((item) => item.id === variantId);
    updateLine(key, {
      variantId,
      unitPrice: product
        ? product.basePrice + (variant?.surcharge ?? 0)
        : line?.unitPrice ?? 0,
    });
  }

  const serializedLines = lines.map((line) => ({
    productId: line.productId || null,
    variantId: line.variantId || null,
    description: line.description,
    quantity: Number(line.quantity) || 0,
    unitPrice: Number(line.unitPrice) || 0,
  }));

  const subtotal = serializedLines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}
      <input type="hidden" name="lines" value={JSON.stringify(serializedLines)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscription</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="customerId">Customer</Label>
            <Select
              id="customerId"
              name="customerId"
              defaultValue={defaultValues?.customerId ?? ""}
              required
            >
              <option value="">Select a customer…</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.email}
                </option>
              ))}
            </Select>
            {fieldError(state, "customerId") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "customerId")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={defaultValues?.status ?? "DRAFT"}
            >
              {SUBSCRIPTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {SUBSCRIPTION_STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="planId">Plan</Label>
            <Select id="planId" name="planId" defaultValue={defaultValues?.planId ?? ""}>
              <option value="">No plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="templateId">Quotation template</Label>
            <Select
              id="templateId"
              name="templateId"
              defaultValue={defaultValues?.templateId ?? ""}
            >
              <option value="">No template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
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
              <p className="text-xs text-destructive">{fieldError(state, "endDate")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={defaultValues?.notes ?? ""}
              placeholder="Internal notes for this subscription"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Lines</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((prev) => [...prev, toEditable()])}
          >
            <Plus /> Add line
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line) => {
            const product = productById.get(line.productId);
            return (
              <div key={line.key} className="rounded-md border p-3">
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="space-y-1 sm:col-span-4">
                    <Label>Product</Label>
                    <Select
                      value={line.productId}
                      onChange={(event) => onProductChange(line.key, event.target.value)}
                    >
                      <option value="">Custom line</option>
                      {products.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <Label>Variant</Label>
                    <Select
                      value={line.variantId}
                      disabled={!product || product.variants.length === 0}
                      onChange={(event) => onVariantChange(line.key, event.target.value)}
                    >
                      <option value="">None</option>
                      {product?.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.value} (+{variant.surcharge})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <Label>Description</Label>
                    <Input
                      value={line.description}
                      onChange={(event) =>
                        updateLine(line.key, { description: event.target.value })
                      }
                      placeholder="Line description"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(event) =>
                        updateLine(line.key, { quantity: Number(event.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(event) =>
                        updateLine(line.key, { unitPrice: Number(event.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Amount: {(Number(line.quantity) * Number(line.unitPrice)).toFixed(2)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines((prev) => prev.filter((item) => item.key !== line.key))
                    }
                  >
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
            );
          })}

          {fieldError(state, "lines") ? (
            <p className="text-xs text-destructive">{fieldError(state, "lines")}</p>
          ) : null}

          <p className="text-right text-sm font-medium">
            Line subtotal: {subtotal.toFixed(2)}
          </p>
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
