import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { bookingId?: string; reason?: string };
  try {
    body = (await request.json()) as { bookingId?: string; reason?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { bookingId, reason } = body;
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const db = createServerSupabaseClient();

  // Fetch booking with spot owner info
  const { data: raw } = await db
    .from("bookings")
    .select("id, seeker_id, spot_id, status, start_time, total_price, payment_status, spots ( owner_id )")
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
    start_time: string;
    total_price: number;
    payment_status: string;
    spots: { owner_id: string } | null;
  };
  const b = raw as unknown as BRow;
  const ownerId = b.spots?.owner_id ?? null;

  const isSeeker = b.seeker_id === userId;
  const isOwner  = ownerId === userId;

  if (!isSeeker && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["pending", "confirmed"].includes(b.status)) {
    return NextResponse.json(
      { error: `Booking cannot be cancelled — current status is "${b.status}"` },
      { status: 400 }
    );
  }

  const startTime      = new Date(b.start_time);
  const now            = new Date();
  const minsUntilStart = (startTime.getTime() - now.getTime()) / 60_000;

  // ── Refund policy ─────────────────────────────────────────────────────────
  // Seeker cancels:
  //   >30 min before start  → full refund
  //   ≤30 min before start  → 50% refund
  // Owner cancels: full refund to seeker + penalty strike
  let refundAmount = 0;
  if (isSeeker) {
    refundAmount = minsUntilStart > 30
      ? Number(b.total_price)
      : Number(b.total_price) * 0.5;
  } else {
    refundAmount = Number(b.total_price); // owner always gives full refund
  }

  const newStatus = isSeeker ? "cancelled_by_seeker" : "cancelled_by_owner";
  const cancellationReason =
    reason?.trim() ||
    (isSeeker ? "Cancelled by seeker" : "Cancelled by owner");

  const { error: updateErr } = await db.from("bookings").update({
    status:               newStatus,
    cancelled_at:         now.toISOString(),
    refund_amount:        Number(refundAmount.toFixed(2)),
    cancellation_reason:  cancellationReason,
    payment_status:       b.payment_status === "paid" ? "refunded" : b.payment_status,
  }).eq("id", bookingId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Owner cancellation penalty: increment their strike_count
  if (isOwner && ownerId) {
    const { data: ownerRow } = await db
      .from("users")
      .select("strike_count, is_banned")
      .eq("id", ownerId)
      .single();
    if (ownerRow) {
      const newStrikes = (ownerRow.strike_count ?? 0) + 1;
      await db.from("users").update({
        strike_count: newStrikes,
        is_banned:    newStrikes >= 5 ? true : ownerRow.is_banned,
      }).eq("id", ownerId);
    }
  }

  return NextResponse.json({
    ok: true,
    status:       newStatus,
    refundAmount: Number(refundAmount.toFixed(2)),
    message:      refundAmount > 0
      ? `Booking cancelled. ₹${refundAmount.toFixed(0)} will be refunded.`
      : "Booking cancelled. No refund applicable.",
  });
}
