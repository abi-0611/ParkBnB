import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import { auth } from "@/auth";

export type AdminProfile = {
  id:         string;
  full_name:  string;
  email:      string;
  avatar_url: string | null;
  role:       string;
};

/**
 * Server-side admin guard.
 *
 * Reads the Auth.js JWT session — no extra round-trip to Supabase for auth.
 * Fetches the full profile row via the service-role client for display data.
 *
 * Redirects to /login if not authenticated, to /dashboard if not admin.
 */
export async function requireAdmin(): Promise<{
  user: { id: string; email?: string | null };
  profile: AdminProfile;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?next=/admin");
  }

  // Role is embedded in the JWT — no DB query needed for the gate check
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch full profile for display (name, avatar, etc.)
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile, error } = await db
    .from("users")
    .select("id, full_name, email, avatar_url, role")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    redirect("/dashboard");
  }

  return {
    user:    { id: session.user.id, email: session.user.email },
    profile: profile as AdminProfile,
  };
}
