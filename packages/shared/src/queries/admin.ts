import type { SupabaseClient } from '@supabase/supabase-js';

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfPrevMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

export type DashboardKpis = {
  totalUsers: number;
  newSignupsThisMonth: number;
  newSignupsLastMonth: number;
  signupsMomPct: number | null;
  activeSpots: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
};

export async function fetchDashboardKpis(client: SupabaseClient): Promise<DashboardKpis> {
  const sm = startOfMonth();
  const spm = startOfPrevMonth();

  const { count: totalUsers } = await client.from('users').select('*', { count: 'exact', head: true });

  const { count: newSignupsThisMonth } = await client
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sm.toISOString());

  const { count: newSignupsLastMonth } = await client
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', spm.toISOString())
    .lt('created_at', sm.toISOString());

  const { count: activeSpots } = await client
    .from('spots')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: bookingsThisMonth } = await client
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sm.toISOString());

  const { data: revRows } = await client
    .from('bookings')
    .select('service_fee')
    .eq('status', 'completed')
    .gte('created_at', sm.toISOString());

  let revenueThisMonth = 0;
  for (const r of revRows ?? []) {
    revenueThisMonth += Number(r.service_fee);
  }

  const nThis = newSignupsThisMonth ?? 0;
  const nLast = newSignupsLastMonth ?? 0;
  const signupsMomPct =
    nLast > 0 ? Math.round(((nThis - nLast) / nLast) * 1000) / 10 : nThis > 0 ? 100 : null;

  return {
    totalUsers: totalUsers ?? 0,
    newSignupsThisMonth: nThis,
    newSignupsLastMonth: nLast,
    signupsMomPct,
    activeSpots: activeSpots ?? 0,
    bookingsThisMonth: bookingsThisMonth ?? 0,
    revenueThisMonth,
  };
}

export type TimeSeriesPoint = { date: string; value: number };

export async function fetchBookingsLast30Days(client: SupabaseClient): Promise<TimeSeriesPoint[]> {
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const { data } = await client.from('bookings').select('created_at').gte('created_at', start.toISOString());

  const byDay = new Map<string, number>();
  const cur = new Date(start);
  const end = new Date();
  while (cur <= end) {
    byDay.set(cur.toISOString().slice(0, 10), 0);
    cur.setDate(cur.getDate() + 1);
  }

  for (const row of data ?? []) {
    const d = new Date(row.created_at).toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }

  return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }));
}

export async function fetchRevenueLast30Days(client: SupabaseClient): Promise<TimeSeriesPoint[]> {
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const { data } = await client
    .from('bookings')
    .select('service_fee, checked_out_at')
    .eq('status', 'completed')
    .not('checked_out_at', 'is', null)
    .gte('checked_out_at', start.toISOString());

  const byDay = new Map<string, number>();
  const cur = new Date(start);
  const end = new Date();
  while (cur <= end) {
    byDay.set(cur.toISOString().slice(0, 10), 0);
    cur.setDate(cur.getDate() + 1);
  }

  for (const row of data ?? []) {
    if (!row.checked_out_at) continue;
    const d = new Date(row.checked_out_at).toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + Number(row.service_fee));
  }

  return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }));
}

export type AreaBookingRow = { area: string; count: number };

export async function fetchBookingsByPincode(client: SupabaseClient, limit = 10): Promise<AreaBookingRow[]> {
  const { data: bookings } = await client.from('bookings').select('spot_id').limit(5000);
  if (!bookings?.length) return [];

  const spotIds = Array.from(new Set(bookings.map((b) => b.spot_id)));
  const { data: spots } = await client.from('spots').select('id, pincode, fuzzy_landmark').in('id', spotIds);

  const pinCount = new Map<string, number>();
  for (const b of bookings) {
    const spot = spots?.find((s) => s.id === b.spot_id);
    const key = spot?.pincode || spot?.fuzzy_landmark || 'Unknown';
    pinCount.set(key, (pinCount.get(key) ?? 0) + 1);
  }

  return Array.from(pinCount.entries())
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function fetchCumulativeUsers90Days(client: SupabaseClient): Promise<TimeSeriesPoint[]> {
  const start = new Date();
  start.setDate(start.getDate() - 90);
  const { data } = await client.from('users').select('created_at').gte('created_at', start.toISOString()).order('created_at');

  const byDay = new Map<string, number>();
  const cur = new Date(start);
  const end = new Date();
  while (cur <= end) {
    byDay.set(cur.toISOString().slice(0, 10), 0);
    cur.setDate(cur.getDate() + 1);
  }

  for (const row of data ?? []) {
    const d = new Date(row.created_at).toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }

  let cum = 0;
  const { count: before } = await client
    .from('users')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', start.toISOString());
  cum = before ?? 0;

  const sortedDays = Array.from(byDay.keys()).sort();
  const out: TimeSeriesPoint[] = [];
  for (const day of sortedDays) {
    cum += byDay.get(day) ?? 0;
    out.push({ date: day, value: cum });
  }
  return out;
}

export type ActivityItem = {
  id: string;
  kind: 'booking' | 'dispute' | 'kyc' | 'cancel';
  label: string;
  at: string;
  href: string;
};

export async function fetchRecentActivity(client: SupabaseClient, take = 10): Promise<ActivityItem[]> {
  const { data: bookings } = await client
    .from('bookings')
    .select('id, created_at, status')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: disputes } = await client
    .from('disputes')
    .select('id, created_at, status')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: kyc } = await client
    .from('users')
    .select('id, updated_at, kyc_status, full_name')
    .eq('kyc_status', 'submitted')
    .order('updated_at', { ascending: false })
    .limit(5);

  const items: ActivityItem[] = [];

  for (const b of bookings ?? []) {
    items.push({
      id: `b-${b.id}`,
      kind: b.status?.includes('cancel') ? 'cancel' : 'booking',
      label: `Booking ${String(b.id).slice(0, 8)}… — ${b.status}`,
      at: b.created_at,
      href: `/admin/bookings/${b.id}`,
    });
  }
  for (const d of disputes ?? []) {
    items.push({
      id: `d-${d.id}`,
      kind: 'dispute',
      label: `Dispute opened — ${d.status}`,
      at: d.created_at,
      href: `/admin/disputes/${d.id}`,
    });
  }
  for (const u of kyc ?? []) {
    items.push({
      id: `k-${u.id}`,
      kind: 'kyc',
      label: `KYC submitted — ${u.full_name}`,
      at: u.updated_at,
      href: `/admin/kyc`,
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, take);
}
