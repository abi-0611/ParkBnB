/**
 * Mobile auth store — email + password edition
 *
 * Sign-in:  supabase.auth.signInWithPassword({ email, password })
 *           Supabase validates the bcrypt hash; we get back a session.
 *
 * Sign-up:  POST /api/auth/signup (web API, admin createUser, email_confirm=true)
 *           → supabase.auth.signInWithPassword to establish the session.
 *           Registration goes through the web API so we can use the service-role
 *           key (not exposed to the mobile bundle) and skip email confirmation.
 *
 * Supabase client is still used for:
 *   • Session persistence / refresh
 *   • All database queries (spots, bookings, messages, etc.)
 */
import type { User } from '@parknear/shared';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';

/** Base URL of the Next.js web app.
 *  For local dev point this to your LAN IP so the device/emulator can reach it,
 *  e.g. http://192.168.1.x:3000. In production use the deployed URL. */
const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

type AuthState = {
  user:            SupabaseUser | null;
  session:         Session | null;
  profile:         User | null;
  isLoading:       boolean;
  isAuthenticated: boolean;

  /** Sign in with email + password. */
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;

  /** Create account, then sign in automatically.
   *  Registration goes through the web API to use the admin key. */
  signUp: (
    email:    string,
    password: string,
    fullName: string,
    phone:    string,
  ) => Promise<{ error: Error | null }>;

  signOut:         () => Promise<void>;
  refreshSession:  () => Promise<void>;
  fetchProfile:    () => Promise<void>;
  updatePreferredLanguage: (lang: 'en' | 'ta') => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  session:         null,
  profile:         null,
  isLoading:       true,
  isAuthenticated: false,

  // ── Sign in ──────────────────────────────────────────────────────────────
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (error) return { error: error as Error };
    if (!data.session) return { error: new Error('No session returned') };

    set({
      session:         data.session,
      user:            data.user,
      isAuthenticated: true,
      isLoading:       false,
    });
    await get().fetchProfile();
    return { error: null };
  },

  // ── Sign up → sign in ────────────────────────────────────────────────────
  signUp: async (email, password, fullName, phone) => {
    // Step 1: Create the user via web API (uses service-role key, skips email confirmation)
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email,
          password,
          confirmPassword: password,   // we pre-validate on device; this satisfies the schema
          full_name: fullName.trim(),
          phone,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        return { error: new Error(json.error ?? 'Registration failed') };
      }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Network error') };
    }

    // Step 2: Sign in now that the account exists
    return get().signIn(email, password);
  },

  // ── Sign out ──────────────────────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, isAuthenticated: false });
  },

  // ── Refresh from storage (e.g. on app start) ──────────────────────────────
  refreshSession: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session:         data.session,
      user:            data.session?.user ?? null,
      isAuthenticated: !!data.session,
      isLoading:       false,
    });
    if (data.session) await get().fetchProfile();
  },

  // ── Fetch public.users profile ────────────────────────────────────────────
  fetchProfile: async () => {
    const uid = get().user?.id;
    if (!uid) { set({ profile: null }); return; }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error || !data) { set({ profile: null }); return; }
    set({ profile: data as User });
  },

  // ── Preferred language ────────────────────────────────────────────────────
  updatePreferredLanguage: async (lang) => {
    const uid = get().user?.id;
    if (!uid) return;
    await supabase.from('users').update({ preferred_language: lang }).eq('id', uid);
    const profile = get().profile;
    if (profile) set({ profile: { ...profile, preferred_language: lang } });
  },
}));
