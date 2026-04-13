import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

export async function GET(_: Request, { params }: { params: { spotId: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const [{ data: spot, error: spotErr }, { data: vehicles, error: vehErr }] = await Promise.all([
    admin.rpc("get_spot_seeker_detail", { p_spot_id: params.spotId }),
    admin.from("vehicles").select("id, number_plate").eq("user_id", userId),
  ]);
  if (spotErr || !spot) return NextResponse.json({ error: spotErr?.message ?? "Spot not found" }, { status: 404 });
  if (vehErr) return NextResponse.json({ error: vehErr.message }, { status: 400 });

  return NextResponse.json({ spot, vehicles: vehicles ?? [] });
}

