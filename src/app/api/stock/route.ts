import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(req: Request) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE", "ACCOUNTANT");
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const where: any = {};
    if (searchParams.get("type")) where.type = searchParams.get("type");
    if (searchParams.get("productId")) where.productId = searchParams.get("productId");

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { product: true, user: true, fromWarehouse: true, toWarehouse: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(movements, total, { page, limit, skip }));
  } catch (error) {
    console.error("Failed to fetch stock movements:", error);
    return NextResponse.json({ error: "Failed to fetch stock movements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { productId, type, quantity, notes, reference, fromWarehouseId, toWarehouseId } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validTypes = ["PURCHASE", "SALE", "ADJUSTMENT", "RETURN", "TRANSFER"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid movement type" }, { status: 400 });
    }

    if (type === "TRANSFER" && (!fromWarehouseId || !toWarehouseId)) {
      return NextResponse.json({ error: "Transfer requires fromWarehouseId and toWarehouseId" }, { status: 400 });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return NextResponse.json({ error: "Quantity must be positive" }, { status: 400 });
    }

    const stockChange = type === "SALE" || type === "TRANSFER" ? -qty : qty;

    // Atomic transaction using updateMany with gte check (prevents race conditions)
    const movement = await prisma.$transaction(async (tx) => {
      if (stockChange < 0) {
        const result = await tx.product.updateMany({
          where: {
            id: productId,
            stockQuantity: { gte: Math.abs(stockChange) },
          },
          data: { stockQuantity: { increment: stockChange } },
        });
        if (result.count === 0) {
          const exists = await tx.product.findUnique({ where: { id: productId } });
          if (!exists) throw new Error("Product not found");
          throw new Error("Insufficient stock");
        }
      } else {
        const result = await tx.product.updateMany({
          where: { id: productId },
          data: { stockQuantity: { increment: stockChange } },
        });
        if (result.count === 0) throw new Error("Product not found");
      }

      const mov = await tx.stockMovement.create({
        data: {
          productId,
          userId: authResult.user.id,
          type,
          quantity: qty,
          notes: notes || null,
          reference: reference || null,
          fromWarehouseId: type === "TRANSFER" ? fromWarehouseId : null,
          toWarehouseId: type === "TRANSFER" ? toWarehouseId : type === "PURCHASE" ? toWarehouseId : null,
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
