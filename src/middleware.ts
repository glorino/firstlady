import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  ADMIN: ["/admin", "/dashboard", "/warehouse", "/sales", "/accountant"],
  SALES: ["/sales", "/dashboard"],
  WAREHOUSE: ["/warehouse", "/dashboard"],
  ACCOUNTANT: ["/accountant", "/dashboard", "/sales/history"],
};

function decodeRoleFromJwt(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role || payload.user?.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();

  const sessionCookie =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token") ||
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = decodeRoleFromJwt(sessionCookie.value);

  if (role) {
    const allowedPrefixes = ROLE_ROUTES[role] || ["/dashboard"];
    const isAllowed = allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
