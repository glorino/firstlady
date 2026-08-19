import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const movementCount = await prisma.stockMovement.count({
      where: { OR: [{ fromWarehouseId: id }, { toWarehouseId: id }] },
    });
    if (movementCount > 0) {
      return NextResponse.json({ error: "Cannot delete warehouse with stock movements" }, { status: 400 });
    }

    await prisma.warehouse.delete({ where: { id } });
    return NextResponse.json({ message: "Warehouse deleted" });
  } catch (error) {
    console.error("Failed to delete warehouse:", error);
    return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 });
  }
}
