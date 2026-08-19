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
    const where = searchParams.get("active") === "true" ? { isActive: true } : {};

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { name: "asc" },
      }),
      prisma.warehouse.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(warehouses, total, params));
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authResult = await requireRole("ADMIN", "WAREHOUSE");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: body.name,
        address: body.address || null,
        phone: body.phone || null,
      },
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Warehouse name already exists" }, { status: 400 });
    }
    console.error("Error creating warehouse:", error);
    return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 });
  }
}
