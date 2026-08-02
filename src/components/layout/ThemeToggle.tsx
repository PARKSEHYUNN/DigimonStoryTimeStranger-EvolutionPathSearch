'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * The initial class is applied by the inline script in the locale layout, so
 * this only has to stay in sync with whatever that decided.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
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
