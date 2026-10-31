"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type FormState } from "@/lib/form";
import { signupSchema, staffSchema } from "@/lib/validators";
import { ROLE_HOME } from "@/lib/constants";
import { requireRole } from "@/lib/session";

const INVALID_CREDENTIALS: FormState = {
  status: "error",
  message: "Invalid email or password.",
};

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl =
    String(formData.get("callbackUrl") ?? "").trim() || undefined;

  if (!email || !password) {
    return { status: "error", message: "Email and password are required." };
  }

  let redirectTo = callbackUrl;
  if (!redirectTo) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    redirectTo = user
      ? (ROLE_HOME[user.role as keyof typeof ROLE_HOME] ?? "/dashboard")
      : "/dashboard";
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return INVALID_CREDENTIALS;
    }
    throw error; // re-throw redirect
  }

  return { status: "success" };
}

export async function signupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (parsed.data.password !== confirmPassword) {
    return {
      status: "error",
      message: "Passwords do not match.",
      errors: { confirmPassword: ["Passwords do not match"] },
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return {
      status: "error",
      message: "An account with that email already exists.",
      errors: { email: ["Email is already registered"] },
    };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: await bcrypt.hash(parsed.data.password, 10),
      role: "CUSTOMER",
    },
  });

  try {
    // Self sign-up always creates a CUSTOMER.
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: ROLE_HOME.CUSTOMER,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        status: "error",
        message: "Account created, but sign-in failed. Please log in.",
      };
    }
    throw error;
  }

  return { status: "success" };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createStaffAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Defence in depth: only ADMIN may create staff members.
  await requireRole("ADMIN");

  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") ?? "STAFF",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return {
      status: "error",
      message: "That email is already in use.",
      errors: { email: ["Email is already registered"] },
    };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: await bcrypt.hash(parsed.data.password, 10),
      role: parsed.data.role === "ADMIN" ? "ADMIN" : "STAFF",
    },
  });

  revalidatePath("/admin/staff");
  return { status: "success", message: `${parsed.data.name} added as staff.` };
}
