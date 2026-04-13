import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { auth } from "@/auth";

type Body = {
  bookingId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body.bookingId || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!supabaseUrl || !serviceRole || !razorpaySecret) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });

  const expected = createHmac("sha256", razorpaySecret)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest("hex");
  if (expected !== body.razorpay_signature) {
    await admin.from("bookings").update({ payment_status: "failed" }).eq("id", body.bookingId).eq("seeker_id", userId);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { data: booking } = await admin
    .from("bookings")
    .select("id,seeker_id,razorpay_order_id")
    .eq("id", body.bookingId)
    .maybeSingle();
  if (!booking || booking.seeker_id !== userId) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.razorpay_order_id && booking.razorpay_order_id !== body.razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  const otp = generateOtp();
  const expires = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const { error } = await admin
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      razorpay_payment_id: body.razorpay_payment_id,
      payment_id: body.razorpay_payment_id,
      gate_otp: otp,
      gate_otp_expires_at: expires,
    })
    .eq("id", body.bookingId)
    .eq("seeker_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

