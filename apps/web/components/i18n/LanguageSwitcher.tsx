'use client';

import { useRouter } from 'next/navigation';

export function LanguageSwitcher({ locale }: { locale: 'en' | 'ta' }) {
  const router = useRouter();

  async function setLocale(next: 'en' | 'ta') {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        className={`rounded px-2 py-1 ${locale === 'en' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
        onClick={() => void setLocale('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`rounded px-2 py-1 ${locale === 'ta' ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
        onClick={() => void setLocale('ta')}
      >
        தமிழ்
      </button>
    </div>
  );
}
