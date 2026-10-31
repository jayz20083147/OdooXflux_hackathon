"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { type FormState } from "@/lib/form";
import { planSchema } from "@/lib/validators";

function parsePlanForm(formData: FormData) {
  const endDateRaw = formData.get("endDate");
  return planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    productId: formData.get("productId") ?? "",
    price: formData.get("price"),
    frequency: formData.get("frequency"),
    minQuantity: formData.get("minQuantity"),
    startDate: formData.get("startDate"),
    endDate:
      typeof endDateRaw === "string" && endDateRaw.trim() !== ""
        ? endDateRaw
        : null,
    autoClose: formData.get("autoClose") ?? undefined,
    earlyClose: formData.get("earlyClose") ?? undefined,
    earlyCloseDays: formData.get("earlyCloseDays") ?? 0,
    pauseAllowed: formData.get("pauseAllowed") ?? undefined,
    autoRenew: formData.get("autoRenew") ?? undefined,
    status: formData.get("status") ?? "ACTIVE",
  });
}

export async function createPlanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const parsed = parsePlanForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) {
    return {
      status: "error",
      message: "End date must be after the start date.",
      errors: { endDate: ["End date must be after the start date"] },
    };
  }

  await prisma.plan.create({ data: parsed.data });

  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}

export async function updatePlanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing plan id." };

  const parsed = parsePlanForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) {
    return {
      status: "error",
      message: "End date must be after the start date.",
      errors: { endDate: ["End date must be after the start date"] },
    };
  }

  await prisma.plan.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin/plans");
  redirect("/admin/plans");
}

export async function deletePlanAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.plan.delete({ where: { id } });
  }
  revalidatePath("/admin/plans");
}

export async function togglePlanStatusAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const plan = await prisma.plan.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!plan) return;
  await prisma.plan.update({
    where: { id },
    data: { status: plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
  });
  revalidatePath("/admin/plans");
}
