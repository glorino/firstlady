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
    const where = searchParams.get("status") ? { status: searchParams.get("status") as any } : {};
    const [registers, total] = await Promise.all([
      prisma.cashRegister.findMany({
        where,
        skip: params.skip, take: params.limit,
        include: { user: { select: { name: true } } },
        orderBy: { openedAt: "desc" },
      }),
      prisma.cashRegister.count({ where }),
    ]);
    return NextResponse.json(paginatedResponse(registers, total, params));
  } catch (error) {
    console.error("Error fetching cash registers:", error);
    return NextResponse.json({ error: "Failed to fetch cash registers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { action, closingBalance } = body;

    if (action === "open") {
      const openRegister = await prisma.cashRegister.findFirst({ where: { userId: authResult.user.id, status: "OPEN" } });
      if (openRegister) return NextResponse.json({ error: "You already have an open register" }, { status: 400 });

      const register = await prisma.cashRegister.create({
        data: { userId: authResult.user.id, openingBalance: body.openingBalance || 0 },
      });
      return NextResponse.json(register, { status: 201 });
    }

    if (action === "close") {
      const openRegister = await prisma.cashRegister.findFirst({ where: { userId: authResult.user.id, status: "OPEN" } });
      if (!openRegister) return NextResponse.json({ error: "No open register found" }, { status: 400 });

      const [sales, returns, expenses] = await Promise.all([
        prisma.sale.aggregate({ where: { userId: authResult.user.id, status: "COMPLETED", createdAt: { gte: openRegister.openedAt } }, _sum: { totalAmount: true } }),
        prisma.return.aggregate({ where: { userId: authResult.user.id, createdAt: { gte: openRegister.openedAt } }, _sum: { totalAmount: true } }),
        prisma.expense.aggregate({ where: { userId: authResult.user.id, status: "APPROVED", createdAt: { gte: openRegister.openedAt } }, _sum: { amount: true } }),
      ]);

      const updated = await prisma.cashRegister.update({
        where: { id: openRegister.id },
        data: {
          closingBalance: closingBalance || 0,
          totalSales: Number(sales._sum.totalAmount || 0),
          totalReturns: Number(returns._sum.totalAmount || 0),
          totalExpenses: Number(expenses._sum.amount || 0),
          status: "CLOSED",
          closedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error with cash register:", error);
    return NextResponse.json({ error: "Failed to process cash register" }, { status: 500 });
  }
}
