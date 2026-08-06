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

  // Allow login page and API routes
  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/api/auth/register")) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  // If no session, redirect to login
  if (!sessionCookie) {
    if (pathname === "/" || pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
