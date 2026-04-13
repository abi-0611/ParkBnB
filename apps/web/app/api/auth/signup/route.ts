/**
 * POST /api/auth/signup
 *
 * Creates a new user account.
 * Uses the Supabase admin API so email confirmation is bypassed — the user
 * can sign in immediately after registration.
 *
 * The DB trigger on auth.users automatically inserts a row in public.users.
 *
 * Called by:
 *   • Web LoginForm (sign-up mode) before calling signIn("email-password")
 *   • Mobile app before calling supabase.auth.signInWithPassword()
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { signUpSchema } from "@parknear/shared";

export const runtime = "nodejs";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate — confirmPassword is checked by the schema refine()
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, password, full_name, phone } = parsed.data;
  const db = adminDb();

  // Guard: reject if email already exists
  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // Create the Supabase auth user (email_confirm: true = no confirmation email)
  const { data, error } = await db.auth.admin.createUser({
    email:         email.toLowerCase().trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  });

  if (error) {
    // Surface Supabase's own error message (e.g. "Password should be at least 6 characters")
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  // Backfill full_name / phone in case the DB trigger didn't capture metadata
  if (data?.user?.id) {
    await db
      .from("users")
      .update({
        full_name: full_name.trim(),
        phone,
      })
      .eq("id", data.user.id);
  }

  return NextResponse.json({ ok: true });
}
