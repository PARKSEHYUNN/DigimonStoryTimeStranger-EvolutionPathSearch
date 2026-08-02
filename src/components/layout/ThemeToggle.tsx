'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * The `dark` class on <html> is the source of truth — the inline script in the
 * locale layout sets it before first paint, and this button flips it.
 *
 * Subscribing to that class rather than mirroring it into state means the icon
 * cannot drift out of sync, and there is no post-mount setState to make React
 * render twice.
 */
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
};

const isDark = () => document.documentElement.classList.contains('dark');

export function ThemeToggle({ label }: { label: string }) {
  // The server has no <html> to read, so it renders the light icon; the class
  // is already correct by the time hydration runs.
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // Private browsing; the choice just will not persist.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="cursor-pointer rounded-lg p-2 text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
