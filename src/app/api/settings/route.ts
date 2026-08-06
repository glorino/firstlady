import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";

const ALLOWED_SETTINGS_KEYS = [
  "storeName", "storeAddress", "storePhone", "storeEmail",
  "taxRate", "currency", "receiptFooter",
  "lowStockThreshold", "sessionTimeout",
];

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  try {
    const settings = await prisma.settings.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return NextResponse.json(settingsMap);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const authResult = await requireRole("ADMIN");
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_SETTINGS_KEYS.includes(key)) continue;

      if (key === "taxRate") {
        const num = Number(value);
        if (isNaN(num) || num < 0 || num > 100) continue;
      }

      await prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ message: "Settings saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
