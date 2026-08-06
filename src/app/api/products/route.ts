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
    if (searchParams.get("categoryId")) where.categoryId = searchParams.get("categoryId");
    if (searchParams.get("isActive") !== null) where.isActive = searchParams.get("isActive") === "true";

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, supplier: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(products, total, { page, limit, skip }));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { name, sku, costPrice, sellingPrice, categoryId } = body;

    if (!name || !sku || !costPrice || !sellingPrice || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (Number(costPrice) < 0 || Number(sellingPrice) < 0) {
      return NextResponse.json({ error: "Prices cannot be negative" }, { status: 400 });
    }

    // Whitelist allowed fields
    const product = await prisma.product.create({
      data: {
        name: String(name),
        sku: String(sku),
        barcode: body.barcode ? String(body.barcode) : null,
        description: body.description ? String(body.description) : null,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(body.stockQuantity) || 0,
        minStockLevel: Number(body.minStockLevel) || 5,
        maxStockLevel: Number(body.maxStockLevel) || 1000,
        unit: body.unit ? String(body.unit) : "pcs",
        categoryId: String(categoryId),
        supplierId: body.supplierId ? String(body.supplierId) : null,
      },
      include: { category: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
