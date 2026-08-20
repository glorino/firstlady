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
    if (order.status !== "PENDING") return NextResponse.json({ error: "Only pending orders can be approved" }, { status: 400 });

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: authResult.user.id,
        approvedAt: new Date(),
      },
      include: { supplier: true, items: { include: { product: true } } },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PO approve error:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to approve purchase order" }, { status: 500 });
  }
}
