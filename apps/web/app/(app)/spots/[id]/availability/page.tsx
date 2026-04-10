import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default async function AvailabilityPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: spot } = await supabase.from('spots').select('id, title, owner_id').eq('id', params.id).single();
  if (!spot || spot.owner_id !== user.id) {
    redirect('/dashboard');
  }

  const { data: rows } = await supabase.from('availability').select('*').eq('spot_id', params.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-sky-400">Availability</h1>
          <p className="mt-1 text-slate-400">{spot.title}</p>
        </div>
        <Link href={`/spots/${params.id}`} className="text-sm text-sky-400 hover:underline">
          Edit listing
        </Link>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Recurring rules stored per weekday. For live booking blocks and real-time updates, use the mobile app calendar.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Recurring</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No availability rows yet. Save pricing & availability from the edit form.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((r) => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="px-4 py-3">{r.day_of_week != null ? DAYS[r.day_of_week] : '—'}</td>
                  <td className="px-4 py-3">{String(r.start_time).slice(0, 5)}</td>
                  <td className="px-4 py-3">{String(r.end_time).slice(0, 5)}</td>
                  <td className="px-4 py-3">{r.is_recurring ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
