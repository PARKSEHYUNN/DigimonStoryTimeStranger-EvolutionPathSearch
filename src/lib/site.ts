/**
 * The canonical origin, and the only place it is written down.
 *
 * Everything crawler-facing derives from this: canonical links, hreflang,
 * Open Graph URLs, the sitemap's 1,434 entries and the sitemap line in
 * robots.txt. It must be the address that actually serves pages, not one that
 * redirects to it — a canonical or hreflang pointing at a redirect is a
 * self-defeating signal, and a sitemap full of them reports as "Page with
 * redirect" in Search Console.
 *
 * The site moved to the apex; `search.digimonts.my` now redirects here.
 */
export const SITE_URL = 'https://digimonts.my';

/**
 * Who runs the site, and where to reach them.
 *
 * Shared rather than repeated because the privacy policy has to name the same
 * address the footer offers — a policy that points somewhere unanswered is
 * worse than no policy.
 */
export const AUTHOR = 'Mesbul';
export const CONTACT_EMAIL = 'kmesbul@gmail.com';

export const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  ko: 'ko_KR',
  ja: 'ja_JP',
};
