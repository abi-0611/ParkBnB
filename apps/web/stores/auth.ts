'use client';

import type { User } from '@parknear/shared';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { createClient } from '@/lib/supabase/client';

type AuthState = {
  user: SupabaseUser | null;
  session: Session | null;
  profile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithOtp: (email: string, fullName?: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  fetchProfile: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  signInWithOtp: async (email, fullName) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });
    return { error: error as Error | null };
  },

  verifyOtp: async (email, token) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) return { error: error as Error };

    set({
      session: data.session,
      user: data.user,
      isAuthenticated: !!data.session,
    });
    await get().fetchProfile();
    return { error: null };
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, isAuthenticated: false });
  },

  refreshSession: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      isAuthenticated: !!data.session,
    });
    if (data.session) await get().fetchProfile();
  },

  fetchProfile: async () => {
    const supabase = createClient();
    const uid = get().user?.id;
    if (!uid) {
      set({ profile: null });
      return;
    }
    const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
    if (error || !data) {
      set({ profile: null });
      return;
    }
    set({ profile: data as User });
  },
}));
