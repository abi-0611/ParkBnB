import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

import { AnalyticsCharts } from './AnalyticsCharts';

const RANGE_DAYS: Record<string, number | null> = {
  '7': 7,
  '30': 30,
  '90': 90,
  all: null,
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const rangeKey = searchParams.range === 'all' ? 'all' : searchParams.range ?? '30';
  const days = RANGE_DAYS[rangeKey] ?? 30;
  const start = days === null ? null : new Date(Date.now() - days * 864e5).toISOString();

  let bookingQuery = supabase.from('bookings').select('status, booking_type, service_fee, created_at, total_price');
  if (start) bookingQuery = bookingQuery.gte('created_at', start);

  const [{ data: bookings }, { data: users }, { data: spots }] = await Promise.all([
    bookingQuery,
    supabase.from('users').select('role, created_at, id'),
    supabase.from('spots').select('pincode, fuzzy_landmark, created_at, price_per_hour'),
  ]);

  const completed = (bookings ?? []).filter((b) => b.status === 'completed');
  const revenueTotal = completed.reduce((s, b) => s + Number(b.service_fee), 0);
  const byType: Record<string, number> = {};
  for (const b of completed) {
    byType[b.booking_type] = (byType[b.booking_type] ?? 0) + Number(b.service_fee);
  }
  const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  const roleCount: Record<string, number> = {};
  for (const u of users ?? []) {
    roleCount[u.role] = (roleCount[u.role] ?? 0) + 1;
  }
  const rolePie = Object.entries(roleCount).map(([name, value]) => ({ name, value }));

  const bStatuses: Record<string, number> = {};
  for (const b of bookings ?? []) {
    bStatuses[b.status] = (bStatuses[b.status] ?? 0) + 1;
  }
  const totalB = bookings?.length ?? 0;
  const pct = (x: number) => (totalB === 0 ? 0 : Math.round((x / totalB) * 100));
  const completedN = bStatuses['completed'] ?? 0;
  const cancelN =
    (bStatuses['cancelled_by_seeker'] ?? 0) + (bStatuses['cancelled_by_owner'] ?? 0);
  const noShowN = bStatuses['no_show'] ?? 0;

  const spotAreas: Record<string, number> = {};
  for (const s of spots ?? []) {
    const k = s.pincode || s.fuzzy_landmark || 'Unknown';
    spotAreas[k] = (spotAreas[k] ?? 0) + 1;
  }
  const areaBars = Object.entries(spotAreas)
    .map(([name, count]) => ({ name: name.length > 14 ? `${name.slice(0, 14)}…` : name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const dailyRev = new Map<string, number>();
  for (const b of completed) {
    const day = new Date(b.created_at).toISOString().slice(0, 10);
    dailyRev.set(day, (dailyRev.get(day) ?? 0) + Number(b.service_fee));
  }
  const trend = Array.from(dailyRev.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date: date.slice(5), value }));

  const currentRange = rangeKey;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-600">Aggregated metrics (RLS admin access).</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {(['7', '30', '90', 'all'] as const).map((r) => (
            <a
              key={r}
              href={r === 'all' ? '/admin/analytics?range=all' : `/admin/analytics?range=${r}`}
              className={`rounded-lg border px-3 py-1.5 font-medium ${
                currentRange === r ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              {r === 'all' ? 'All time' : `${r}d`}
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (range)" value={`₹${Math.round(revenueTotal).toLocaleString('en-IN')}`} />
        <Stat label="Completion rate" value={`${pct(completedN)}%`} />
        <Stat label="Cancellation rate" value={`${pct(cancelN)}%`} />
        <Stat label="No-show rate" value={`${pct(noShowN)}%`} />
      </div>

      <AnalyticsCharts pieData={pieData} rolePie={rolePie} trend={trend} areaBars={areaBars} />

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Map heatmap & search-demand analytics</p>
        <p className="mt-1 text-amber-800">
          Wire Mapbox with <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> and search logs to compare demand vs supply by area.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
