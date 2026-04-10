import { requireAdmin } from '@/lib/admin/require-admin';

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">Platform configuration placeholders.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Environment</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-700">
          <li>
            Service role key is server-only — used if you extend admin jobs to bypass RLS for batch operations.
          </li>
          <li>
            Schedule <code className="rounded bg-slate-100 px-1">detect-no-show</code> with{' '}
            <code className="rounded bg-slate-100 px-1">CRON_SECRET</code> for automated no-show handling.
          </li>
          <li>Enable Realtime replication for <code className="rounded bg-slate-100 px-1">messages</code> in Supabase.</li>
        </ul>
      </div>
    </div>
  );
}
