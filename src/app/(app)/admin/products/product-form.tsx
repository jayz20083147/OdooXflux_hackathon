"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fieldError, initialFormState, type FormState } from "@/lib/form";
import { VARIANT_TYPES } from "@/lib/constants";

type VariantRow = {
  id?: string;
  type: string;
  value: string;
  surcharge: string;
};

export type ProductFormValues = {
  id?: string;
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  basePrice?: number;
  active?: boolean;
  variants?: { id?: string; type: string; value: string; surcharge: number }[];
};

export function ProductForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialFormState,
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    (defaultValues?.variants ?? []).map((variant) => ({
      id: variant.id,
      type: variant.type,
      value: variant.value,
      surcharge: String(variant.surcharge),
    })),
  );

  function addVariant() {
    setVariants((current) => [
      ...current,
      { type: "BRAND", value: "", surcharge: "0" },
    ]);
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}
      <input
        type="hidden"
        name="variants"
        value={JSON.stringify(
          variants.map((variant) => ({
            id: variant.id,
            type: variant.type,
            value: variant.value,
            surcharge: Number(variant.surcharge) || 0,
          })),
        )}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultValues?.name ?? ""}
              placeholder="Arabica Coffee Beans"
              required
            />
            {fieldError(state, "name") ? (
              <p className="text-xs text-destructive">{fieldError(state, "name")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              defaultValue={defaultValues?.sku ?? ""}
              placeholder="COF-ARB-001"
              required
            />
            {fieldError(state, "sku") ? (
              <p className="text-xs text-destructive">{fieldError(state, "sku")}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              defaultValue={defaultValues?.category ?? ""}
              placeholder="Coffee"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="basePrice">Base price</Label>
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.basePrice ?? 0}
              required
            />
            {fieldError(state, "basePrice") ? (
              <p className="text-xs text-destructive">
                {fieldError(state, "basePrice")}
              </p>
            ) : null}
          </div>

          <div className="flex items-end gap-2 pb-1">
            <input
              id="active"
              name="active"
              type="checkbox"
              defaultChecked={defaultValues?.active ?? true}
              className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            />
            <Label htmlFor="active">Active (available for new plans)</Label>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={defaultValues?.description ?? ""}
              placeholder="What makes this product special?"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Variants</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add brand surcharges or any other variant markup.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus /> Add variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {variants.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No variants. Products work fine without variants.
            </p>
          ) : (
            variants.map((variant, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-md border p-3 sm:grid-cols-[140px_1fr_140px_auto] sm:items-end"
              >
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select
                    value={variant.type}
                    onChange={(event) =>
                      updateVariant(index, { type: event.target.value })
                    }
                  >
                    {VARIANT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Value</Label>
                  <Input
                    value={variant.value}
                    placeholder="Nike"
                    onChange={(event) =>
                      updateVariant(index, { value: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Surcharge</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.surcharge}
                    onChange={(event) =>
                      updateVariant(index, { surcharge: event.target.value })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => removeVariant(index)}
                  aria-label="Remove variant"
                >
                  <Trash />
                </Button>
              </div>
            ))
          )}
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
