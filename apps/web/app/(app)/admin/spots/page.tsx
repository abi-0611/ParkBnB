import Link from 'next/link';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

import { SpotRowActions } from './SpotRowActions';

const PER = 15;

export default async function AdminSpotsPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; coverage?: string; status?: string; featured?: string; page?: string };
}) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

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
        <h1 className="text-2xl font-semibold text-slate-900">Spots</h1>
        <p className="text-sm text-slate-600">Manage listings, visibility, and featured placement.</p>
        <p className="mt-2 text-xs text-slate-500">
          Map view: add <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> later for an exact-location map.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4" action="/admin/spots" method="get">
        <div>
          <label className="block text-xs font-medium text-slate-600">Search</label>
          <input name="q" defaultValue={q} placeholder="Title, area, address" className="mt-1 w-56 rounded border border-slate-300 px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Type</label>
          <select name="type" defaultValue={typeFilter} className="mt-1 rounded border border-slate-300 px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="car">car</option>
            <option value="bike">bike</option>
            <option value="both">both</option>
            <option value="ev_charging">ev_charging</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Coverage</label>
          <select name="coverage" defaultValue={coverageFilter} className="mt-1 rounded border border-slate-300 px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="covered">covered</option>
            <option value="open">open</option>
            <option value="underground">underground</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Status</label>
          <select name="status" defaultValue={statusFilter} className="mt-1 rounded border border-slate-300 px-3 py-1.5 text-sm">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="feat" name="featured" value="1" defaultChecked={featuredOnly} />
          <label htmlFor="feat" className="text-sm">
            Featured only
          </label>
        </div>
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Apply
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
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
          <tbody className="divide-y divide-slate-100">
            {(spots ?? []).map((s) => {
              const owner = owners?.find((o) => o.id === s.owner_id);
              const thumb = s.photos?.[0];
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-12 w-16 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-16 rounded bg-slate-200" />
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <Link href={`/spot/${s.id}`} className="text-sky-700 hover:underline">
                      {s.title}
                    </Link>
                    <div className="text-xs font-normal text-slate-500">
                      {s.is_active ? <span className="text-emerald-700">Active</span> : <span className="text-slate-500">Inactive</span>}
                      {s.is_featured ? <span className="ml-2 text-amber-700">Featured</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-2">{owner?.full_name ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-700">{s.fuzzy_landmark}</td>
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

      <div className="flex justify-between text-sm text-slate-600">
        <span>
          Page {page} / {pages} ({total} spots)
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link className="rounded border border-slate-300 px-3 py-1" href={`/admin/spots?${baseQs ? `${baseQs}&` : ''}page=${page - 1}`}>
              Previous
            </Link>
          ) : null}
          {page < pages ? (
            <Link className="rounded border border-slate-300 px-3 py-1" href={`/admin/spots?${baseQs ? `${baseQs}&` : ''}page=${page + 1}`}>
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
