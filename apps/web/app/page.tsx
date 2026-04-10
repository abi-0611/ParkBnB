import Link from 'next/link';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Home() {
  let spotCount: number | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { count, error } = await supabase.from('spots_public').select('*', { count: 'exact', head: true });
    if (!error) spotCount = count;
  } catch {
    spotCount = null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-sky-400">Chennai</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">ParkNear — Your parking spot, a tap away</h1>
        <p className="mt-6 max-w-xl text-lg text-slate-400">
          Find and book verified parking near you. Owners list spare slots; seekers pay safely and unlock exact location
          after booking.
        </p>
        <p className="mt-8 text-sm text-slate-500">
          {spotCount !== null ? (
            <>
              <span className="font-semibold text-emerald-400">{spotCount}</span> spots available in Chennai
            </>
          ) : (
            'Connect Supabase to show live spot counts.'
          )}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/search"
            className="rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            Find parking
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:bg-sky-400"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-600 px-8 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
