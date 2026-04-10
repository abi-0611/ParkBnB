'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  adminDeleteUser,
  adminResetStrikes,
  adminSetBanned,
  adminUpdateUserRole,
} from '../actions';

export function UserRowActions({
  userId,
  currentRole,
  isBanned,
}: {
  userId: string;
  currentRole: string;
  isBanned: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState(currentRole);
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={role}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          if (!window.confirm(`Change role to ${next}?`)) {
            setRole(currentRole);
            return;
          }
          setRole(next);
          startTransition(() => {
            adminUpdateUserRole(userId, next).then(() => router.refresh());
          });
        }}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
      >
        <option value="seeker">seeker</option>
        <option value="owner">owner</option>
        <option value="both">both</option>
        <option value="admin">admin</option>
      </select>
      <button
        type="button"
        disabled={pending}
        className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200"
        onClick={() => {
          if (!window.confirm('Reset strikes to 0?')) return;
          startTransition(() => adminResetStrikes(userId).then(() => router.refresh()));
        }}
      >
        Reset strikes
      </button>
      <button
        type="button"
        disabled={pending}
        className={`rounded px-2 py-1 text-xs font-medium ${
          isBanned ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200' : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
        }`}
        onClick={() => {
          const reason = window.prompt(isBanned ? 'Unban note (optional)' : 'Ban reason');
          if (reason === null) return;
          startTransition(() =>
            adminSetBanned(userId, !isBanned, reason || null).then(() => router.refresh())
          );
        }}
      >
        {isBanned ? 'Unban' : 'Ban'}
      </button>
      <button
        type="button"
        disabled={pending}
        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-800 hover:bg-rose-50"
        onClick={() => {
          if (!confirmDel) {
            setConfirmDel(true);
            return;
          }
          if (!window.confirm('Permanently delete this user? This cannot be undone.')) {
            setConfirmDel(false);
            return;
          }
          startTransition(() => adminDeleteUser(userId).then(() => router.refresh()));
        }}
      >
        {confirmDel ? 'Confirm delete' : 'Delete'}
      </button>
    </div>
  );
}
