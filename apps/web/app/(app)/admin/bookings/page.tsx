import Link from 'next/link';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

import { BookingRowActions } from './BookingRowActions';

const PER = 20;

function shortBookingId(id: string) {
  return `PK-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; spot?: string; page?: string };
}) {
  await requireAdmin();
  const supabase = createServerSupabaseClient();

  const q = (searchParams.q ?? '').trim();
  const statusFilter = searchParams.status ?? '';
  const spotFilter = searchParams.spot ?? '';
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  let query = supabase.from('bookings').select('*', { count: 'exact' });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }
  if (spotFilter) {
    query = query.eq('spot_id', spotFilter);
  }
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (q && uuidRe.test(q)) {
    query = query.eq('id', q);
  }

  query = query.order('start_time', { ascending: false });
  const from = (page - 1) * PER;
  query = query.range(from, from + PER - 1);

  const { data: bookings, count, error } = await query;
  if (error) return <p className="text-rose-600">{error.message}</p>;

  const seekerIds = Array.from(new Set((bookings ?? []).map((b) => b.seeker_id)));
  const spotIds = Array.from(new Set((bookings ?? []).map((b) => b.spot_id)));

  const { data: seekers } = seekerIds.length
    ? await supabase.from('users').select('id, full_name').in('id', seekerIds)
    : { data: [] };
  const { data: spots } = spotIds.length
    ? await supabase.from('spots').select('id, title, owner_id').in('id', spotIds)
    : { data: [] };
  const ownerIds = Array.from(new Set((spots ?? []).map((s) => s.owner_id)));
  const { data: owners } = ownerIds.length
    ? await supabase.from('users').select('id, full_name').in('id', ownerIds)
    : { data: [] };

  const pages = Math.max(1, Math.ceil((count ?? 0) / PER));

  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (statusFilter) qs.set('status', statusFilter);
  if (spotFilter) qs.set('spot', spotFilter);
  const baseQs = qs.toString();

  const statusBadge = (s: string) => {
    const cls =
      s === 'completed'
        ? 'bg-emerald/15 text-emerald'
        : s === 'pending'
          ? 'bg-warning/15 text-warning'
          : s.includes('cancel') || s === 'no_show'
            ? 'bg-danger/15 text-danger'
            : 'bg-bg-elevated text-txt-secondary';
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{s}</span>;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-txt-primary">Bookings</h1>
        <p className="text-sm text-txt-secondary">Operational view of all reservations.</p>
      </div>

      <form className="flex flex-wrap gap-3 rounded-xl border border-border-token bg-bg-surface p-4" action="/admin/bookings" method="get">
        <input type="hidden" name="spot" value={spotFilter} />
        <input name="q" defaultValue={q} placeholder="Full booking UUID" className="rounded border border-border-token bg-bg-elevated px-3 py-1.5 text-sm text-txt-primary" />
        <select name="status" defaultValue={statusFilter} className="rounded border border-border-token bg-bg-elevated px-3 py-1.5 text-sm text-txt-primary">
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="checked_in">checked_in</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
          <option value="cancelled_by_seeker">cancelled_by_seeker</option>
          <option value="cancelled_by_owner">cancelled_by_owner</option>
          <option value="no_show">no_show</option>
          <option value="disputed">disputed</option>
        </select>
        <button type="submit" className="rounded-lg bg-electric px-4 py-2 text-sm text-white">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border-token bg-bg-surface shadow-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border-token bg-bg-elevated text-xs font-semibold uppercase text-txt-secondary">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Seeker</th>
              <th className="px-4 py-3">Spot</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-token">
            {(bookings ?? []).map((b) => {
              const seeker = seekers?.find((s) => s.id === b.seeker_id);
              const spot = spots?.find((s) => s.id === b.spot_id);
              const owner = owners?.find((o) => o.id === spot?.owner_id);
              return (
                <tr key={b.id} className="hover:bg-bg-elevated/70">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link href={`/admin/bookings/${b.id}`} className="text-sky-700 hover:underline">
                      {shortBookingId(b.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{seeker?.full_name ?? '—'}</td>
                  <td className="px-4 py-2">{spot?.title ?? '—'}</td>
                  <td className="px-4 py-2">{owner?.full_name ?? '—'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-txt-secondary">
                    {new Date(b.start_time).toLocaleString()} → {new Date(b.end_time).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{b.booking_type}</td>
                  <td className="px-4 py-2">₹{Number(b.total_price).toFixed(0)}</td>
                  <td className="px-4 py-2">{statusBadge(b.status)}</td>
                  <td className="px-4 py-2">
                    <BookingRowActions bookingId={b.id} currentStatus={b.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between text-sm text-txt-secondary">
        <span>
          Page {page} / {pages} ({count ?? 0} bookings)
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link className="rounded border border-border-token bg-bg-surface px-3 py-1 hover:bg-bg-elevated" href={`/admin/bookings?${baseQs ? `${baseQs}&` : ''}page=${page - 1}`}>
              Previous
            </Link>
          ) : null}
          {page < pages ? (
            <Link className="rounded border border-border-token bg-bg-surface px-3 py-1 hover:bg-bg-elevated" href={`/admin/bookings?${baseQs ? `${baseQs}&` : ''}page=${page + 1}`}>
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
