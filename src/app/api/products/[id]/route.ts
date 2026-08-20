import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await req.json();

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields: Record<string, any> = {};
    const allowed = ["name", "sku", "barcode", "description", "costPrice", "sellingPrice", "stockQuantity", "minStockLevel", "maxStockLevel", "unit", "categoryId", "supplierId", "isActive", "image"];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        allowedFields[key] = typeof body[key] === "string" && ["costPrice", "sellingPrice", "stockQuantity", "minStockLevel", "maxStockLevel"].includes(key)
          ? Number(body[key])
          : body[key];
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: allowedFields,
      include: { category: true },
    });
    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Failed to update product:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id }, select: { stockQuantity: true, name: true } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    if (product.stockQuantity > 0) {
      return NextResponse.json({ error: `Cannot delete "${product.name}" — it has ${product.stockQuantity} units in stock. Set stock to 0 first or deactivate it instead.` }, { status: 400 });
    }

    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ message: "Product deactivated" });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    if (error?.code === "P2025") return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
