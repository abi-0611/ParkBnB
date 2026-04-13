import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/auth";

type Body = { spotId?: string; isActive?: boolean };

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body.spotId || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: existing } = await admin
    .from("spots")
    .select("id, owner_id")
    .eq("id", body.spotId)
    .maybeSingle();
  if (!existing || existing.owner_id !== userId) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { error } = await admin
    .from("spots")
    .update({ is_active: body.isActive })
    .eq("id", body.spotId)
    .eq("owner_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

