import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(req: Request) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const params = parsePagination(searchParams);
    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({ skip: params.skip, take: params.limit, orderBy: { createdAt: "desc" } }),
      prisma.discount.count(),
    ]);
    return NextResponse.json(paginatedResponse(discounts, total, params));
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { code, description, type, value, minPurchase, maxUses, startDate, endDate } = body;

    if (!code || !type || !value) {
      return NextResponse.json({ error: "Code, type, and value are required" }, { status: 400 });
    }

    const existing = await prisma.discount.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return NextResponse.json({ error: "Discount code already exists" }, { status: 400 });

    const discount = await prisma.discount.create({
      data: {
        code: code.toUpperCase(),
        description,
        type,
        value,
        minPurchase: minPurchase || null,
        maxUses: maxUses || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
  }
}
