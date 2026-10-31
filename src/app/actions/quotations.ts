"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type FormState } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { quotationTemplateSchema } from "@/lib/validators";

function parseTemplateForm(formData: FormData) {
  return quotationTemplateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    validityDays: formData.get("validityDays") ?? 30,
    terms: formData.get("terms") ?? "",
    defaultDiscountPercent: formData.get("defaultDiscountPercent") ?? 0,
    active: formData.get("active") != null,
  });
}

export async function createQuotationTemplateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const parsed = parseTemplateForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.quotationTemplate.create({ data: parsed.data });

  revalidatePath("/admin/quotations");
  redirect("/admin/quotations");
}

export async function updateQuotationTemplateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing template id." };

  const parsed = parseTemplateForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.quotationTemplate.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin/quotations");
  redirect("/admin/quotations");
}

export async function deleteQuotationTemplateAction(
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.quotationTemplate.delete({ where: { id } });
  }
  revalidatePath("/admin/quotations");
}

export async function toggleQuotationTemplateAction(
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const template = await prisma.quotationTemplate.findUnique({
    where: { id },
    select: { active: true },
  });
  if (!template) return;
  await prisma.quotationTemplate.update({
    where: { id },
    data: { active: !template.active },
  });
  revalidatePath("/admin/quotations");
}
