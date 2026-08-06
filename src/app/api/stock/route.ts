import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireRole("ADMIN", "WAREHOUSE", "ACCOUNTANT");
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
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
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

    const stockChange = type === "SALE" || type === "TRANSFER" ? -qty : qty;

    // Atomic transaction — stock check and update in same transaction
    const movement = await prisma.$transaction(async (tx) => {
      // Lock the row and check stock
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error("Product not found");
      }

      const newStock = product.stockQuantity + stockChange;
      if (newStock < 0) {
        throw new Error("Insufficient stock");
      }

      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      });

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

      return mov;
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error: any) {
    if (error.message === "Product not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message === "Insufficient stock") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create stock movement" }, { status: 500 });
  }
}
