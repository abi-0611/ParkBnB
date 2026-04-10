import 'server-only';

import { redirect } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export type AdminProfile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
};

export async function requireAdmin(): Promise<{ user: { id: string; email?: string }; profile: AdminProfile }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?next=/admin');
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url, role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return { user, profile: profile as AdminProfile };
}
