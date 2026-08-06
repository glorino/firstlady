import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

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
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { productId, type, quantity, notes, reference } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validTypes = ["PURCHASE", "SALE", "ADJUSTMENT", "RETURN", "TRANSFER"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid movement type" }, { status: 400 });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return NextResponse.json({ error: "Quantity must be positive" }, { status: 400 });
    }

    // Validate stock won't go negative
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const stockChange = type === "SALE" || type === "TRANSFER" ? -qty : qty;
    if (product.stockQuantity + stockChange < 0) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const movement = await prisma.$transaction(async (tx) => {
      const mov = await tx.stockMovement.create({
        data: {
          productId,
          userId: authResult.user.id,
          type,
          quantity: qty,
          notes: notes || null,
          reference: reference || null,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: product.stockQuantity + stockChange },
      });

      return mov;
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create stock movement" }, { status: 500 });
  }
}
