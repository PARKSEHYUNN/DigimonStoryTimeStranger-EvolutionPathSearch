/**
 * The locale facts, with no imports.
 *
 * Split out of routing.ts so a plain build script can read them: the root
 * language router (scripts/write-root-router.mjs) is generated from these
 * values, and importing routing.ts would drag next-intl into a bare node
 * process for three constants.
 *
 * Keeping them here is what stops the router from silently disagreeing with
 * the app — add a locale below and the generated router learns about it in
 * the same commit.
 */

export const LOCALES = ['en', 'ko', 'ja'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Where a reader goes when nothing else identifies them.
 *
 * English, not Korean, even though Korean is the site's main audience. This
 * value only ever applies to someone we could not match — a French or German
 * browser, a crawler with no language, a request with a bad locale segment.
 * Such a reader is far likelier to get by in English than in Korean, and
 * Korean speakers never reach this branch: their browser says `ko` and the
 * router sends them to /ko/ directly.
 *
 * It is also the x-default hreflang target (lib/seo.ts, app/sitemap.ts), which
 * has to agree with the above. x-default means "the page for readers no other
 * version suits" — the same population. Pointing the router at English while
 * telling Google that unmatched readers want Korean would be two answers to
 * one question.
 *
 * No URL depends on this. Every locale is prefixed, so /ko/ is /ko/ regardless
 * and the Korean search presence is carried by the ko hreflang, not by this.
 */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Each language named in itself, never translated.
 *
 * A reader looking for their own language scans for the word they recognise,
 * so "日本語" has to read as 日本語 on the Korean page too. Shared with the
 * generated root router, whose no-script fallback lists all three rather than
 * guessing on behalf of someone we have no signal for.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
};

/**
 * Where a reader's stated language choice is remembered.
 *
 * localStorage rather than a cookie. There is no server to read a cookie —
 * the site is a static export — so a cookie would be sent on every request to
 * be read by nobody. It also keeps this a purely functional preference that
 * never leaves the browser, which is what the privacy policy describes and
 * what keeps it out of consent-banner territory.
 */
export const LOCALE_STORAGE_KEY = 'locale';
