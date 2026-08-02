import { defineRouting } from 'next-intl/routing';

export const LOCALES = ['en', 'ko', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * `localePrefix: 'always'` is deliberate. Every locale gets its own URL so the
 * three hreflang variants point at three distinct pages — the SPA this replaces
 * pointed all of them at `/`, which made the annotations useless to crawlers.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'en',
  localePrefix: 'always',
});
