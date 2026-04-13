import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

type Body = {
  spotId: string;
  vehicleId: string;
  bookingType: "hourly" | "daily" | "monthly";
  startIso: string;
  endIso: string;
};

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body.spotId || !body.vehicleId || !body.startIso || !body.endIso) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const start = new Date(body.startIso);
  const end = new Date(body.endIso);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!supabaseUrl || !serviceRole || !razorpayKeyId || !razorpaySecret) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: user }, { data: spot }, { data: vehicle }] = await Promise.all([
    admin.from("users").select("id,is_banned").eq("id", userId).maybeSingle(),
    admin.from("spots").select("*").eq("id", body.spotId).eq("is_active", true).maybeSingle(),
    admin.from("vehicles").select("*").eq("id", body.vehicleId).eq("user_id", userId).maybeSingle(),
  ]);
  if (!user || user.is_banned) return NextResponse.json({ error: "User cannot book" }, { status: 403 });
  if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const { count: overlap } = await admin
    .from("bookings")
    .select("id", { head: true, count: "exact" })
    .eq("spot_id", body.spotId)
    .in("status", ["pending", "confirmed", "checked_in", "active"])
    .lt("start_time", end.toISOString())
    .gt("end_time", start.toISOString());
  if ((overlap ?? 0) >= Number(spot.total_slots ?? 1)) {
    return NextResponse.json({ error: "No available slots for this time period" }, { status: 400 });
  }

  const hours = Math.max((end.getTime() - start.getTime()) / 3_600_000, 1 / 60);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  let base = 0;
  if (body.bookingType === "hourly") {
    if (spot.price_per_hour == null) return NextResponse.json({ error: "Hourly pricing not available" }, { status: 400 });
    base = Math.round(hours * Number(spot.price_per_hour) * 100) / 100;
  } else if (body.bookingType === "daily") {
    if (spot.price_per_day == null) return NextResponse.json({ error: "Daily pricing not available" }, { status: 400 });
    base = Math.round(days * Number(spot.price_per_day) * 100) / 100;
  } else {
    if (spot.price_per_month == null) return NextResponse.json({ error: "Monthly pricing not available" }, { status: 400 });
    base = Number(spot.price_per_month);
  }
  const serviceFee = Math.max(5, Math.round(base * 0.12 * 100) / 100);
  const total = Math.round((base + serviceFee) * 100) / 100;
  const payout = Math.round(base * 0.9 * 100) / 100;

  const { data: booking, error: bookingErr } = await admin
    .from("bookings")
    .insert({
      seeker_id: userId,
      spot_id: body.spotId,
      vehicle_id: body.vehicleId,
      booking_type: body.bookingType,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      base_price: base,
      service_fee: serviceFee,
      total_price: total,
      owner_payout: payout,
      status: "pending",
      payment_status: "pending",
    })
    .select("id,total_price")
    .single();
  if (bookingErr || !booking) {
    return NextResponse.json({ error: bookingErr?.message ?? "Failed to create booking" }, { status: 400 });
  }

  const amountPaise = Math.round(Number(booking.total_price) * 100);
  const basic = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString("base64");
  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: String(booking.id).replace(/-/g, "").slice(0, 40),
      notes: { booking_id: booking.id },
    }),
  });
  const orderJson = (await orderRes.json()) as { id?: string; error?: { description?: string } };
  if (!orderRes.ok || !orderJson.id) {
    return NextResponse.json({ error: orderJson.error?.description ?? "Failed to create payment order" }, { status: 502 });
  }

  await admin.from("bookings").update({ razorpay_order_id: orderJson.id }).eq("id", booking.id);
  return NextResponse.json({
    bookingId: booking.id,
    amountPaise,
    keyId: razorpayKeyId,
    orderId: orderJson.id,
  });
}

