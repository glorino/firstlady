import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(req: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const params = parsePagination(searchParams);
    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        skip: params.skip, take: params.limit,
        include: { sale: { select: { invoiceNumber: true } }, user: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.return.count(),
    ]);
    return NextResponse.json(paginatedResponse(returns, total, params));
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { saleId, reason, items } = body;

    if (!saleId || !reason || !items?.length) {
      return NextResponse.json({ error: "Sale, reason, and items are required" }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

    let totalAmount = 0;
    for (const item of items) {
      const saleItem = sale.items.find((i: any) => i.productId === item.productId);
      if (!saleItem) return NextResponse.json({ error: `Product not found in sale: ${item.productId}` }, { status: 400 });
      if (item.quantity > saleItem.quantity) {
        return NextResponse.json({ error: `Return quantity exceeds sale quantity for ${saleItem.product?.name || item.productId}` }, { status: 400 });
      }
      totalAmount += Number(saleItem.unitPrice) * item.quantity;
    }

    const returnCount = await prisma.return.count();
    const returnNumber = `RET-${String(returnCount + 1).padStart(4, "0")}`;

    const created = await prisma.$transaction(async (tx) => {
      const ret = await tx.return.create({
        data: {
          returnNumber,
          saleId,
          userId: authResult.user.id,
          reason,
          totalAmount,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity,
            })),
          },
        },
        include: { sale: { select: { invoiceNumber: true } }, items: { include: { product: { select: { name: true } } } } },
      });

      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: authResult.user.id,
            type: "RETURN",
            quantity: item.quantity,
            reference: returnNumber,
            notes: `Return from ${sale.invoiceNumber}`,
          },
        });
      }

      return ret;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json({ error: "Failed to create return" }, { status: 500 });
  }
}
