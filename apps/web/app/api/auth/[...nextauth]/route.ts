/**
 * Auth.js v5 catch-all route handler.
 * Handles: /api/auth/signin, /api/auth/callback/*, /api/auth/signout,
 *          /api/auth/session, /api/auth/csrf, /api/auth/providers
 */
import { handlers } from "@/auth";

/** Node runtime: ensures all server env vars (AUTH_SECRET, Supabase keys) are available on Vercel. */
export const runtime = "nodejs";

export const { GET, POST } = handlers;
