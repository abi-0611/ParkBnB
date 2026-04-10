'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { adminSetKyc } from '../actions';

export function KycActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        onClick={() => {
          if (!window.confirm('Approve KYC for this user?')) return;
          startTransition(() => adminSetKyc(userId, 'verified').then(() => router.refresh()));
        }}
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
        onClick={() => {
          const reason = window.prompt('Rejection reason (shown internally)');
          if (reason === null) return;
          startTransition(() => adminSetKyc(userId, 'rejected', reason).then(() => router.refresh()));
        }}
      >
        Reject
      </button>
    </div>
  );
}
