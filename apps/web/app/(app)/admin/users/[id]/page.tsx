import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const id = params.id;

  const { data: u, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error || !u) notFound();

  const [
    { data: vehicles },
    { data: bookingsSeeker },
    { data: reviewsGiven },
    { data: reviewsRecv },
    { data: disputesRaised },
    { data: disputesAgainst },
    { data: chatSample },
  ] = await Promise.all([
      supabase.from('vehicles').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('id, status, start_time, end_time, total_price, spot_id').eq('seeker_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('reviews').select('*').eq('reviewer_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('reviews').select('*').eq('reviewee_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('disputes').select('*').eq('raised_by', id).order('created_at', { ascending: false }),
      supabase.from('disputes').select('*').eq('against_user', id).order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select('id, booking_id, sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
        .order('created_at', { ascending: false })
        .limit(40),
    ]);

  const spotIds = Array.from(new Set((bookingsSeeker ?? []).map((b) => b.spot_id)));
  const { data: spots } = spotIds.length
    ? await supabase.from('spots').select('id, title').in('id', spotIds)
    : { data: [] };

  const { data: mySpots } = await supabase.from('spots').select('id').eq('owner_id', id);
  const mySpotIds = (mySpots ?? []).map((s) => s.id);
  const { data: ownerBookings } =
    mySpotIds.length === 0
      ? { data: [] }
      : await supabase
          .from('bookings')
          .select('id, status, start_time, seeker_id, spot_id, total_price')
          .in('spot_id', mySpotIds)
          .order('created_at', { ascending: false })
          .limit(50);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/users" className="text-sm text-sky-700 hover:underline">
            ← Users
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{u.full_name}</h1>
          <p className="text-sm text-slate-600">{u.email}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
          <p>
            Role: <strong>{u.role}</strong>
          </p>
          <p>
            KYC: <strong>{u.kyc_status}</strong> · Strikes:{' '}
            <strong className={Number(u.strike_count) >= 3 ? 'text-rose-600' : ''}>{u.strike_count}</strong>
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">KYC & documents</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {[
            ['Aadhaar / ID', u.aadhaar_doc_url],
            ['Selfie', u.selfie_url],
            ['Property proof', u.property_proof_url],
          ].map(([label, url]) => (
            <div key={String(label)}>
              <p className="text-xs text-slate-500">{label}</p>
              {url ? (
                <a href={String(url)} target="_blank" rel="noreferrer" className="text-sm text-sky-700 hover:underline">
                  Open
                </a>
              ) : (
                <p className="text-sm text-slate-400">—</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Vehicles</h2>
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {(vehicles ?? []).length === 0 ? (
            <li className="py-2 text-slate-500">None</li>
          ) : (
            (vehicles ?? []).map((v) => (
              <li key={v.id} className="flex justify-between py-2">
                <span>
                  {v.vehicle_type} · {v.number_plate}
                </span>
                {v.rc_doc_url ? (
                  <a href={v.rc_doc_url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                    RC
                  </a>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Bookings (as seeker)</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="py-2">ID</th>
                <th className="py-2">Spot</th>
                <th className="py-2">Status</th>
                <th className="py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {(bookingsSeeker ?? []).map((b) => (
                <tr key={b.id} className="border-b border-slate-100">
                  <td className="py-2">
                    <Link href={`/admin/bookings/${b.id}`} className="text-sky-700 hover:underline">
                      {String(b.id).slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="py-2">{spots?.find((s) => s.id === b.spot_id)?.title ?? '—'}</td>
                  <td className="py-2">{b.status}</td>
                  <td className="py-2 text-slate-600">{new Date(b.start_time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Bookings (owner spots)</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="py-2">Booking</th>
                <th className="py-2">Status</th>
                <th className="py-2">Start</th>
              </tr>
            </thead>
            <tbody>
              {(ownerBookings ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 text-slate-500">
                    None
                  </td>
                </tr>
              ) : (
                (ownerBookings ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-slate-100">
                    <td className="py-2">
                      <Link href={`/admin/bookings/${b.id}`} className="text-sky-700 hover:underline">
                        {String(b.id).slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-2">{b.status}</td>
                    <td className="py-2 text-slate-600">{new Date(b.start_time).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Reviews given</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {(reviewsGiven ?? []).map((r) => (
              <li key={r.id} className="border-b border-slate-100 pb-2">
                {r.rating}★ · {r.review_type}
                {r.comment ? <span className="text-slate-600"> — {r.comment}</span> : null}
              </li>
            ))}
            {(reviewsGiven ?? []).length === 0 ? <p className="text-slate-500">None</p> : null}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Reviews received</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {(reviewsRecv ?? []).map((r) => (
              <li key={r.id} className="border-b border-slate-100 pb-2">
                {r.rating}★ · {r.review_type}
                {r.comment ? <span className="text-slate-600"> — {r.comment}</span> : null}
              </li>
            ))}
            {(reviewsRecv ?? []).length === 0 ? <p className="text-slate-500">None</p> : null}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Chat (read-only sample)</h2>
        <p className="text-xs text-slate-500">Latest messages across bookings involving this user.</p>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
          {(chatSample ?? []).map((m) => (
            <li key={m.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex flex-wrap justify-between gap-1 text-xs text-slate-500">
                <Link href={`/admin/bookings/${m.booking_id}`} className="text-sky-700 hover:underline">
                  Booking {String(m.booking_id).slice(0, 8)}…
                </Link>
                <span>{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-slate-800">{m.content}</p>
            </li>
          ))}
          {(chatSample ?? []).length === 0 ? <li className="text-slate-500">No messages</li> : null}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Disputes</h2>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-slate-500">Raised</p>
            <ul className="mt-1 space-y-1 text-sm">
              {(disputesRaised ?? []).map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/disputes/${d.id}`} className="text-sky-700 hover:underline">
                    {String(d.id).slice(0, 8)}… — {d.status}
                  </Link>
                </li>
              ))}
              {(disputesRaised ?? []).length === 0 ? <p className="text-slate-500">None</p> : null}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Against</p>
            <ul className="mt-1 space-y-1 text-sm">
              {(disputesAgainst ?? []).map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/disputes/${d.id}`} className="text-sky-700 hover:underline">
                    {String(d.id).slice(0, 8)}… — {d.status}
                  </Link>
                </li>
              ))}
              {(disputesAgainst ?? []).length === 0 ? <p className="text-slate-500">None</p> : null}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
