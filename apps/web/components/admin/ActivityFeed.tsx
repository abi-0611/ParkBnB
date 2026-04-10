'use client';

import type { ActivityItem } from '@parknear/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function icon(kind: ActivityItem['kind']) {
  switch (kind) {
    case 'dispute':
      return '⚖️';
    case 'kyc':
      return '🪪';
    case 'cancel':
      return '✕';
    default:
      return '📅';
  }
}

export function ActivityFeed({ initial }: { initial: ActivityItem[] }) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/activity');
        if (!res.ok) return;
        const json = (await res.json()) as { activity: ActivityItem[] };
        setItems(json.activity);
      } catch {
        /* ignore */
      }
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {items.length === 0 ? (
        <li className="px-4 py-8 text-center text-sm text-slate-500">No recent activity.</li>
      ) : (
        items.map((a) => (
          <li key={a.id}>
            <Link
              href={a.href}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <span className="text-lg" aria-hidden>
                {icon(a.kind)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-900">{a.label}</p>
                <p className="text-xs text-slate-500">{new Date(a.at).toLocaleString()}</p>
              </div>
            </Link>
          </li>
        ))
      )}
    </ul>
  );
}
