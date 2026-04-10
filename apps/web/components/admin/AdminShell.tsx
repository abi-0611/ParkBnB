'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { SignOutButton } from '@/components/SignOutButton';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/spots', label: 'Spots' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/disputes', label: 'Disputes' },
  { href: '/admin/kyc', label: 'KYC Review' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/settings', label: 'Settings' },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label }) => {
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  displayName,
  email,
  children,
}: {
  displayName: string;
  email: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-800 bg-[#1E293B] md:flex">
        <div className="border-b border-slate-700 px-4 py-5">
          <Link href="/admin" className="text-lg font-semibold tracking-tight text-white">
            ParkNear Admin
          </Link>
          <p className="mt-1 text-xs text-slate-400">Operations</p>
        </div>
        <div className="flex flex-1 flex-col p-3">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex min-h-screen flex-1 flex-col md:min-h-0">
        <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 md:hidden">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            Menu
          </button>
          <span className="truncate text-center text-sm font-semibold text-slate-800">ParkNear Admin</span>
          <div className="shrink-0">
            <SignOutButton className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50" />
          </div>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[#1E293B] shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 px-4 py-4">
                <span className="font-semibold text-white">Menu</span>
                <button type="button" className="text-slate-400 hover:text-white" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>
        )}

        <header className="hidden items-center justify-end border-b border-slate-200 bg-white px-6 py-4 md:flex">
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium text-slate-900">{displayName}</p>
              <p className="text-slate-500">{email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <SignOutButton className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
