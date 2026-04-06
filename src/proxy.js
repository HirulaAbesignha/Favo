import { NextResponse } from "next/server";

function decodeTokenRole(token) {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));

    return decoded?.role || null;
  } catch {
    return null;
  }
}

export function proxy(request) {
  const authToken = request.cookies.get("auth-token")?.value;
  const userRole = authToken ? decodeTokenRole(authToken) : null;
  const pathname = request.nextUrl.pathname;

  const protectedPaths = ["/admin", "/products", "/cart", "/api/admin", "/api/cart", "/api/orders"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !authToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (isAdminPath && userRole !== "admin") {
    return NextResponse.redirect(new URL("/products", request.url));
  }

  const authPaths = ["/auth/login", "/auth/register"];
  const isAuthPath = authPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isAuthPath && authToken) {
    return NextResponse.redirect(new URL(userRole === "admin" ? "/admin" : "/products", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/products/:path*",
    "/cart",
    "/api/admin/:path*",
    "/api/cart/:path*",
    "/api/orders/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
