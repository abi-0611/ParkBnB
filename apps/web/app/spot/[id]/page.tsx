import Link from 'next/link';

import { createServerSupabaseClient } from '@/lib/supabase/server';

type PageProps = { params: { id: string } };

export default async function PublicSpotPage({ params }: PageProps) {
  const { id } = params;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('get_spot_seeker_detail', { p_spot_id: id });

  if (error || !data || typeof data !== 'object') {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-center text-slate-200">
        <p>Spot not found.</p>
        <Link href="/search" className="mt-4 inline-block text-sky-400 hover:underline">
          Back to search
        </Link>
      </main>
    );
  }

  const o = data as Record<string, unknown>;
  const photos = Array.isArray(o.photos) ? (o.photos as string[]) : [];
  const reviews = Array.isArray(o.reviews) ? (o.reviews as Record<string, unknown>[]) : [];
  const hero = photos[0];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-2xl">
        <Link href="/search" className="text-sm text-sky-400 hover:underline">
          ← Search
        </Link>
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="mt-6 h-56 w-full rounded-xl object-cover" />
        ) : (
          <div className="mt-6 h-56 w-full rounded-xl bg-slate-800" />
        )}
        <h1 className="mt-6 text-3xl font-bold text-slate-100">{String(o.title ?? '')}</h1>
        <p className="mt-2 text-slate-400">{String(o.fuzzy_landmark ?? '')}</p>
        <p className="mt-4 text-lg font-semibold text-sky-400">
          {o.price_per_hour != null ? `₹${Math.round(Number(o.price_per_hour))}/hr` : ''}
          {o.price_per_day != null ? ` · ₹${Math.round(Number(o.price_per_day))}/day` : ''}
        </p>
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm font-semibold text-slate-300">Host</p>
          <p className="mt-1 text-slate-100">{String(o.owner_name ?? '')}</p>
        </div>
        <h2 className="mt-10 text-lg font-semibold text-slate-200">Reviews</h2>
        <ul className="mt-3 space-y-3">
          {reviews.length === 0 ? <li className="text-slate-500">No reviews yet.</li> : null}
          {reviews.map((r, i) => (
            <li key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
              <span className="font-semibold text-slate-100">★ {String(r.rating)}</span>
              <span className="text-slate-500"> · {String(r.reviewer_name ?? '')}</span>
              {r.comment ? <p className="mt-2 text-slate-400">{String(r.comment)}</p> : null}
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled
          className="mt-10 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-slate-950 opacity-60"
        >
          Book (next phase)
        </button>
      </div>
    </main>
  );
}
