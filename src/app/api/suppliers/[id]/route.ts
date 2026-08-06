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
    for (const key of ["name", "email", "phone", "address"]) {
      if (body[key] !== undefined) allowedFields[key] = body[key];
    }
    const supplier = await prisma.supplier.update({ where: { id }, data: allowedFields });
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ message: "Supplier deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
