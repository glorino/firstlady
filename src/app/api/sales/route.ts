import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: { customer: true, user: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, paymentMethod, amountPaid, taxRate, customerId } = body;

    const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Get authenticated user - fallback to first admin/sales user
    let userId = body.userId;
    if (!userId) {
      const user = await prisma.user.findFirst({ where: { role: "SALES" } });
      userId = user?.id;
    }

    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        userId,
        customerId: customerId || null,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        paymentMethod,
        amountPaid,
        changeGiven: Math.max(0, amountPaid - totalAmount),
        status: "COMPLETED",
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            total: item.unitPrice * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Update stock quantities
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          userId,
          type: "SALE",
          quantity: item.quantity,
          reference: sale.invoiceNumber,
          notes: `Sale: ${sale.invoiceNumber}`,
        },
      });
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Sale error:", error);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
