import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { staffSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict Role Guard: Only ADMIN can create staff members
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can create staff accounts" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = staffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role ?? "STAFF",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ staff, message: "Staff account created" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users/staff error:", error);
    return NextResponse.json({ error: "Failed to create staff account" }, { status: 500 });
  }
}

