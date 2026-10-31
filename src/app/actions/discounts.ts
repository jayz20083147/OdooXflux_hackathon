"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { type FormState } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { discountRuleSchema } from "@/lib/validators";

function parseDiscountForm(formData: FormData) {
  const from = formData.get("validFrom");
  const to = formData.get("validTo");
  return discountRuleSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code") ?? "",
    kind: formData.get("kind") ?? "PERCENT",
    value: formData.get("value"),
    minSubtotal: formData.get("minSubtotal") ?? 0,
    minQuantity: formData.get("minQuantity") ?? 0,
    scope: formData.get("scope") ?? "ALL",
    scopeValue: formData.get("scopeValue") ?? "",
    maxUses: formData.get("maxUses") ?? 0,
    validFrom: typeof from === "string" && from.trim() !== "" ? from : null,
    validTo: typeof to === "string" && to.trim() !== "" ? to : null,
    active: formData.get("active") != null,
  });
}

function isUniqueError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function createDiscountRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const parsed = parseDiscountForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.scope !== "ALL" && !parsed.data.scopeValue) {
    return {
      status: "error",
      message: "Provide a category or product for the selected scope.",
      errors: { scopeValue: ["Required for CATEGORY / PRODUCT scope"] },
    };
  }

  try {
    await prisma.discountRule.create({ data: parsed.data });
  } catch (error) {
    if (isUniqueError(error)) {
      return {
        status: "error",
        message: "That discount code is already in use.",
        errors: { code: ["Code already in use"] },
      };
    }
    throw error;
  }

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function updateDiscountRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing discount rule id." };

  const parsed = parseDiscountForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.scope !== "ALL" && !parsed.data.scopeValue) {
    return {
      status: "error",
      message: "Provide a category or product for the selected scope.",
      errors: { scopeValue: ["Required for CATEGORY / PRODUCT scope"] },
    };
  }

  try {
    await prisma.discountRule.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (isUniqueError(error)) {
      return {
        status: "error",
        message: "That discount code is already in use.",
        errors: { code: ["Code already in use"] },
      };
    }
    throw error;
  }

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function deleteDiscountRuleAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.discountRule.delete({ where: { id } });
  }
  revalidatePath("/admin/discounts");
}

export async function toggleDiscountRuleAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const rule = await prisma.discountRule.findUnique({
    where: { id },
    select: { active: true },
  });
  if (!rule) return;
  await prisma.discountRule.update({
    where: { id },
    data: { active: !rule.active },
  });
  revalidatePath("/admin/discounts");
}
