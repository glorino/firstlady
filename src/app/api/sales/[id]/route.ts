import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { customer: true, user: true, items: { include: { product: true } } },
    });
    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sale" }, { status: 500 });
  }
}
