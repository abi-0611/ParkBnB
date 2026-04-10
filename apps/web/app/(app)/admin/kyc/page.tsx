import Link from 'next/link';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/require-admin';

import { KycActions } from './KycActions';

export default async function AdminKycPage() {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { data: queue } = await supabase
    .from('users')
    .select('id, full_name, email, role, kyc_status, aadhaar_doc_url, selfie_url, property_proof_url, updated_at, created_at')
    .eq('kyc_status', 'submitted')
    .order('updated_at', { ascending: true });

  const { count: pendingCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('kyc_status', 'submitted');

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('kyc_status', 'verified')
    .gte('updated_at', startOfDay.toISOString());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">KYC review</h1>
        <p className="text-sm text-slate-600">Queue: submitted applications (oldest first).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{pendingCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Verified today</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{todayCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Avg review time</p>
          <p className="mt-1 text-sm text-slate-600">Compute from audit logs (not wired)</p>
        </div>
      </div>

      <div className="space-y-6">
        {(queue ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600">No pending KYC submissions.</p>
        ) : (
          (queue ?? []).map((u) => (
            <article key={u.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link href={`/admin/users/${u.id}`} className="text-lg font-semibold text-sky-800 hover:underline">
                    {u.full_name}
                  </Link>
                  <p className="text-sm text-slate-600">
                    {u.email} · {u.role} · updated {new Date(u.updated_at).toLocaleString()}
                  </p>
                </div>
                <KycActions userId={u.id} />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  ['Document', u.aadhaar_doc_url],
                  ['Selfie', u.selfie_url],
                  ['Property / extra', u.property_proof_url],
                ].map(([label, url]) => (
                  <div key={String(label)} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    {url ? (
                      <a href={String(url)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-sky-700 hover:underline">
                        Open full size
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">Missing</p>
                    )}
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={String(url)} alt="" className="mt-2 max-h-40 w-full rounded object-contain" />
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
