import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  ADMIN: ["/admin", "/dashboard"],
  SALES: ["/sales", "/dashboard"],
  WAREHOUSE: ["/warehouse", "/dashboard"],
  ACCOUNTANT: ["/accountant", "/dashboard"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Allow all API routes (auth handles its own protection)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Check for session cookie for page routes (Auth.js v5 uses "authjs" prefix)
  const sessionCookie = request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token") ||
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
