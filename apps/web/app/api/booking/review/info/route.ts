import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const db = createServerSupabaseClient();

  const { data: raw } = await db
    .from("bookings")
    .select("id, status, seeker_id, spot_id, spots ( title, owner_id )")
    .eq("id", bookingId)
    .maybeSingle();

  if (!raw) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  type BRow = {
    id: string;
    status: string;
    seeker_id: string;
    spot_id: string;
    spots: { title: string; owner_id: string } | null;
  };
  const b = raw as unknown as BRow;

  const isSeeker = b.seeker_id === userId;
  const isOwner  = b.spots?.owner_id === userId;

  if (!isSeeker && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (b.status !== "completed") {
    return NextResponse.json({ error: "Can only review completed bookings" }, { status: 400 });
  }

  const review_type = isSeeker ? "seeker_to_owner" : "owner_to_seeker";

  // Check if already reviewed
  const { data: existing } = await db
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("reviewer_id", userId)
    .eq("review_type", review_type)
    .maybeSingle();

  // Fetch other party name
  const otherPartyId = isSeeker ? (b.spots?.owner_id ?? null) : b.seeker_id;
  let otherPartyName = isSeeker ? "Host" : "Guest";
  if (otherPartyId) {
    const { data: u } = await db.from("users").select("full_name").eq("id", otherPartyId).maybeSingle();
    if (u) otherPartyName = (u as { full_name: string }).full_name ?? otherPartyName;
  }

  return NextResponse.json({
    id: b.id,
    status: b.status,
    review_type,
    spotTitle: b.spots?.title ?? "Spot",
    otherPartyName,
    alreadyReviewed: !!existing,
  });
}
