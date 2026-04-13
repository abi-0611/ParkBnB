import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: spot, error } = await admin
    .from("spots")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error || !spot) {
    return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  }

  const { data: availability } = await admin
    .from("availability")
    .select("day_of_week,start_time,end_time,is_recurring")
    .eq("spot_id", params.id)
    .eq("is_recurring", true)
    .order("day_of_week", { ascending: true });

  return NextResponse.json({ spot, availability: availability ?? [] });
}

