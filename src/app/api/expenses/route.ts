import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireRole("ADMIN", "ACCOUNTANT");
  if (authResult.error) return authResult.error;

  try {
    const expenses = await prisma.expense.findMany({
      include: { user: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
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
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
