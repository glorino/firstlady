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

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { sales: true } } },
        skip,
        take: limit,
      }),
      prisma.customer.count(),
    ]);

    return NextResponse.json(paginatedResponse(customers, total, { page, limit, skip }));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireRole("ADMIN", "SALES");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
