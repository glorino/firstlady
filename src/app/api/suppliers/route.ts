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

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.supplier.count(),
    ]);

    return NextResponse.json(paginatedResponse(suppliers, total, { page, limit, skip }));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
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
    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
