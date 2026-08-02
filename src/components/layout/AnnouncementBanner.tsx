'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Megaphone, X } from 'lucide-react';

/**
 * Bump this whenever the announcement text changes — it is what makes a new
 * notice reappear for readers who dismissed the previous one.
 */
const ANNOUNCEMENT_ID = '2026-dlc-2-3';
const STORAGE_KEY = 'announcement-dismissed';

/**
 * Dismissal lives in localStorage, which React cannot see. Reading it through
 * a store rather than an effect keeps the component to a single render and
 * gives the server a defined answer.
 */
const listeners = new Set<() => void>();

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
};

/** Holds the dismissal when localStorage refuses to, so the X still works. */
let dismissedInSession: string | null = null;

const dismissedId = (): string | null => {
  if (dismissedInSession !== null) return dismissedInSession;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing: treat it as never dismissed.
    return null;
  }
};

export function AnnouncementBanner() {
  const t = useTranslations('announcement');

  // The server snapshot reports it as already dismissed, so the banner is
  // absent from the HTML and the first client paint. A notice that flashes in
  // and out on every load is worse than one that arrives a frame late.
  const dismissed = useSyncExternalStore(
    subscribe,
    dismissedId,
    () => ANNOUNCEMENT_ID,
  );

  if (dismissed === ANNOUNCEMENT_ID) return null;

  const dismiss = () => {
    dismissedInSession = ANNOUNCEMENT_ID;
    try {
      localStorage.setItem(STORAGE_KEY, ANNOUNCEMENT_ID);
    } catch {
      // Private browsing: the notice will come back next visit.
    }
    for (const listener of listeners) listener();
  };

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
