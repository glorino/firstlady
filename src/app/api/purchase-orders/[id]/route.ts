import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE", "ACCOUNTANT");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch purchase order:", error);
    return NextResponse.json({ error: "Failed to fetch purchase order" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    if (existing.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot edit a completed purchase order" }, { status: 400 });
    }

    const allowedFields: Record<string, any> = {};
    if (body.status && ["PENDING", "COMPLETED", "CANCELLED"].includes(body.status)) {
      allowedFields.status = body.status;
    }
    if (body.expectedDate) allowedFields.expectedDate = new Date(body.expectedDate);
    if (body.notes !== undefined) allowedFields.notes = body.notes;

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: allowedFields,
      include: { supplier: true, items: { include: { product: true } } },
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Failed to update purchase order:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }
    if (existing.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot delete a completed purchase order" }, { status: 400 });
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    return NextResponse.json({ message: "Purchase order deleted" });
  } catch (error: any) {
    console.error("Failed to delete purchase order:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete purchase order" }, { status: 500 });
  }
}
