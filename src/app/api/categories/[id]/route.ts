import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const allowedFields: Record<string, any> = {};
    for (const key of ["name", "description"]) {
      if (body[key] !== undefined) allowedFields[key] = body[key];
    }
    const category = await prisma.category.update({ where: { id }, data: allowedFields });
    return NextResponse.json(category);
  } catch (error: any) {
    console.error("Failed to update category:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    console.error("Failed to delete category:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
