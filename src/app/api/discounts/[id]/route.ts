import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const discount = await prisma.discount.update({ where: { id }, data: body });
    return NextResponse.json(discount);
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json({ error: "Failed to update discount" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    await prisma.discount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json({ error: "Failed to delete discount" }, { status: 500 });
  }
}
