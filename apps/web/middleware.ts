/**
 * Auth.js v5 middleware
 *
 * Replaces the previous Supabase-SSR middleware.
 * Auth.js automatically handles:
 *  - JWT cookie verification on every request
 *  - CSRF token validation for mutation endpoints
 *  - Session refresh (updateAge defined in auth.ts)
 *
 * This middleware just reads the already-verified session and applies
 * route-level access control — no extra DB queries.
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/spots",
  "/booking",
  "/bookings",
  "/kyc",
  "/admin",
];

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // ── Not authenticated → send to /login ──────────────────────────────────
  if (isProtected && !session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ── Banned user → block immediately ─────────────────────────────────────
  if (session?.user?.isBanned) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search   = "?error=banned";
    return NextResponse.redirect(url);
  }

  // ── Admin routes: require role === "admin" ───────────────────────────────
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute && session?.user?.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search   = "";
    return NextResponse.redirect(url);
  }

  // ── Already signed in → skip login page ─────────────────────────────────
  if (pathname.startsWith("/login") && session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search   = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/spots/:path*",
    "/booking/:path*",
    "/bookings",
    "/bookings/:path*",
    "/kyc",
    "/kyc/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
  ],
};
