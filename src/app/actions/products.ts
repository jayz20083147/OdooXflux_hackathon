"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { type FormState } from "@/lib/form";
import { productSchema, type VariantInput } from "@/lib/validators";

function parseVariants(raw: FormDataEntryValue | null): unknown[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function variantSku(productSku: string, variant: VariantInput, index: number) {
  const value = variant.value.trim().replace(/\s+/g, "-").toUpperCase();
  return `${productSku}-${variant.type}-${value || index + 1}`;
}

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "",
    basePrice: formData.get("basePrice"),
    active: formData.get("active") ?? undefined,
    variants: parseVariants(formData.get("variants")),
  });
}

function isUniqueError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, sku, description, category, basePrice, active, variants } =
    parsed.data;

  try {
    await prisma.product.create({
      data: {
        name,
        sku,
        description,
        category,
        basePrice,
        active,
        variants: {
          create: variants.map((variant, index) => ({
            type: variant.type,
            value: variant.value.trim(),
            surcharge: variant.surcharge,
            sku: variantSku(sku, variant, index),
          })),
        },
      },
    });
  } catch (error) {
    if (isUniqueError(error)) {
      return {
        status: "error",
        message: "A product or variant with that SKU already exists.",
        errors: { sku: ["SKU already in use"] },
      };
    }
    throw error;
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing product id." };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, sku, description, category, basePrice, active, variants } =
    parsed.data;

  const existing = await prisma.variant.findMany({
    where: { productId: id },
    select: { id: true },
  });
  const keptIds = variants
    .map((variant) => variant.id)
    .filter((value): value is string => Boolean(value));
  const removedIds = existing
    .map((variant) => variant.id)
    .filter((variantId) => !keptIds.includes(variantId));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { name, sku, description, category, basePrice, active },
      });

      if (removedIds.length > 0) {
        await tx.variant.deleteMany({ where: { id: { in: removedIds } } });
      }

      for (const [index, variant] of variants.entries()) {
        const data = {
          type: variant.type,
          value: variant.value.trim(),
          surcharge: variant.surcharge,
        };
        if (variant.id) {
          await tx.variant.update({ where: { id: variant.id }, data });
        } else {
          await tx.variant.create({
            data: {
              ...data,
              productId: id,
              sku: variantSku(sku, variant, index),
            },
          });
        }
      }
    });
  } catch (error) {
    if (isUniqueError(error)) {
      return {
        status: "error",
        message: "A product or variant with that SKU already exists.",
        errors: { sku: ["SKU already in use"] },
      };
    }
    throw error;
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.product.delete({ where: { id } });
  }
  revalidatePath("/admin/products");
}

export async function toggleProductActiveAction(
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { active: true },
  });
  if (!product) return;
  await prisma.product.update({
    where: { id },
    data: { active: !product.active },
  });
  revalidatePath("/admin/products");
}
