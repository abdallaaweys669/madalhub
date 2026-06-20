import { NextRequest, NextResponse } from "next/server";
import { PROTECTED_PATHS, TOKEN_KEY } from "@/lib/auth-constants";
import { isAdminAccessToken } from "@/lib/jwt";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(TOKEN_KEY)?.value;
  const authed = token ? isAdminAccessToken(token) : false;

  if (PROTECTED_PATHS.includes(pathname) && !authed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname === "/login" && authed) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/organizers", "/payments"],
};
