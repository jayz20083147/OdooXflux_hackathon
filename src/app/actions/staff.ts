"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id || id === admin.id) return; // never delete yourself

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!target || target.role === "CUSTOMER") return;

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/staff");
}
