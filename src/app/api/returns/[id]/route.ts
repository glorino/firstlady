import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole("ADMIN", "ACCOUNTANT");
  if (authResult.error) return authResult.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be APPROVED or REJECTED" }, { status: 400 });
    }

    const existingReturn = await prisma.return.findUnique({ where: { id } });
    if (!existingReturn) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (existingReturn.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending returns can be approved or rejected" }, { status: 400 });
    }

    const updated = await prisma.return.update({
      where: { id },
      data: { status },
      include: {
        sale: { select: { invoiceNumber: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating return:", error);
    return NextResponse.json({ error: "Failed to update return" }, { status: 500 });
  }
}
