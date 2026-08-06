import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  ADMIN: ["/admin", "/dashboard"],
  SALES: ["/sales", "/dashboard"],
  WAREHOUSE: ["/warehouse", "/dashboard"],
  ACCOUNTANT: ["/accountant", "/dashboard"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user?.role as string;
  const allowedRoutes = ROLE_ROUTES[role] || [];

  const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!isAllowed && pathname !== "/dashboard" && pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
