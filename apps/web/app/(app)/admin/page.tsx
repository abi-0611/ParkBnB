import {
  fetchBookingsByPincode,
  fetchBookingsLast30Days,
  fetchCumulativeUsers90Days,
  fetchDashboardKpis,
  fetchRecentActivity,
  fetchRevenueLast30Days,
} from '@parknear/shared';

import { ActivityFeed } from '@/components/admin/ActivityFeed';
import {
  AreasHorizontalChart,
  BookingsLineChart,
  RevenueBarChart,
  UserGrowthChart,
} from '@/components/admin/DashboardCharts';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

function Kpi({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const [kpis, bookingsSeries, revenueSeries, areas, growth, activity] = await Promise.all([
    fetchDashboardKpis(supabase),
    fetchBookingsLast30Days(supabase),
    fetchRevenueLast30Days(supabase),
    fetchBookingsByPincode(supabase, 8),
    fetchCumulativeUsers90Days(supabase),
    fetchRecentActivity(supabase, 10),
  ]);

  const mom =
    kpis.signupsMomPct === null
      ? '—'
      : `${kpis.signupsMomPct > 0 ? '+' : ''}${kpis.signupsMomPct}% vs last month (new signups)`;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Overview of users, listings, and bookings.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Total users" value={`${kpis.totalUsers}`} sub={mom} />
        <Kpi title="Active spots" value={`${kpis.activeSpots}`} />
        <Kpi title="Bookings (this month)" value={`${kpis.bookingsThisMonth}`} />
        <Kpi
          title="Revenue (this month)"
          value={`₹${Math.round(kpis.revenueThisMonth).toLocaleString('en-IN')}`}
          sub="Sum of service_fee on completed bookings"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Bookings (last 30 days)</h2>
          <BookingsLineChart data={bookingsSeries} />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Revenue (last 30 days)</h2>
          <RevenueBarChart data={revenueSeries} />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Top areas (by booking volume)</h2>
          <AreasHorizontalChart rows={areas} />
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">User growth (90 days, cumulative)</h2>
          <UserGrowthChart data={growth} />
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent activity</h2>
        <p className="mb-3 text-xs text-slate-500">Refreshes every 60 seconds while this page is open.</p>
        <ActivityFeed initial={activity} />
      </section>
    </div>
  );
}
