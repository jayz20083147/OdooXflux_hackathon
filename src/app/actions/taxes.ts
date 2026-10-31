"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type FormState } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { taxRuleSchema } from "@/lib/validators";

function parseTaxForm(formData: FormData) {
  return taxRuleSchema.safeParse({
    name: formData.get("name"),
    rate: formData.get("rate"),
    scope: formData.get("scope") ?? "ALL",
    scopeValue: formData.get("scopeValue") ?? "",
    active: formData.get("active") != null,
  });
}

export async function createTaxRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const parsed = parseTaxForm(formData);
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

  await prisma.taxRule.create({ data: parsed.data });

  revalidatePath("/admin/taxes");
  redirect("/admin/taxes");
}

export async function updateTaxRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing tax rule id." };

  const parsed = parseTaxForm(formData);
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

  await prisma.taxRule.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin/taxes");
  redirect("/admin/taxes");
}

export async function deleteTaxRuleAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.taxRule.delete({ where: { id } });
  }
  revalidatePath("/admin/taxes");
}

export async function toggleTaxRuleAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const rule = await prisma.taxRule.findUnique({
    where: { id },
    select: { active: true },
  });
  if (!rule) return;
  await prisma.taxRule.update({
    where: { id },
    data: { active: !rule.active },
  });
  revalidatePath("/admin/taxes");
}
