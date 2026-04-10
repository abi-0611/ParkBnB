'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { adminDeleteSpot, adminSetSpotActive, adminSetSpotFeatured } from '../actions';

export function SpotRowActions({
  spotId,
  isActive,
  isFeatured,
}: {
  spotId: string;
  isActive: boolean;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
        onClick={() =>
          startTransition(() => {
            void adminSetSpotActive(spotId, !isActive).then(() => router.refresh());
          })
        }
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button
        type="button"
        disabled={pending}
        className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-900 hover:bg-amber-50"
        onClick={() =>
          startTransition(() => {
            void adminSetSpotFeatured(spotId, !isFeatured).then(() => router.refresh());
          })
        }
      >
        {isFeatured ? 'Unfeature' : 'Feature'}
      </button>
      <Link href={`/admin/bookings?spot=${spotId}`} className="rounded border border-sky-300 px-2 py-1 text-xs text-sky-800 hover:bg-sky-50">
        Bookings
      </Link>
      <button
        type="button"
        disabled={pending}
        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-800 hover:bg-rose-50"
        onClick={() => {
          if (!window.confirm('Delete this spot? Active bookings may be affected.')) return;
          startTransition(() => {
            void adminDeleteSpot(spotId).then(() => router.refresh());
          });
        }}
      >
        Delete
      </button>
    </div>
  );
}
