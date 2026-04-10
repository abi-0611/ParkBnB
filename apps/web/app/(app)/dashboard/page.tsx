import Link from 'next/link';
import { redirect } from 'next/navigation';

import { OwnerSpotList } from '@/components/owner/OwnerSpotList';
import { SignOutButton } from '@/components/SignOutButton';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function OwnerDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('full_name, email, role').eq('id', user.id).single();

  const { data: spots } = await supabase.from('spots').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });

  const spotIds = (spots ?? []).map((s) => s.id);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  let totalBookingsMonth = 0;
  let monthlyEarnings = 0;
  if (spotIds.length) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('status, owner_payout, created_at')
      .in('spot_id', spotIds)
      .gte('created_at', monthStart.toISOString());

    for (const b of bookings ?? []) {
      totalBookingsMonth += 1;
      if (b.status === 'completed' && b.owner_payout != null) {
        monthlyEarnings += Number(b.owner_payout);
      }
    }
  }

  const activeListings = (spots ?? []).filter((s) => s.is_active).length;
  let avgRating = 0;
  let rc = 0;
  for (const s of spots ?? []) {
    if (Number(s.total_reviews) > 0) {
      avgRating += Number(s.avg_rating);
      rc += 1;
    }
  }
  const avg = rc ? avgRating / rc : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-sky-400">Owner dashboard</h1>
          <p className="mt-2 text-slate-300">
            Hello, <span className="font-medium text-white">{profile?.full_name ?? user.email}</span>
          </p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/spots/new"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            + New spot
          </Link>
          <Link href="/" className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
            Home
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Active" value={`${activeListings}`} />
        <Stat label="Bookings (mo)" value={`${totalBookingsMonth}`} />
        <Stat label="Earnings (mo)" value={`₹${Math.round(monthlyEarnings)}`} />
        <Stat label="Avg rating" value={avg ? avg.toFixed(1) : '—'} />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-200">Your spots</h2>
      <OwnerSpotList spots={spots ?? []} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
