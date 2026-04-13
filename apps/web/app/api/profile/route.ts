import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { profileUpdateSchema } from "@parknear/shared";
import { auth } from "@/auth";

export const runtime = "nodejs";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** PATCH — update own profile fields (phone, full_name, …). */
export async function PATCH(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const patch: Record<string, string | null> = {};
  if (parsed.data.full_name != null) patch.full_name = parsed.data.full_name.trim();
  if (parsed.data.phone !== undefined) {
    const digits = parsed.data.phone.replace(/\D/g, "");
    if (digits === "") patch.phone = null;
    else if (/^[6-9]\d{9}$/.test(digits)) patch.phone = digits;
    else {
      return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number" }, { status: 400 });
    }
  }
  if (parsed.data.avatar_url !== undefined) patch.avatar_url = parsed.data.avatar_url || null;
  if (parsed.data.preferred_language != null) patch.preferred_language = parsed.data.preferred_language;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const db = adminDb();
  const { error } = await db.from("users").update(patch).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
