'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const KOFI_URL = 'https://ko-fi.com/mesbul';

/**
 * Floating Ko-fi link, held back for a few seconds so it does not compete with
 * the page for attention on arrival — same behaviour as the site it replaces.
 */
export function DonateButton() {
  const t = useTranslations('donate');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('label')}
      title={t('label')}
      className="animate-pop-in fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5E5B] text-white shadow-lg transition-transform hover:scale-110 sm:right-6 sm:bottom-6"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-6 w-6">
        <path d="M18 8h-1V6H3v8a5 5 0 0 0 5 5h4a5 5 0 0 0 4.9-4H18a3 3 0 0 0 0-6zm0 4h-2v-2h2a1 1 0 0 1 0 2z" />
        <path d="M20 2H4a1 1 0 0 0-.8 1.6L5 6h14l1.8-2.4A1 1 0 0 0 20 2z" />
      </svg>
    </a>
  );
}
