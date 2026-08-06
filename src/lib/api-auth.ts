import { auth } from "./auth";
import { NextResponse } from "next/server";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
};

export async function requireAuth(): Promise<
  { user: SessionUser; error?: never } | { user?: never; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user: session.user as SessionUser };
}

export async function requireRole(
  ...roles: string[]
): Promise<
  { user: SessionUser; error?: never } | { user?: never; error: NextResponse }
> {
  const result = await requireAuth();
  if (result.error) return result;
  if (!roles.includes(result.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}
