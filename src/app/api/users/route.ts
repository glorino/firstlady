import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(req: Request) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const where: any = {};
    if (searchParams.get("role")) where.role = searchParams.get("role");
    if (searchParams.get("isActive") !== null) where.isActive = searchParams.get("isActive") === "true";

    const select = {
      id: true, name: true, email: true, role: true, phone: true,
      isActive: true, lastLogin: true, createdAt: true,
    } as const;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(users, total, { page, limit, skip }));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
