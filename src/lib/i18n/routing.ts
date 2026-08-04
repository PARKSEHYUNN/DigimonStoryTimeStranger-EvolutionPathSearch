import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from './locales';

// Re-exported so callers keep importing locale facts from one place, even
// though they are declared in ./locales for the build scripts' benefit.
export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
} from './locales';
export type { Locale } from './locales';

/**
 * `localePrefix: 'always'` is deliberate. Every locale gets its own URL so the
 * three hreflang variants point at three distinct pages — the SPA this replaces
 * pointed all of them at `/`, which made the annotations useless to crawlers.
 *
 * There is no automatic locale detection here, and there cannot be: detection
 * needs middleware, and a static export has no server. It happens instead at
 * the bare root, which is the only URL that makes no language claim — see
 * scripts/write-root-router.mjs.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});
