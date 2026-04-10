import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

import { DisputeResolveForm } from '../DisputeResolveForm';

export default async function AdminDisputeDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const id = params.id;

  const { data: d, error } = await supabase.from('disputes').select('*').eq('id', id).single();
  if (error || !d) notFound();

  const [{ data: raiser }, { data: other }, { data: booking }, { data: messages }] = await Promise.all([
    supabase.from('users').select('*').eq('id', d.raised_by).single(),
    supabase.from('users').select('*').eq('id', d.against_user).single(),
    supabase.from('bookings').select('*').eq('id', d.booking_id).single(),
    supabase.from('messages').select('*').eq('booking_id', d.booking_id).order('created_at', { ascending: true }),
  ]);

  const { data: spot } = booking
    ? await supabase.from('spots').select('*').eq('id', booking.spot_id).single()
    : { data: null };

  const closed = d.status !== 'open' && d.status !== 'under_review';

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <Link href="/admin/disputes" className="text-sm text-sky-700 hover:underline">
          ← Disputes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Dispute</h1>
        <p className="font-mono text-xs text-slate-500">{d.id}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <p className="mt-2 text-sm">
              <strong>Reason:</strong> {d.reason}
            </p>
            <p className="mt-2 text-sm text-slate-700">{d.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(d.evidence_photos ?? []).map((url: string, i: number) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Evidence ${i + 1}`} className="h-24 w-24 rounded object-cover ring-1 ring-slate-200" />
                </a>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Raiser</h3>
              <Link href={`/admin/users/${raiser?.id}`} className="mt-1 block font-medium text-sky-800 hover:underline">
                {raiser?.full_name}
              </Link>
              <p className="text-xs text-slate-600">
                {raiser?.role} · seeker {Number(raiser?.seeker_rating ?? 0).toFixed(1)} / owner {Number(raiser?.owner_rating ?? 0).toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Other party</h3>
              <Link href={`/admin/users/${other?.id}`} className="mt-1 block font-medium text-sky-800 hover:underline">
                {other?.full_name}
              </Link>
              <p className="text-xs text-slate-600">
                {other?.role} · seeker {Number(other?.seeker_rating ?? 0).toFixed(1)} / owner {Number(other?.owner_rating ?? 0).toFixed(1)}
              </p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Booking</h2>
            {booking ? (
              <div className="mt-2 text-sm">
                <Link href={`/admin/bookings/${booking.id}`} className="text-sky-700 hover:underline">
                  Open booking
                </Link>
                <p className="text-slate-600">
                  {booking.status} · ₹{Number(booking.total_price)} · {new Date(booking.start_time).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-slate-500">—</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Chat</h2>
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto text-sm">
              {(messages ?? []).map((m) => (
                <li key={m.id} className="rounded border border-slate-100 bg-slate-50 px-2 py-1">
                  {m.content}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Spot</h2>
            {spot ? (
              <div className="mt-2 text-sm">
                <p className="font-medium">{spot.title}</p>
                <p>{spot.address_line}</p>
                <div className="mt-2 flex gap-2">
                  {(spot.photos ?? []).slice(0, 3).map((p: string) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p} src={p} alt="" className="h-16 w-24 rounded object-cover" />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500">—</p>
            )}
          </section>
        </div>
      </div>

      {closed ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-sm font-semibold text-emerald-900">Resolved</h2>
          <p className="mt-1 text-sm text-emerald-800">Status: {d.status}</p>
          <p className="text-sm text-emerald-900">{d.resolution}</p>
          <p className="mt-2 text-xs text-emerald-800">{d.admin_notes}</p>
        </section>
      ) : (
        <DisputeResolveForm disputeId={d.id} raiserId={d.raised_by} otherId={d.against_user} />
      )}
    </div>
  );
}
