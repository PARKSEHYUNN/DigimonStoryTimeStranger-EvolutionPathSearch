import type { MetadataRoute } from 'next';
import { digimons } from '@/lib/digimon/data';
import { routing } from '@/lib/i18n/routing';
import { localeUrl } from '@/lib/seo';

// Metadata routes are request handlers by default; `output: 'export'` needs
// them pinned to build time so the file is written into out/.
export const dynamic = 'force-static';

/**
 * Every URL the site has, with its translations declared inline.
 *
 * Replaces the hand-maintained sitemap.xml, which listed two URLs. Google reads
 * the `alternates.languages` entries as hreflang, so the sitemap carries the
 * same signal as the page head — belt and braces, and the recommended way to
 * declare alternates for a multilingual site.
 *
 * 1,428 URLs, well inside the 50,000-per-file limit.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languagesFor = (path: string) => ({
    ...Object.fromEntries(routing.locales.map((l) => [l, localeUrl(l, path)])),
    'x-default': localeUrl(routing.defaultLocale, path),
  });

  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' }[] =
    [
      { path: '', priority: 1, changeFrequency: 'weekly' },
      { path: 'digimon', priority: 0.8, changeFrequency: 'weekly' },
      ...digimons.map((d) => ({
        path: `digimon/${d.slug}`,
        priority: 0.6,
        changeFrequency: 'monthly' as const,
      })),
    ];

  // No `lastModified`. Stamping build time onto every URL would tell Google
  // all 1,431 pages changed on every deploy, which is both false and worse
  // than sending nothing — lastmod is only useful while it is trustworthy.
  // Wire it up per-Digimon if the data ever carries edit timestamps.
  return routing.locales.flatMap((locale) =>
    pages.map(({ path, priority, changeFrequency }) => ({
      url: localeUrl(locale, path),
      changeFrequency,
      priority,
      alternates: { languages: languagesFor(path) },
    })),
  );
}
