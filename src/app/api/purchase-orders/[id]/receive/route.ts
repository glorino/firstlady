import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending purchase orders can be received" }, { status: 400 });
    }

    const received = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQuantity: { gte: 0 },
          },
          data: { stockQuantity: { increment: item.quantity } },
        });

        if (result.count === 0) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: authResult.user.id,
            type: "PURCHASE",
            quantity: item.quantity,
            reference: order.orderNumber,
            notes: `Received from PO ${order.orderNumber}`,
          },
        });
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: "COMPLETED" },
        include: { supplier: true, items: { include: { product: true } } },
      });
    });

    return NextResponse.json(received);
  } catch (error) {
    console.error("PO receive error:", error);
    return NextResponse.json({ error: "Failed to receive purchase order" }, { status: 500 });
  }
}
