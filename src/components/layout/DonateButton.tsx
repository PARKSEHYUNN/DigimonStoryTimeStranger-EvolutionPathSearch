'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const KOFI_URL = 'https://ko-fi.com/mesbul';

/**
 * Floating Ko-fi link, held back for a few seconds so it does not compete with
 * the page for attention on arrival — same behaviour as the site it replaces.
 *
 * The official symbol carries its own palette (dark outline, white cup, orange
 * heart) and is drawn for light backgrounds, so the button stays white in both
 * themes rather than tinting it with the brand red the placeholder used.
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
      className="animate-pop-in fixed right-4 bottom-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-transform hover:scale-110 sm:right-6 sm:bottom-6"
    >
      <img
        src="/icons/kofi_symbol.svg"
        alt=""
        aria-hidden
        width={28}
        height={23}
        className="h-[23px] w-7"
      />
    </a>
  );
}
