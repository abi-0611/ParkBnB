/**
 * Server-side Supabase client (service role).
 *
 * Auth.js now owns the web session. Supabase is used as a pure database.
 * The service-role key bypasses RLS so server components can read any row
 * they need; route-level security is enforced by Auth.js middleware and
 * the `requireAdmin()` helper.
 *
 * NEVER import this in client components — the service-role key must never
 * reach the browser.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
