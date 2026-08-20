import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN", "ACCOUNTANT");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    if (order.status !== "APPROVED") return NextResponse.json({ error: "Only approved orders can be marked as paid" }, { status: 400 });

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "PAID",
        paidById: authResult.user.id,
        paidAt: new Date(),
      },
      include: { supplier: true, items: { include: { product: true } } },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PO pay error:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to mark purchase order as paid" }, { status: 500 });
  }
}
