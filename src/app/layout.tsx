import type { ReactNode } from 'react';
import './globals.css';

/**
 * The real <html>/<body> live here, but `lang` is per-locale and only known in
 * `[locale]/layout.tsx`. It is patched there via the `data-locale` handoff so
 * crawlers see a correct language on every page.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
