'use client';

import { useLocale } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { Check, Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { LOCALES, type Locale } from '@/lib/i18n/routing';

const LABELS: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
};

export function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const switchTo = (next: Locale) => {
    setOpen(false);
    // `usePathname` returns the path with the locale segment stripped and
    // dynamic segments already filled in, so switching language keeps the
    // reader on the same page instead of dropping them home.
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg p-2 text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
      >
        <Globe size={18} />
        <span className="text-sm font-medium uppercase">{locale}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-36 overflow-hidden rounded-lg border border-border-subtle bg-surface-raised py-1 shadow-lg"
        >
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => switchTo(l)}
                className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm text-content transition-colors hover:bg-surface-sunken"
              >
                {LABELS[l]}
                {l === locale && <Check size={14} className="text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
