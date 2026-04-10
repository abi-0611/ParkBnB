'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { adminResolveDispute } from '../actions';

export function DisputeResolveForm({
  disputeId,
  raiserId,
  otherId,
}: {
  disputeId: string;
  raiserId: string;
  otherId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<'resolved_for_raiser' | 'resolved_for_other' | 'dismissed'>('dismissed');
  const [notes, setNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [strikeTarget, setStrikeTarget] = useState<'none' | 'raiser' | 'other'>('none');

  return (
    <form
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const strikeUserId = strikeTarget === 'raiser' ? raiserId : strikeTarget === 'other' ? otherId : null;

        startTransition(() => {
          void adminResolveDispute(disputeId, {
            status,
            adminNotes: notes,
            resolution,
            strikeUserId,
          }).then(() => router.refresh());
        });
      }}
    >
      <h2 className="text-sm font-semibold text-slate-900">Resolution</h2>
      <label className="block text-xs font-medium text-slate-600">Outcome</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof status)}
        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="resolved_for_raiser">Resolved in favor of raiser</option>
        <option value="resolved_for_other">Resolved in favor of other party</option>
        <option value="dismissed">Dismissed</option>
      </select>
      <label className="block text-xs font-medium text-slate-600">Admin notes (internal)</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <label className="block text-xs font-medium text-slate-600">Resolution summary (shared)</label>
      <textarea
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        placeholder="Outcome visible to parties (notifications not wired)"
      />
      <div>
        <label className="block text-xs font-medium text-slate-600">Optional strike (+1)</label>
        <select
          value={strikeTarget}
          onChange={(e) => setStrikeTarget(e.target.value as typeof strikeTarget)}
          className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="none">No strike</option>
          <option value="raiser">Strike raiser</option>
          <option value="other">Strike other party</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Resolve dispute'}
      </button>
    </form>
  );
}
