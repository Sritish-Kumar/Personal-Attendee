import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isEmailAllowed } from "@/lib/auth/access";

const PUBLIC_ROUTES = ["/login"];
const PROTECTED_PREFIXES = ["/dashboard", "/calendar", "/simulator", "/settings", "/mark"];

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isAuthenticated = Boolean(req.auth);
  const isAllowedUser = isEmailAllowed(req.auth?.user?.email);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isAuthenticated && !isAllowedUser && isProtectedRoute) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(loginUrl);
  }

  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", nextUrl.origin);
    const callbackUrl = `${pathname}${nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAllowedUser && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/simulator/:path*",
    "/settings/:path*",
    "/mark/:path*",
    "/login"
  ]
};
