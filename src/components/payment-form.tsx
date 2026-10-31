"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { recordPaymentAction } from "@/app/actions/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  formatCurrency,
} from "@/lib/constants";
import { fieldError, initialFormState } from "@/lib/form";

/**
 * Records a (possibly partial) payment against an invoice. The maximum the
 * customer can pay is capped at the outstanding balance.
 */
export function PaymentForm({
  invoiceId,
  outstanding,
}: {
  invoiceId: string;
  outstanding: number;
}) {
  const [state, formAction, isPending] = useActionState(
    recordPaymentAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            max={outstanding}
            defaultValue={outstanding.toFixed(2)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Outstanding: {formatCurrency(outstanding)}
          </p>
          {fieldError(state, "amount") ? (
            <p className="text-xs text-destructive">{fieldError(state, "amount")}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="method">Method</Label>
          <Select id="method" name="method" defaultValue="BANK_TRANSFER">
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABEL[method]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="paidAt">Paid on</Label>
          <Input id="paidAt" name="paidAt" type="date" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            name="reference"
            placeholder="Txn / cheque no. (optional)"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="note">Note</Label>
          <Input id="note" name="note" placeholder="Optional note" />
        </div>
      </div>

      {state.status === "error" && state.message ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" /> Recording…
          </>
        ) : (
          "Record payment"
        )}
      </Button>
    </form>
  );
}
