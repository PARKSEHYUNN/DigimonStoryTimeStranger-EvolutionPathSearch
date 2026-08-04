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
 * Korean is the primary audience the legacy site served: it shipped
 * `<html lang="ko">` with Korean-first metadata. Keeping it as the default
 * means the existing search presence carries over to the new URLs.
 */
export const DEFAULT_LOCALE: Locale = 'ko';

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
