import Link from 'next/link';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

export default async function AdminDisputesPage() {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { data: rows } = await supabase.from('disputes').select('*').order('created_at', { ascending: false });

  const userIds = Array.from(new Set((rows ?? []).flatMap((d) => [d.raised_by, d.against_user])));
  const { data: users } = userIds.length
    ? await supabase.from('users').select('id, full_name, role').in('id', userIds)
    : { data: [] };

  const openFirst = (rows ?? []).filter((d) => d.status === 'open' || d.status === 'under_review');
  const rest = (rows ?? []).filter((d) => d.status !== 'open' && d.status !== 'under_review');

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Disputes</h1>
        <p className="text-sm text-slate-600">Open cases first; refunds and Razorpay actions are recorded separately.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Open</h2>
        <div className="space-y-3">
          {openFirst.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-600">No open disputes.</p>
          ) : (
            openFirst.map((d) => <DisputeCard key={d.id} d={d} users={users ?? []} />)
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Closed</h2>
        <div className="space-y-3">
          {rest.map((d) => (
            <DisputeCard key={d.id} d={d} users={users ?? []} />
          ))}
          {rest.length === 0 ? <p className="text-slate-500">None yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

function DisputeCard({
  d,
  users,
}: {
  d: {
    id: string;
    booking_id: string;
    raised_by: string;
    against_user: string;
    reason: string;
    status: string;
    created_at: string;
  };
  users: { id: string; full_name: string; role: string }[];
}) {
  const raiser = users.find((u) => u.id === d.raised_by);
  const other = users.find((u) => u.id === d.against_user);
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`/admin/disputes/${d.id}`} className="font-semibold text-sky-800 hover:underline">
            {String(d.id).slice(0, 8)}…
          </Link>
          <p className="text-xs text-slate-500">{new Date(d.created_at).toLocaleString()}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">{d.status}</span>
      </div>
      <p className="mt-2 text-sm text-slate-700">
        <span className="font-medium">{raiser?.full_name}</span> ({raiser?.role}) vs{' '}
        <span className="font-medium">{other?.full_name}</span> ({other?.role})
      </p>
      <p className="text-sm text-slate-600">
        Reason: {d.reason} ·{' '}
        <Link href={`/admin/bookings/${d.booking_id}`} className="text-sky-700 hover:underline">
          Booking
        </Link>
      </p>
    </article>
  );
}
