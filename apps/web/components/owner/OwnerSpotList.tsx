'use client';

import type { Spot } from '@parknear/shared';
import { getSpotPhotoPublicUrl } from '@parknear/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export function OwnerSpotList({ spots }: { spots: Spot[] }) {
  const router = useRouter();
  const supabase = createClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(id: string, isActive: boolean) {
    setBusy(id);
    await supabase.from('spots').update({ is_active: !isActive }).eq('id', id);
    setBusy(null);
    router.refresh();
  }

  async function deactivate(id: string) {
    if (!confirm('Deactivate this listing?')) return;
    setBusy(id);
    await supabase.from('spots').update({ is_active: false }).eq('id', id);
    setBusy(null);
    router.refresh();
  }

  if (!spots.length) {
    return <p className="mt-4 text-slate-500">No spots yet. Create your first listing.</p>;
  }

  return (
    <ul className="mt-4 space-y-4">
      {spots.map((spot) => {
        const thumb = spot.photos?.[0];
        const src = thumb ? getSpotPhotoPublicUrl(url, thumb) : null;
        return (
          <li
            key={spot.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center"
          >
            <div className="h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-slate-800">
              {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{spot.title}</p>
              <p className="text-sm text-slate-400">
                {spot.spot_type} · {spot.coverage}
                {spot.price_per_hour != null ? ` · ₹${spot.price_per_hour}/hr` : ''}
              </p>
              <p className="text-sm text-slate-500">★ {Number(spot.avg_rating).toFixed(1)}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  spot.is_active ? 'bg-emerald-900/60 text-emerald-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {spot.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/spots/${spot.id}`}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-sky-400 hover:bg-slate-800"
              >
                Edit
              </Link>
              <Link
                href={`/spots/${spot.id}/availability`}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                Availability
              </Link>
              <button
                type="button"
                disabled={busy === spot.id}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                onClick={() => void toggle(spot.id, spot.is_active)}
              >
                {spot.is_active ? 'Pause' : 'Activate'}
              </button>
              <button
                type="button"
                disabled={busy === spot.id}
                className="rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                onClick={() => void deactivate(spot.id)}
              >
                Deactivate
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
