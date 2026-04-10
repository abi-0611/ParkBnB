import Link from 'next/link';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function WebBookingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="p-8">
        <Link href="/login" className="text-sky-400">
          Log in
        </Link>
      </div>
    );
  }

  const { data: rows } = await supabase
    .from('bookings')
    .select(
      `
      id,
      status,
      start_time,
      total_price,
      spots ( title, photos )
    `
    )
    .eq('seeker_id', user.id)
    .order('start_time', { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-100">My bookings</h1>
      <ul className="mt-6 space-y-3">
        {(rows as unknown as { id: string; status: string; start_time: string; total_price: number; spots: { title: string } | null }[]).map((r) => (
          <li key={r.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="font-semibold text-slate-100">{r.spots?.title ?? 'Spot'}</p>
            <p className="text-sm text-slate-400">
              {r.status} · {new Date(r.start_time).toLocaleString()} · ₹{Number(r.total_price).toFixed(0)}
            </p>
            <Link href={`/booking/confirmation/${r.id}`} className="mt-2 inline-block text-sm text-sky-400">
              Details
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
