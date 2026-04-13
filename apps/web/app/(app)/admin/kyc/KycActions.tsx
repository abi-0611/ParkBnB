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
        className="rounded-lg bg-emerald px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald/90 disabled:opacity-50"
        onClick={() => {
          if (!window.confirm('Approve KYC for this user?')) return;
          startTransition(() => {
            void adminSetKyc(userId, 'verified').then(() => router.refresh());
          });
        }}
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        className="rounded-lg border border-danger/30 bg-bg-surface px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
        onClick={() => {
          const reason = window.prompt('Rejection reason (shown internally)');
          if (reason === null) return;
          startTransition(() => {
            void adminSetKyc(userId, 'rejected', reason).then(() => router.refresh());
          });
        }}
      >
        Reject
      </button>
    </div>
  );
}
