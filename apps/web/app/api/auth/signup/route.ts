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
import { signUpSchema } from "@parknear/shared";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

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

  try {
    let db;
    try {
      db = createServiceRoleClient();
    } catch {
      console.error(
        "[signup] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — add both in Vercel → Settings → Environment Variables, then redeploy."
      );
      return NextResponse.json(
        { error: "Sign-up is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Guard: reject if email already exists
    const { data: existing, error: existingErr } = await db
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingErr) {
      console.error("[signup] users lookup:", existingErr.message);
      return NextResponse.json(
        { error: "Could not verify email. Please try again." },
        { status: 503 }
      );
    }

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
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    // Backfill full_name / phone in case the DB trigger didn't capture metadata
    if (data?.user?.id) {
      const { error: upErr } = await db
        .from("users")
        .update({
          full_name: full_name.trim(),
          phone,
        })
        .eq("id", data.user.id);

      if (upErr) {
        console.error("[signup] profile backfill:", upErr.message);
        // Auth user exists; client can still sign in — don't fail the whole request
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again later." },
      { status: 500 }
    );
  }
}
