import { routing, type Locale } from './i18n/routing';
import { SITE_URL } from './site';

/** Absolute URL for a locale-prefixed path. Trailing slash matches the export. */
export function localeUrl(locale: string, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `${SITE_URL}/${locale}/${clean}/` : `${SITE_URL}/${locale}/`;
}

/**
 * canonical + hreflang for one page across every locale.
 *
 * The old site emitted three hreflang tags that all pointed at `/`, which tells
 * a crawler the translations are the same document. Each variant now has its
 * own address.
 */
export function alternatesFor(locale: string, path = '') {
  return {
    canonical: localeUrl(locale, path),
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [l, localeUrl(l, path)]),
      ),
      'x-default': localeUrl(routing.defaultLocale, path),
    },
  };
}

/** Locales other than the given one, for og:locale:alternate. */
export function otherLocales(locale: string): Locale[] {
  return routing.locales.filter((l) => l !== locale);
}

/**
 * Renders a JSON-LD block.
 *
 * Kept as a plain script tag rather than a component library so the payload is
 * exactly what is written here — structured data that overstates what a page
 * contains is worse than none.
 */
export function jsonLdScript(data: unknown): string {
  // `<` is escaped so a name containing markup cannot close the script early.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
