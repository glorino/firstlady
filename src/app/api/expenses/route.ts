import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(req: Request) {
  const authResult = await requireRole("ADMIN", "ACCOUNTANT");
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const where: any = {};
    if (searchParams.get("category")) where.category = searchParams.get("category");
    if (searchParams.get("status")) where.status = searchParams.get("status");

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { user: true },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(expenses, total, { page, limit, skip }));
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireRole("ADMIN", "ACCOUNTANT");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { title, amount, category } = body;

    if (!title || !amount || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        title: body.title,
        description: body.description || null,
        amount: Number(body.amount),
        category: body.category,
        userId: authResult.user.id,
        date: body.date ? new Date(body.date) : new Date(),
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
