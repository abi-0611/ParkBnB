'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { springs } from '@/lib/motion-variants';
import { cn } from '@/lib/utils';
import type { Lang } from '@/i18n/messages';

export function LanguageSwitcher({ locale }: { locale: Lang }) {
  const router = useRouter();

  async function setLocale(next: Lang) {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex items-center rounded-xl border border-border-token bg-bg-surface/60 p-0.5 backdrop-blur-sm">
      {(['en', 'ta'] as const).map((lang) => (
        <motion.button
          key={lang}
          type="button"
          onClick={() => void setLocale(lang)}
          className={cn(
            'relative rounded-[10px] px-2.5 py-1 text-xs font-semibold transition-colors duration-200 select-none',
            locale === lang ? 'text-white' : 'text-txt-muted hover:text-txt-secondary',
          )}
          whileTap={{ scale: 0.93 }}
          transition={springs.snappy}
        >
          {locale === lang && (
            <motion.span
              layoutId="lang-active-pill"
              className="absolute inset-0 rounded-[10px] bg-electric shadow-glow-xs"
              transition={springs.snappy}
            />
          )}
          <span className="relative z-10">{lang === 'en' ? 'EN' : 'தமிழ்'}</span>
        </motion.button>
      ))}
    </div>
  );
}
