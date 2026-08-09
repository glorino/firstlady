import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN", "SALES");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const allowedFields: Record<string, any> = {};
    for (const key of ["name", "email", "phone", "address"]) {
      if (body[key] !== undefined) allowedFields[key] = body[key];
    }
    const customer = await prisma.customer.update({ where: { id }, data: allowedFields });
    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("Failed to update customer:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ message: "Customer deleted" });
  } catch (error: any) {
    console.error("Failed to delete customer:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
