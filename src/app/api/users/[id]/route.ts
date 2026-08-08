import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await req.json();

    // Whitelist allowed fields — no password or role escalation via this endpoint
    const allowedFields: Record<string, any> = {};
    const allowed = ["name", "phone", "isActive"];
    for (const key of allowed) {
      if (body[key] !== undefined) allowedFields[key] = body[key];
    }

    // Role changes only by admin, but validate the value
    if (body.role && ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTANT"].includes(body.role)) {
      allowedFields.role = body.role;
    }

    const user = await prisma.user.update({
      where: { id },
      data: allowedFields,
      select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
    });
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Failed to update user:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    if (id === authResult.user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted" });
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
