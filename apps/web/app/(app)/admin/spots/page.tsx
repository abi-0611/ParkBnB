import Link from 'next/link';
import { getSpotPhotoPublicUrl } from '@parknear/shared';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

import { SpotRowActions } from './SpotRowActions';
import { SpotsInteractiveMap } from './SpotsInteractiveMap';

const PER = 15;

type SpotWithCoords = {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
};

function parseCoords(raw: unknown): { lat: number; lng: number } | null {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length > 0) {
    return parseCoords(raw[0]);
  }

  // GeoJSON-like: { type: "Point", coordinates: [lng, lat] }
  if (typeof raw === 'object' && raw !== null && 'coordinates' in raw) {
    const coordinates = (raw as { coordinates?: unknown }).coordinates;
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }

  // PostGIS text forms:
  // - POINT(lng lat)
  // - SRID=4326;POINT(lng lat)
  const s = String(raw);
  // PostGIS EWKB hex
  if (/^[0-9A-Fa-f]{50,}$/.test(s) && s.length % 2 === 0) {
    try {
      const buf = Buffer.from(s, 'hex');
      const littleEndian = buf.readUInt8(0) === 1;
      const type = littleEndian ? buf.readUInt32LE(1) : buf.readUInt32BE(1);
      const hasSrid = (type & 0x20000000) !== 0;
      let off = 1 + 4 + (hasSrid ? 4 : 0);
      const lng = littleEndian ? buf.readDoubleLE(off) : buf.readDoubleBE(off);
      off += 8;
      const lat = littleEndian ? buf.readDoubleLE(off) : buf.readDoubleBE(off);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    } catch {
      // continue other parser branches
    }
  }
  const m = s.match(/POINT\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)/i);
  if (m) {
    const lng = Number(m[1]);
    const lat = Number(m[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

export default async function AdminSpotsPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; coverage?: string; status?: string; featured?: string; page?: string };
}) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const hasMapboxToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim());
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  const q = (searchParams.q ?? '').trim();
  const typeFilter = searchParams.type ?? '';
  const coverageFilter = searchParams.coverage ?? '';
  const statusFilter = searchParams.status ?? '';
  const featuredOnly = searchParams.featured === '1';
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  let query = supabase.from('spots').select('*', { count: 'exact' });

  if (q) {
    query = query.or(`title.ilike.%${q}%,fuzzy_landmark.ilike.%${q}%,address_line.ilike.%${q}%`);
  }
  if (typeFilter && ['car', 'bike', 'both', 'ev_charging'].includes(typeFilter)) {
    query = query.eq('spot_type', typeFilter);
  }
  if (coverageFilter && ['covered', 'open', 'underground'].includes(coverageFilter)) {
    query = query.eq('coverage', coverageFilter);
  }
  if (statusFilter === 'active') query = query.eq('is_active', true);
  if (statusFilter === 'inactive') query = query.eq('is_active', false);
  if (featuredOnly) query = query.eq('is_featured', true);

  query = query.order('created_at', { ascending: false });
  const from = (page - 1) * PER;
  query = query.range(from, from + PER - 1);

  const { data: spots, count, error } = await query;
  if (error) return <p className="text-rose-600">{error.message}</p>;

  const ownerIds = Array.from(new Set((spots ?? []).map((s) => s.owner_id)));
  const { data: owners } = ownerIds.length
    ? await supabase.from('users').select('id, full_name').in('id', ownerIds)
    : { data: [] };

  const spotIds = (spots ?? []).map((s) => s.id);
  const { data: bookingRows } =
    spotIds.length === 0
      ? { data: [] as { spot_id: string }[] }
      : await supabase.from('bookings').select('spot_id').in('spot_id', spotIds);

  const bookingCount = new Map<string, number>();
  for (const r of bookingRows ?? []) {
    bookingCount.set(r.spot_id, (bookingCount.get(r.spot_id) ?? 0) + 1);
  }

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER));

  let mapQuery = supabase
    .from('spots')
    .select('id, title, address_line, fuzzy_landmark, location')
    .order('created_at', { ascending: false })
    .limit(60);
  if (q) {
    mapQuery = mapQuery.or(`title.ilike.%${q}%,fuzzy_landmark.ilike.%${q}%,address_line.ilike.%${q}%`);
  }
  if (typeFilter && ['car', 'bike', 'both', 'ev_charging'].includes(typeFilter)) {
    mapQuery = mapQuery.eq('spot_type', typeFilter);
  }
  if (coverageFilter && ['covered', 'open', 'underground'].includes(coverageFilter)) {
    mapQuery = mapQuery.eq('coverage', coverageFilter);
  }
  if (statusFilter === 'active') mapQuery = mapQuery.eq('is_active', true);
  if (statusFilter === 'inactive') mapQuery = mapQuery.eq('is_active', false);
  if (featuredOnly) mapQuery = mapQuery.eq('is_featured', true);

  const { data: mapRows, error: mapError } = hasMapboxToken
    ? await mapQuery
    : { data: [], error: null };

  const mapSpots: SpotWithCoords[] = (mapRows ?? [])
    .map((r) => {
      const coords = parseCoords(r.location);
      if (!coords) return null;
      return {
        id: r.id,
        title: r.title,
        address: r.address_line ?? r.fuzzy_landmark ?? 'Location unavailable',
        lat: coords.lat,
        lng: coords.lng,
      };
    })
    .filter((x): x is SpotWithCoords => Boolean(x));

  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (typeFilter) qs.set('type', typeFilter);
  if (coverageFilter) qs.set('coverage', coverageFilter);
  if (statusFilter) qs.set('status', statusFilter);
  if (featuredOnly) qs.set('featured', '1');
  const baseQs = qs.toString();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-txt-primary">Spots</h1>
        <p className="text-sm text-txt-secondary">Manage listings, visibility, and featured placement.</p>
      </div>

      {hasMapboxToken && mapError ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          Map failed to load: {mapError.message}
        </div>
      ) : null}

      {hasMapboxToken ? (
        <section className="rounded-xl border border-border-token bg-bg-surface p-4">
          <h2 className="mb-1 text-sm font-semibold text-txt-primary">Exact location map (admin only)</h2>
          {mapError ? (
            <p className="mb-3 text-xs text-danger">Map data query failed: {mapError.message}</p>
          ) : mapSpots.length === 0 ? (
            <p className="mb-3 text-xs text-txt-muted">
              No mappable spots found for current filters. Try clearing filters or verify spots have valid coordinates.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-txt-muted">
                Showing {mapSpots.length} filtered spot{mapSpots.length !== 1 ? "s" : ""} with interactive pins.
              </p>
              <SpotsInteractiveMap spots={mapSpots} accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''} />
            </>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs text-warning">
          Map is disabled because <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> is missing.
        </section>
      )}

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border-token bg-bg-surface p-4" action="/admin/spots" method="get">
        <div>
          <label className="block text-xs font-medium text-txt-secondary">Search</label>
          <input name="q" defaultValue={q} placeholder="Title, area, address" className="mt-1 w-56 rounded border border-border-token bg-bg-elevated px-3 py-1.5 text-sm text-txt-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-txt-secondary">Type</label>
          <select name="type" defaultValue={typeFilter} className="mt-1 rounded border border-border-token bg-bg-elevated px-3 py-1.5 text-sm text-txt-primary">
            <option value="">All</option>
            <option value="car">car</option>
            <option value="bike">bike</option>
            <option value="both">both</option>
            <option value="ev_charging">ev_charging</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-txt-secondary">Coverage</label>
          <select name="coverage" defaultValue={coverageFilter} className="mt-1 rounded border border-border-token bg-bg-elevated px-3 py-1.5 text-sm text-txt-primary">
            <option value="">All</option>
            <option value="covered">covered</option>
            <option value="open">open</option>
            <option value="underground">underground</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-txt-secondary">Status</label>
          <select name="status" defaultValue={statusFilter} className="mt-1 rounded border border-border-token bg-bg-elevated px-3 py-1.5 text-sm text-txt-primary">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="feat" name="featured" value="1" defaultChecked={featuredOnly} />
          <label htmlFor="feat" className="text-sm text-txt-secondary">
            Featured only
          </label>
        </div>
        <button type="submit" className="rounded-lg bg-electric px-4 py-2 text-sm font-medium text-white">
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border-token bg-bg-surface shadow-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-token bg-bg-elevated text-xs font-semibold uppercase text-txt-secondary">
            <tr>
              <th className="px-4 py-3">Thumb</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">₹/hr</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-token">
            {(spots ?? []).map((s) => {
              const owner = owners?.find((o) => o.id === s.owner_id);
              const thumb = s.photos?.[0];
              const thumbSrc = thumb ? getSpotPhotoPublicUrl(supabaseUrl, thumb) : null;
              return (
                <tr key={s.id} className="hover:bg-bg-elevated/70">
                  <td className="px-4 py-2">
                    {thumbSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbSrc} alt="" className="h-12 w-16 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-16 rounded bg-bg-elevated" />
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-txt-primary">
                    <Link href={`/spot/${s.id}`} className="text-sky-700 hover:underline">
                      {s.title}
                    </Link>
                    <div className="text-xs font-normal text-txt-muted">
                      {s.is_active ? <span className="text-emerald-400">Active</span> : <span className="text-txt-muted">Inactive</span>}
                      {s.is_featured ? <span className="ml-2 text-amber-700">Featured</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-2">{owner?.full_name ?? '—'}</td>
                  <td className="px-4 py-2 text-txt-secondary">{s.fuzzy_landmark}</td>
                  <td className="px-4 py-2">
                    {s.spot_type} / {s.coverage}
                  </td>
                  <td className="px-4 py-2">{s.price_per_hour != null ? `₹${Number(s.price_per_hour)}` : '—'}</td>
                  <td className="px-4 py-2">
                    {Number(s.avg_rating).toFixed(1)} ({s.total_reviews})
                  </td>
                  <td className="px-4 py-2">{bookingCount.get(s.id) ?? 0}</td>
                  <td className="px-4 py-2">
                    <SpotRowActions spotId={s.id} isActive={s.is_active} isFeatured={s.is_featured} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between text-sm text-txt-secondary">
        <span>
          Page {page} / {pages} ({total} spots)
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link className="rounded border border-border-token bg-bg-surface px-3 py-1 hover:bg-bg-elevated" href={`/admin/spots?${baseQs ? `${baseQs}&` : ''}page=${page - 1}`}>
              Previous
            </Link>
          ) : null}
          {page < pages ? (
            <Link className="rounded border border-border-token bg-bg-surface px-3 py-1 hover:bg-bg-elevated" href={`/admin/spots?${baseQs ? `${baseQs}&` : ''}page=${page + 1}`}>
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
