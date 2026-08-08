import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN", "ACCOUNTANT");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const allowedFields: Record<string, any> = {};
    if (body.status && ["APPROVED", "REJECTED", "PENDING"].includes(body.status)) {
      allowedFields.status = body.status;
    }
    if (body.title !== undefined) allowedFields.title = body.title;
    if (body.description !== undefined) allowedFields.description = body.description;
    if (body.amount !== undefined) allowedFields.amount = Number(body.amount);
    if (body.category !== undefined) allowedFields.category = body.category;
    if (body.date !== undefined) allowedFields.date = new Date(body.date);

    const expense = await prisma.expense.update({
      where: { id },
      data: allowedFields,
      include: { user: true },
    });

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("Failed to update expense:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ message: "Expense deleted" });
  } catch (error: any) {
    console.error("Failed to delete expense:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
