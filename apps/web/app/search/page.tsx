'use client';

import { searchSpotsNearby, type SearchSpotsResult } from '@parknear/shared';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

const CHENNAI = { lat: 13.0827, lng: 80.2707 };

function formatInr(n: string | number | null | undefined) {
  if (n == null) return '—';
  const num = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(num)) return '—';
  return `₹${Math.round(num)}`;
}

function SpotRow({ spot }: { spot: SearchSpotsResult }) {
  const photo = spot.photos[0];
  return (
    <Link
      href={`/spot/${spot.id}`}
      className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-sky-500/40"
    >
      <div
        className="h-24 w-24 shrink-0 rounded-lg bg-slate-800 bg-cover bg-center"
        style={photo ? { backgroundImage: `url(${photo})` } : undefined}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-100">{spot.title}</p>
        <p className="mt-1 text-sm text-slate-400">
          {formatInr(spot.price_per_hour)}/hr · {Math.round(spot.distance_meters)} m · ★{' '}
          {typeof spot.avg_rating === 'number' ? spot.avg_rating : Number(spot.avg_rating) || '—'}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{spot.fuzzy_landmark}</p>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const [lat, setLat] = useState(CHENNAI.lat);
  const [lng, setLng] = useState(CHENNAI.lng);
  const [radius, setRadius] = useState(2000);
  const [spots, setSpots] = useState<SearchSpotsResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const { data, error } = await searchSpotsNearby(supabase, { lat, lng, radius_meters: radius });
      if (error) setErr(error.message);
      setSpots(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Search failed');
      setSpots([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius]);

  useEffect(() => {
    void run();
  }, [run]);

  const useBrowserLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErr('Geolocation not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setErr('Location permission denied — using Chennai.'),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 }
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-sky-400">Find parking</h1>
        <p className="mt-2 text-slate-400">Fuzzy locations only — exact address unlocks after booking.</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={useBrowserLocation}
            className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
          >
            Use my location
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Radius (m)
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1"
            >
              <option value={1000}>1000</option>
              <option value={2000}>2000</option>
              <option value={5000}>5000</option>
            </select>
          </label>
        </div>

        {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}
        {loading ? <p className="mt-6 text-slate-400">Searching…</p> : null}

        <ul className="mt-8 flex flex-col gap-3">
          {spots.map((s) => (
            <li key={s.id}>
              <SpotRow spot={s} />
            </li>
          ))}
        </ul>

        {!loading && spots.length === 0 ? <p className="mt-6 text-slate-500">No spots in this radius.</p> : null}
      </div>
    </main>
  );
}
