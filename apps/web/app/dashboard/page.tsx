import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/SignOutButton';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('full_name, email, role').eq('id', user.id).single();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-6 py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold text-sky-400">Dashboard</h1>
        <p className="mt-4 text-slate-300">
          Signed in as <span className="font-medium text-white">{profile?.full_name ?? user.email}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        <p className="mt-2 text-sm text-slate-400">Role: {profile?.role ?? '—'}</p>
        <div className="mt-8">
          <SignOutButton />
        </div>
        <p className="mt-8 text-sm">
          <Link href="/" className="text-sky-400 hover:underline">
            ← Home
          </Link>
        </p>
      </div>
    </main>
  );
}
