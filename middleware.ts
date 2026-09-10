import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildLoginUrl,
  isAuthPublicApiPath,
  isAuthPublicPath,
} from "@/lib/auth-routes";
import { requestHasSessionCookie } from "@/lib/auth-cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isAuthPublicPath(pathname) || isAuthPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  if (!requestHasSessionCookie(request.cookies.getAll())) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.redirect(buildLoginUrl(pathname, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
