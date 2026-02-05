import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_COOKIE_NAME, type UserRole } from "@/lib/auth/roles";

const isAdminRoute = (pathname: string) => pathname.startsWith("/admin");
const isRiderRoute = (pathname: string) => pathname.startsWith("/rider");

function getRole(request: NextRequest) {
  return request.cookies.get(ROLE_COOKIE_NAME)?.value as UserRole | undefined;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getRole(request);

  if (isAdminRoute(pathname)) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  if (isRiderRoute(pathname)) {
    if (role !== "rider" && role !== "admin") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/rider/:path*"],
};
