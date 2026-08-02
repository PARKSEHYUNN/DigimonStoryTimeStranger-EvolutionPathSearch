'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Megaphone, X } from 'lucide-react';

/**
 * Bump this whenever the announcement text changes — it is what makes a new
 * notice reappear for readers who dismissed the previous one.
 */
const ANNOUNCEMENT_ID = '2026-dlc-2-3';
const STORAGE_KEY = 'announcement-dismissed';

export function AnnouncementBanner() {
  const t = useTranslations('announcement');
  // Starts hidden so the server HTML and the first client paint agree; a
  // banner that flashes in and out on every load is worse than a late one.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== ANNOUNCEMENT_ID);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, ANNOUNCEMENT_ID);
    } catch {
      // Private browsing: the notice will come back next visit.
    }
  };

  if (!visible) return null;

  return (
    <div className="border-b border-accent/20 bg-accent/10">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
        <Megaphone size={15} aria-hidden className="shrink-0 text-accent" />
        <p className="min-w-0 flex-1 text-xs font-medium text-content sm:text-sm">
          {t('message')}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('dismiss')}
          className="-mr-1 shrink-0 cursor-pointer rounded p-1.5 text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
