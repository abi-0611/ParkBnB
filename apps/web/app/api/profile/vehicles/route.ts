import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { vehicleSchema } from "@parknear/shared";
import { auth } from "@/auth";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("vehicles")
    .select("id, vehicle_type, number_plate, is_default, created_at")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ vehicles: data ?? [] });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = (await req.json()) as {
    vehicle_type?: string;
    number_plate?: string;
    is_default?: boolean;
  };

  const normalizedPlate = String(payload.number_plate ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
  const parsed = vehicleSchema.safeParse({
    vehicle_type: payload.vehicle_type,
    number_plate: normalizedPlate,
    is_default: Boolean(payload.is_default),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid vehicle payload" },
      { status: 400 }
    );
  }

  const admin = getAdminClient();
  const { count } = await admin
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "You can add up to 5 vehicles." }, { status: 400 });
  }

  const shouldDefault = parsed.data.is_default || (count ?? 0) === 0;
  if (shouldDefault) {
    await admin.from("vehicles").update({ is_default: false }).eq("user_id", userId);
  }

  const { data, error } = await admin
    .from("vehicles")
    .insert({
      user_id: userId,
      vehicle_type: parsed.data.vehicle_type,
      number_plate: parsed.data.number_plate,
      is_default: shouldDefault,
    })
    .select("id, vehicle_type, number_plate, is_default, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ vehicle: data });
}

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { vehicleId?: string };
  if (!body.vehicleId) return NextResponse.json({ error: "vehicleId is required" }, { status: 400 });

  const admin = getAdminClient();
  await admin.from("vehicles").update({ is_default: false }).eq("user_id", userId);
  const { error } = await admin
    .from("vehicles")
    .update({ is_default: true })
    .eq("id", body.vehicleId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const vehicleId = url.searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ error: "vehicleId is required" }, { status: 400 });

  const admin = getAdminClient();
  const { data: target, error: fetchErr } = await admin
    .from("vehicles")
    .select("id, is_default")
    .eq("id", vehicleId)
    .eq("user_id", userId)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });
  if (!target) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const { error } = await admin.from("vehicles").delete().eq("id", vehicleId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (target.is_default) {
    const { data: fallback } = await admin
      .from("vehicles")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fallback?.id) {
      await admin.from("vehicles").update({ is_default: true }).eq("id", fallback.id).eq("user_id", userId);
    }
  }

  return NextResponse.json({ ok: true });
}
