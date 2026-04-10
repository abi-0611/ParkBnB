'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { adminForceCancelBooking, adminOverrideBookingStatus } from '../actions';

const STATUSES = [
  'pending',
  'confirmed',
  'checked_in',
  'active',
  'completed',
  'cancelled_by_seeker',
  'cancelled_by_owner',
  'no_show',
  'disputed',
] as const;

export function BookingRowActions({ bookingId, currentStatus }: { bookingId: string; currentStatus: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          disabled={pending}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || status === currentStatus}
          className="rounded bg-slate-800 px-2 py-1 text-xs text-white disabled:opacity-40"
          onClick={() => {
            if (!window.confirm(`Set status to ${status}?`)) return;
            startTransition(() => {
              void adminOverrideBookingStatus(bookingId, status).then(() => router.refresh());
            });
          }}
        >
          Save status
        </button>
      </div>
      <button
        type="button"
        disabled={pending}
        className="w-fit rounded border border-rose-300 px-2 py-1 text-xs text-rose-800 hover:bg-rose-50"
        onClick={() => {
          const reason = window.prompt('Cancellation reason (required)');
          if (!reason) return;
          const refundStr = window.prompt('Refund amount (number, or empty for none)', '0');
          if (refundStr === null) return;
          const refundAmount = refundStr === '' ? null : parseFloat(refundStr);
          startTransition(() => {
            void adminForceCancelBooking(bookingId, {
              reason,
              refundAmount: refundAmount ?? null,
            }).then(() => router.refresh());
          });
        }}
      >
        Force cancel + refund
      </button>
    </div>
  );
}
