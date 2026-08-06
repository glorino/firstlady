import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, supplier: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode,
        description: body.description,
        costPrice: body.costPrice,
        sellingPrice: body.sellingPrice,
        stockQuantity: body.stockQuantity || 0,
        minStockLevel: body.minStockLevel || 5,
        maxStockLevel: body.maxStockLevel || 1000,
        unit: body.unit || "pcs",
        categoryId: body.categoryId,
        supplierId: body.supplierId || null,
      },
      include: { category: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
