import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
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
  try {
    const body = await req.json();

    // Get user - fallback to first user
    let userId = body.userId;
    if (!userId) {
      const user = await prisma.user.findFirst();
      userId = user?.id;
    }

    const expense = await prisma.expense.create({
      data: {
        title: body.title,
        description: body.description,
        amount: body.amount,
        category: body.category,
        userId,
        date: body.date ? new Date(body.date) : new Date(),
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
