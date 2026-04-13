/**
 * Auth store — Auth.js v5 edition
 *
 * Replaces the Supabase Zustand store.
 * All session state now comes from Auth.js via `useSession()`.
 * This module provides a thin, typed wrapper so existing components
 * that imported `useAuthStore` can migrate with minimal changes.
 *
 * Usage:
 *   const { user, isAuthenticated, isLoading } = useAuthStore();
 *   const { signOut } = useAuthActions();
 */
"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import type { Session } from "next-auth";

// ─── Derived session shape ────────────────────────────────────────────────────

export type AuthUser = {
  id:         string;
  email:      string | null | undefined;
  name:       string | null | undefined;
  image:      string | null | undefined;
  role:       string;
  kycStatus:  string;
  isBanned:   boolean;
};

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session?.user?.id) return null;
  const u = session.user as Session["user"] & {
    role?: string; kycStatus?: string; isBanned?: boolean;
  };
  return {
    id:        u.id,
    email:     u.email,
    name:      u.name,
    image:     u.image,
    role:      u.role      ?? "seeker",
    kycStatus: u.kycStatus ?? "not_submitted",
    isBanned:  u.isBanned  ?? false,
  };
}

// ─── Primary hook ────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for the old `useAuthStore`.
 * Returns session state from Auth.js.
 */
export function useAuthStore() {
  const { data: session, status, update } = useSession();
  const user = toAuthUser(session);

  return {
    user,
    profile:         user,                 // alias — legacy components used "profile"
    isLoading:       status === "loading",
    isAuthenticated: status === "authenticated" && !!user,
    session,
    /** Force-refresh the JWT (e.g. after KYC approval). */
    refreshSession:  update,
  };
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

/**
 * Thin wrappers around Auth.js actions for use in client components.
 */
export function useAuthActions() {
  return {
    signOut: () => nextAuthSignOut({ redirectTo: "/" }),
  };
}
