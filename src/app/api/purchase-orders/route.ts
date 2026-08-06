import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(req: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const where: any = {};
    if (searchParams.get("status")) where.status = searchParams.get("status");
    if (searchParams.get("supplierId")) where.supplierId = searchParams.get("supplierId");

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(orders, total, { page, limit, skip }));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { supplierId, items, expectedDate, notes } = body;

    if (!supplierId || !items?.length) {
      return NextResponse.json({ error: "Supplier and items are required" }, { status: 400 });
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + Number(item.unitCost) * item.quantity,
      0
    );

    const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        totalAmount,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes || null,
        status: "PENDING",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: Number(item.unitCost),
            total: Number(item.unitCost) * item.quantity,
          })),
        },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("PO creation error:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
