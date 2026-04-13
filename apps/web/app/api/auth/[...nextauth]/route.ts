/**
 * Auth.js v5 catch-all route handler.
 * Handles: /api/auth/signin, /api/auth/callback/*, /api/auth/signout,
 *          /api/auth/session, /api/auth/csrf, /api/auth/providers
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
