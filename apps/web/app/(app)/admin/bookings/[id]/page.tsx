import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

function shortId(id: string) {
  return `PK-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
}

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const id = params.id;

  const { data: b, error } = await supabase.from('bookings').select('*').eq('id', id).single();
  if (error || !b) notFound();

  const [{ data: seeker }, { data: spot }, { data: messages }, { data: reviews }, { data: dispute }, { data: txs }] = await Promise.all([
    supabase.from('users').select('*').eq('id', b.seeker_id).single(),
    supabase.from('spots').select('*').eq('id', b.spot_id).single(),
    supabase.from('messages').select('*').eq('booking_id', id).order('created_at', { ascending: true }),
    supabase.from('reviews').select('*').eq('booking_id', id),
    supabase.from('disputes').select('*').eq('booking_id', id).maybeSingle(),
    supabase.from('transactions').select('*').eq('booking_id', id).order('created_at', { ascending: true }),
  ]);

  const { data: owner } = spot ? await supabase.from('users').select('full_name, email, phone').eq('id', spot.owner_id).single() : { data: null };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/admin/bookings" className="text-sm text-sky-700 hover:underline">
          ← Bookings
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Booking {shortId(b.id)}
        </h1>
        <p className="font-mono text-xs text-slate-500">{b.id}</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>
        <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-slate-700">
          <li>Created {new Date(b.created_at).toLocaleString()}</li>
          <li>Status: {b.status}</li>
          {b.checked_in_at ? <li>Checked in {new Date(b.checked_in_at).toLocaleString()}</li> : null}
          {b.checked_out_at ? <li>Checked out {new Date(b.checked_out_at).toLocaleString()}</li> : null}
          {b.cancelled_at ? <li>Cancelled {new Date(b.cancelled_at).toLocaleString()} — {b.cancellation_reason}</li> : null}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Payment</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Total</dt>
              <dd>₹{Number(b.total_price).toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Service fee</dt>
              <dd>₹{Number(b.service_fee).toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Payment status</dt>
              <dd>{b.payment_status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Razorpay order</dt>
              <dd className="font-mono text-xs">{b.razorpay_order_id ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Razorpay payment</dt>
              <dd className="font-mono text-xs">{b.razorpay_payment_id ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Refund recorded</dt>
              <dd>{b.refund_amount != null ? `₹${Number(b.refund_amount)}` : '—'}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Parties</h2>
          <p className="mt-2 text-sm">
            Seeker:{' '}
            <Link href={`/admin/users/${seeker?.id}`} className="text-sky-700 hover:underline">
              {seeker?.full_name}
            </Link>
          </p>
          <p className="text-sm">
            Owner:{' '}
            <Link href={`/admin/users/${spot?.owner_id}`} className="text-sky-700 hover:underline">
              {owner?.full_name}
            </Link>
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Spot (exact)</h2>
        {spot ? (
          <div className="mt-2 text-sm text-slate-700">
            <p className="font-medium text-slate-900">{spot.title}</p>
            <p>{spot.address_line}</p>
            <p className="text-slate-500">
              {spot.landmark} · {spot.pincode}
            </p>
          </div>
        ) : (
          <p className="text-slate-500">Missing</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Chat</h2>
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
          {(messages ?? []).map((m) => (
            <li key={m.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</span>
              <p className="text-slate-800">{m.content}</p>
            </li>
          ))}
          {(messages ?? []).length === 0 ? <li className="text-slate-500">No messages</li> : null}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Reviews</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {(reviews ?? []).map((r) => (
            <li key={r.id}>
              {r.rating}★ ({r.review_type}) {r.comment ? `— ${r.comment}` : ''}
            </li>
          ))}
          {(reviews ?? []).length === 0 ? <li className="text-slate-500">None</li> : null}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Dispute</h2>
        {dispute ? (
          <Link href={`/admin/disputes/${dispute.id}`} className="text-sky-700 hover:underline">
            Open dispute {String(dispute.id).slice(0, 8)}… ({dispute.status})
          </Link>
        ) : (
          <p className="text-slate-500">None</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Transactions</h2>
        <ul className="mt-2 text-sm">
          {(txs ?? []).map((t) => (
            <li key={t.id} className="flex justify-between border-b border-slate-100 py-1">
              <span>
                {t.type} · {t.status}
              </span>
              <span>₹{Number(t.amount)}</span>
            </li>
          ))}
          {(txs ?? []).length === 0 ? <li className="text-slate-500">None</li> : null}
        </ul>
      </section>
    </div>
  );
}
