import { NextRequest, NextResponse } from "next/server";
import { PROTECTED_PATHS, PROTECTED_PREFIXES, TOKEN_KEY } from "@/lib/auth-constants";
import { isAdminAccessToken } from "@/lib/jwt";

function isProtected(pathname: string) {
  if (PROTECTED_PATHS.includes(pathname)) return true;
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(TOKEN_KEY)?.value;
  const authed = token ? isAdminAccessToken(token) : false;

  if (isProtected(pathname) && !authed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login" && authed) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/verifications",
    "/organizers",
    "/payments",
    "/payment-history",
    "/members",
    "/events",
    "/registrations",
    "/analytics",
    "/admins",
    "/categories",
    "/reports/:path*",
    "/profile",
    "/settings",
  ],
};
