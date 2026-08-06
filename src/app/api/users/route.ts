import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        isActive: true, lastLogin: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
