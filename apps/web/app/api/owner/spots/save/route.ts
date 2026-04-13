import { NextResponse } from "next/server";
import { spotSchema } from "@parknear/shared";
import { createClient } from "@supabase/supabase-js";

import { auth } from "@/auth";

type Body = {
  mode: "create" | "edit";
  spotId?: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  activeDays: number[];
  availableAllDay: boolean;
  spot: unknown;
};

function toTimeSql(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  const parsed = spotSchema.safeParse(body.spot);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid spot payload" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(body.latitude) || !Number.isFinite(body.longitude)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server storage is not configured" }, { status: 500 });
  }
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const spot = parsed.data;
  const locationWkt = `SRID=4326;POINT(${body.longitude} ${body.latitude})`;

  const { data: me } = await admin.from("users").select("kyc_status").eq("id", userId).maybeSingle();
  if (!me || String(me.kyc_status ?? "") !== "verified") {
    return NextResponse.json(
      { error: "Your KYC must be approved by admin before listing a spot." },
      { status: 403 }
    );
  }

  let spotId = body.spotId;
  if (body.mode === "create") {
    const { data, error } = await admin
      .from("spots")
      .insert({
        owner_id: userId,
        title: spot.title.trim(),
        description: spot.description?.toString().trim() || null,
        spot_type: spot.spot_type,
        coverage: spot.coverage,
        vehicle_size: spot.vehicle_size,
        total_slots: spot.total_slots,
        location: locationWkt,
        address_line: spot.address_line.trim(),
        landmark: spot.landmark?.toString().trim() || null,
        city: "Chennai",
        pincode: spot.pincode?.toString().trim() || null,
        fuzzy_landmark: spot.fuzzy_landmark.trim(),
        fuzzy_radius_meters: spot.fuzzy_radius_meters,
        price_per_hour: spot.price_per_hour ?? null,
        price_per_day: spot.price_per_day ?? null,
        price_per_month: spot.price_per_month ?? null,
        is_instant_book: spot.is_instant_book,
        is_active: true,
        amenities: spot.amenities,
        photos: spot.photos,
        video_url: spot.video_url?.toString().trim() || null,
      })
      .select("id")
      .single();
    if (error || !data?.id) {
      return NextResponse.json({ error: error?.message ?? "Failed to create spot" }, { status: 400 });
    }
    spotId = data.id;
  } else {
    if (!spotId) return NextResponse.json({ error: "Missing spot id" }, { status: 400 });
    const { data: existing } = await admin
      .from("spots")
      .select("id, owner_id")
      .eq("id", spotId)
      .maybeSingle();
    if (!existing || existing.owner_id !== userId) {
      return NextResponse.json({ error: "Not allowed to edit this spot" }, { status: 403 });
    }

    const { error } = await admin
      .from("spots")
      .update({
        title: spot.title.trim(),
        description: spot.description?.toString().trim() || null,
        spot_type: spot.spot_type,
        coverage: spot.coverage,
        vehicle_size: spot.vehicle_size,
        total_slots: spot.total_slots,
        location: locationWkt,
        address_line: spot.address_line.trim(),
        landmark: spot.landmark?.toString().trim() || null,
        pincode: spot.pincode?.toString().trim() || null,
        fuzzy_landmark: spot.fuzzy_landmark.trim(),
        fuzzy_radius_meters: spot.fuzzy_radius_meters,
        price_per_hour: spot.price_per_hour ?? null,
        price_per_day: spot.price_per_day ?? null,
        price_per_month: spot.price_per_month ?? null,
        is_instant_book: spot.is_instant_book,
        is_active: true,
        amenities: spot.amenities,
        photos: spot.photos,
        video_url: spot.video_url?.toString().trim() || null,
      })
      .eq("id", spotId)
      .eq("owner_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const days = body.availableAllDay ? [0, 1, 2, 3, 4, 5, 6] : body.activeDays;
  const start = body.availableAllDay ? "00:00:00" : toTimeSql(body.startTime);
  const end = body.availableAllDay ? "23:59:59" : toTimeSql(body.endTime);

  const { error: delError } = await admin.from("availability").delete().eq("spot_id", spotId!);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 400 });

  const rows = days.map((day_of_week) => ({
    spot_id: spotId!,
    day_of_week,
    start_time: start,
    end_time: end,
    is_recurring: true,
    specific_date: null as string | null,
  }));
  const { error: avError } = await admin.from("availability").insert(rows);
  if (avError) return NextResponse.json({ error: avError.message }, { status: 400 });

  return NextResponse.json({ id: spotId });
}

