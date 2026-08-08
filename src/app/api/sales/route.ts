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
    const where = searchParams.get("status")
      ? { status: searchParams.get("status") as any }
      : {};

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          user: true,
          items: { include: { product: true } },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(sales, total, { page, limit, skip }));
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireRole("ADMIN", "SALES");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { items, paymentMethod, amountPaid, taxRate, customerId } = body;

    if (!items?.length || !paymentMethod || !amountPaid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validMethods = ["CASH", "CARD", "TRANSFER", "MOBILE"];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const rate = Number(taxRate) || 0;
    if (rate < 0 || rate > 100) {
      return NextResponse.json({ error: "Invalid tax rate" }, { status: 400 });
    }

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity,
      0
    );
    const taxAmount = subtotal * (rate / 100);
    const totalAmount = subtotal + taxAmount;
    const paid = Number(amountPaid);
    if (paid < totalAmount) {
      return NextResponse.json({ error: "Insufficient payment" }, { status: 400 });
    }

    const userId = authResult.user.id;

    // Validate stock availability, costPrice, and unitPrice from DB (not client)
    const productIds = items.map((item: any) => item.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (product.stockQuantity < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
      }
      // Validate unitPrice matches DB sellingPrice (prevent price manipulation)
      const dbPrice = Number(product.sellingPrice);
      const clientPrice = Number(item.unitPrice);
      if (Math.abs(dbPrice - clientPrice) > 0.01) {
        return NextResponse.json({ error: `Price mismatch for ${product.name}: expected ${dbPrice}, got ${clientPrice}` }, { status: 400 });
      }
    }

    // Create sale with items and payment in transaction
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          userId,
          customerId: customerId || null,
          subtotal,
          taxRate: rate,
          taxAmount,
          totalAmount,
          paymentMethod,
          amountPaid: paid,
          changeGiven: Math.max(0, paid - totalAmount),
          status: "COMPLETED",
          items: {
            create: items.map((item: any) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: Number(product.sellingPrice),
                costPrice: Number(product.costPrice),
                total: Number(product.sellingPrice) * item.quantity,
              };
            }),
          },
          payments: {
            create: {
              amount: paid,
              method: paymentMethod,
              reference: `PAY-${Date.now().toString(36).toUpperCase()}`,
            },
          },
        },
        include: { items: true },
      });

      // Update stock atomically using decrement
      for (const item of items) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId,
            type: "SALE",
            quantity: item.quantity,
            reference: newSale.invoiceNumber,
            notes: `Sale: ${newSale.invoiceNumber}`,
          },
        });
      }

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Sale error:", error);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
