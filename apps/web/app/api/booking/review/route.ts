import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_TAGS = [
  "clean", "safe", "easy_access", "good_lighting", "spacious",
  "helpful_host", "accurate_description", "great_value",
  "late", "dirty", "hard_to_find", "unreliable",
];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: {
    bookingId?: string;
    rating?: number;
    comment?: string;
    tags?: string[];
    review_type?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bookingId, rating, comment, tags, review_type } = body;

  if (!bookingId || !rating || !review_type) {
    return NextResponse.json({ error: "bookingId, rating, and review_type are required" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be an integer 1–5" }, { status: 400 });
  }
  if (!["seeker_to_owner", "owner_to_seeker"].includes(review_type)) {
    return NextResponse.json({ error: "Invalid review_type" }, { status: 400 });
  }
  const safeTags = (tags ?? []).filter((t) => ALLOWED_TAGS.includes(t));

  const db = createServerSupabaseClient();

  // Fetch booking
  const { data: raw } = await db
    .from("bookings")
    .select("id, seeker_id, spot_id, status, spots ( owner_id )")
    .eq("id", bookingId)
    .maybeSingle();

  if (!raw) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  type BRow = {
    id: string;
    seeker_id: string;
    spot_id: string;
    status: string;
    spots: { owner_id: string } | null;
  };
  const b = raw as unknown as BRow;

  if (b.status !== "completed") {
    return NextResponse.json(
      { error: "Reviews can only be submitted for completed bookings" },
      { status: 400 }
    );
  }

  const ownerId = b.spots?.owner_id ?? null;

  // Auth check per review type
  if (review_type === "seeker_to_owner" && b.seeker_id !== userId) {
    return NextResponse.json({ error: "Only the seeker can submit this review" }, { status: 403 });
  }
  if (review_type === "owner_to_seeker" && ownerId !== userId) {
    return NextResponse.json({ error: "Only the owner can submit this review" }, { status: 403 });
  }

  // Check for duplicate
  const { data: existing } = await db
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("reviewer_id", userId)
    .eq("review_type", review_type)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this booking" }, { status: 409 });
  }

  const revieweeId = review_type === "seeker_to_owner" ? ownerId : b.seeker_id;
  if (!revieweeId) {
    return NextResponse.json({ error: "Could not determine reviewee" }, { status: 500 });
  }

  const { error: insertErr } = await db.from("reviews").insert({
    booking_id:  bookingId,
    reviewer_id: userId,
    reviewee_id: revieweeId,
    spot_id:     b.spot_id,
    rating,
    comment:     comment?.trim() || null,
    tags:        safeTags,
    review_type,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
