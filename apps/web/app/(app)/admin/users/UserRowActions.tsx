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
            void adminUpdateUserRole(userId, next).then(() => router.refresh());
          });
        }}
        className="rounded border border-border-token bg-bg-elevated px-2 py-1 text-xs text-txt-primary"
      >
        <option value="seeker">seeker</option>
        <option value="owner">owner</option>
        <option value="both">both</option>
        <option value="admin">admin</option>
      </select>
      <button
        type="button"
        disabled={pending}
        className="rounded bg-warning/15 px-2 py-1 text-xs font-medium text-warning hover:bg-warning/25"
        onClick={() => {
          if (!window.confirm('Reset strikes to 0?')) return;
          startTransition(() => {
            void adminResetStrikes(userId).then(() => router.refresh());
          });
        }}
      >
        Reset strikes
      </button>
      <button
        type="button"
        disabled={pending}
        className={`rounded px-2 py-1 text-xs font-medium ${
          isBanned ? 'bg-emerald/15 text-emerald hover:bg-emerald/25' : 'bg-danger/15 text-danger hover:bg-danger/25'
        }`}
        onClick={() => {
          const reason = window.prompt(isBanned ? 'Unban note (optional)' : 'Ban reason');
          if (reason === null) return;
          startTransition(() => {
            void adminSetBanned(userId, !isBanned, reason || null).then(() => router.refresh());
          });
        }}
      >
        {isBanned ? 'Unban' : 'Ban'}
      </button>
      <button
        type="button"
        disabled={pending}
        className="rounded border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/10"
        onClick={() => {
          if (!confirmDel) {
            setConfirmDel(true);
            return;
          }
          if (!window.confirm('Permanently delete this user? This cannot be undone.')) {
            setConfirmDel(false);
            return;
          }
          startTransition(() => {
            void adminDeleteUser(userId).then(() => router.refresh());
          });
        }}
      >
        {confirmDel ? 'Confirm delete' : 'Delete'}
      </button>
    </div>
  );
}
