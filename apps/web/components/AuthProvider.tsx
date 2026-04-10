'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth';
import { useEffect } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      useAuthStore.setState({
        session: data.session,
        user: data.session?.user ?? null,
        isAuthenticated: !!data.session,
        isLoading: false,
      });
      if (data.session?.user) {
        await useAuthStore.getState().fetchProfile();
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.setState({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      });
      if (session?.user) void useAuthStore.getState().fetchProfile();
      else useAuthStore.setState({ profile: null });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return children;
}
