import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: { product: true, user: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(movements);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stock movements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, type, quantity, notes, reference } = body;

    // Get user - fallback to first user
    let userId = body.userId;
    if (!userId) {
      const user = await prisma.user.findFirst();
      userId = user?.id;
    }

    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        userId,
        type,
        quantity,
        notes,
        reference,
      },
    });

    // Update product stock
    const stockChange = type === "SALE" || type === "TRANSFER" ? -quantity : quantity;
    await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: { increment: stockChange } },
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create stock movement" }, { status: 500 });
  }
}
