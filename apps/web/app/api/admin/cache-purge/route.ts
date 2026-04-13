/**
 * POST /api/admin/cache-purge
 * Purges all admin dashboard cache keys.
 * Call after any admin mutation (approve KYC, close dispute, etc.)
 *
 * Secured by checking the admin role via Auth.js session (JWT-embedded role).
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cacheDel, CacheKeys } from "@/lib/redis";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await cacheDel(
      CacheKeys.adminKpis(),
      CacheKeys.adminBookings30(),
      CacheKeys.adminRevenue30(),
      CacheKeys.adminAreas(8),
      CacheKeys.adminGrowth90(),
      CacheKeys.homeSpotCount(),
    );

    return NextResponse.json({ ok: true, purged: "admin+home" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
