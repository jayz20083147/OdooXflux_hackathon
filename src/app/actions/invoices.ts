"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateDueInvoices } from "@/lib/billing-service";
import { invoiceBalance } from "@/lib/constants";
import type { FormState } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { paymentSchema } from "@/lib/validators";

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function revalidateInvoices(id?: string) {
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/invoices");
  if (id) {
    revalidatePath(`/admin/invoices/${id}`);
    revalidatePath(`/dashboard/invoices/${id}`);
  }
}

/**
 * Recomputes an invoice's paid amount from its recorded payments and syncs the
 * derived status (PAID vs CONFIRMED). Amounts are always derived, never trusted
 * from the caller.
 */
async function resyncInvoicePayment(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  options?: { forcePaid?: boolean },
) {
  const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const agg = await tx.payment.aggregate({
    where: { invoiceId },
    _sum: { amount: true },
  });

  const paidAmount = roundMoney(agg._sum.amount ?? 0);
  const fullyPaid =
    invoice.total <= 0
      ? Boolean(options?.forcePaid)
      : paidAmount >= invoice.total - 0.005;

  const voided = invoice.status === "CANCELLED" || invoice.status === "DRAFT";
  const now = new Date();

  await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount,
      status: fullyPaid ? "PAID" : voided ? invoice.status : "CONFIRMED",
      paidAt: fullyPaid ? (invoice.paidAt ?? now) : null,
      confirmedAt: fullyPaid ? (invoice.confirmedAt ?? now) : invoice.confirmedAt,
    },
  });
}

/** Idempotently generates invoices for every due ACTIVE subscription. */
export async function generateInvoicesAction(): Promise<void> {
  const user = await requireUser();
  if (user.role === "CUSTOMER") redirect("/forbidden");

  const result = await generateDueInvoices();

  revalidateInvoices();
  redirect(
    `/admin/invoices?generated=${result.created}&skipped=${result.skipped}&closed=${result.closed}`,
  );
}

export async function invoiceStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role === "CUSTOMER") redirect("/forbidden");

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!id) return;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { usages: true },
  });
  if (!invoice) return;

  const now = new Date();

  if (action === "CONFIRM") {
    if (invoice.status !== "DRAFT") return;
    await prisma.invoice.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedAt: now },
    });
  } else if (action === "CANCEL") {
    if (invoice.status === "CANCELLED" || invoice.status === "PAID") return;
    // Money has been recorded — remove the payments before cancelling.
    if (invoice.paidAmount > 0) return;
    await prisma.$transaction(async (tx) => {
      // Release tracked discount usage back to the rules.
      for (const usage of invoice.usages) {
        await tx.discountUsage.delete({ where: { id: usage.id } });
        await tx.discountRule.update({
          where: { id: usage.discountRuleId },
          data: { usedCount: { decrement: 1 } },
        });
      }
      await tx.invoice.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: now },
      });
    });
  } else if (action === "MARK_PAID") {
    if (invoice.status === "CANCELLED" || invoice.status === "PAID") return;
    const outstanding = invoiceBalance(invoice);
    await prisma.$transaction(async (tx) => {
      // Record the remaining balance as a payment so history stays consistent.
      if (outstanding > 0) {
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: outstanding,
            method: "OTHER",
            note: "Marked as paid",
            recordedById: user.id,
            paidAt: now,
          },
        });
      }
      await resyncInvoicePayment(tx, invoice.id, { forcePaid: true });
    });
  } else {
    return;
  }

  revalidateInvoices(id);
}

/** Records a (possibly partial) payment against an invoice. */
export async function recordPaymentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = paymentSchema.safeParse({
    invoiceId: String(formData.get("invoiceId") ?? ""),
    amount: formData.get("amount"),
    method: String(formData.get("method") ?? "BANK_TRANSFER"),
    reference: String(formData.get("reference") ?? ""),
    note: String(formData.get("note") ?? ""),
    paidAt: String(formData.get("paidAt") ?? ""),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: parsed.data.invoiceId },
  });
  if (!invoice) {
    return { status: "error", message: "Invoice not found." };
  }

  // RBAC: Staff and Admin can record payments on any invoice;
  // Customers may only pay their own invoices.
  if (user.role === "CUSTOMER" && invoice.customerId !== user.id) {
    return { status: "error", message: "You can only pay your own invoices." };
  }

  if (invoice.status === "CANCELLED") {
    return { status: "error", message: "Cannot record a payment on a cancelled invoice." };
  }
  if (invoice.status === "DRAFT") {
    return { status: "error", message: "Confirm the invoice before recording payments." };
  }

  const outstanding = invoiceBalance(invoice);
  if (outstanding <= 0) {
    return { status: "error", message: "This invoice is already fully paid." };
  }
  if (parsed.data.amount > outstanding + 0.005) {
    return {
      status: "error",
      message: `Amount exceeds the outstanding balance of ${outstanding.toFixed(2)}.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: roundMoney(parsed.data.amount),
        method: parsed.data.method,
        reference: parsed.data.reference,
        note: parsed.data.note,
        recordedById: user.id,
        paidAt: parsed.data.paidAt,
      },
    });
    await resyncInvoicePayment(tx, invoice.id);
  });

  revalidateInvoices(invoice.id);
  return { status: "success", message: "Payment recorded successfully." };
}

/** Removes a payment and recomputes the invoice paid amount. */
export async function deletePaymentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role === "CUSTOMER") redirect("/forbidden");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return;

  const invoice = await prisma.invoice.findUnique({
    where: { id: payment.invoiceId },
  });
  if (!invoice || invoice.status === "CANCELLED") return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id } });
    await resyncInvoicePayment(tx, payment.invoiceId);
  });

  revalidateInvoices(payment.invoiceId);
}

export async function deleteInvoiceAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (user.role === "CUSTOMER") redirect("/forbidden");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { usages: true },
  });
  if (!invoice || invoice.status !== "DRAFT") return;

  await prisma.$transaction(async (tx) => {
    for (const usage of invoice.usages) {
      await tx.discountRule.update({
        where: { id: usage.discountRuleId },
        data: { usedCount: { decrement: 1 } },
      });
    }
    await tx.invoice.delete({ where: { id } });
  });

  revalidateInvoices();
}
