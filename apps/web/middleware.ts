import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/stream",
  "/classwork",
  "/materials",
  "/chat",
  "/messages",
  "/people",
  "/Meeting",
  "/settings",
  "/dashboard",
  "/private-chat",
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (!isProtectedRoute || request.cookies.has("session")) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/stream/:path*",
    "/classwork/:path*",
    "/materials/:path*",
    "/chat/:path*",
    "/messages/:path*",
    "/people/:path*",
    "/Meeting/:path*",
    "/settings/:path*",
    "/dashboard/:path*",
    "/private-chat/:path*",
  ],
};
