import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/lib/i18n/routing';
import { alternatesFor, localeUrl, otherLocales } from '@/lib/seo';
import { CONTACT_EMAIL, OG_LOCALE } from '@/lib/site';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Section order. Numbering is applied at render time rather than written into
 * the messages, so inserting a section does not mean renumbering three
 * translation files by hand.
 */
const SECTIONS = [
  'collect',
  'storage',
  'ads',
  'analytics',
  'bug_report',
  'third_parties',
  'retention',
  'rights',
  'children',
  'changes',
  'contact',
] as const;

/**
 * The last-updated date lives in `privacy.updated` in each message file,
 * already written out per locale, rather than being formatted here from one
 * constant through `Intl.DateTimeFormat`.
 *
 * That is not a style preference. The shipped fonts are subsets built from the
 * characters found in src/messages/ and data/ (scripts/lib/charset.mjs), so a
 * date rendered by Intl produces kanji — 年月日 — that the subsetter never saw
 * and the Japanese face cannot draw. Keeping the string in the messages keeps
 * the font pipeline's inputs complete.
 *
 * Update all three when the policy changes in a way that affects what the site
 * does with data.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });
  const meta = await getTranslations({ locale, namespace: 'meta' });
  const description = meta('privacy_description');

  return {
    title: t('title'),
    description,
    alternates: alternatesFor(locale, 'privacy'),
    openGraph: {
      type: 'article',
      title: t('title'),
      description,
      url: localeUrl(locale, 'privacy'),
      siteName: meta('site_name'),
      locale: OG_LOCALE[locale],
      alternateLocale: otherLocales(locale).map((l) => OG_LOCALE[l]!),
    },
    twitter: { card: 'summary', title: t('title'), description },
  };
}

// Split needs the capture group so the URLs survive into the result. Testing
// the pieces uses a separate expression on purpose: `.test()` on a /g regex
// advances lastIndex between calls and would skip every other match.
const URL_SPLIT = /(https?:\/\/[^\s,)]+)/g;
const IS_URL = /^https?:\/\//;

/**
 * Turns bare URLs in a translated paragraph into links.
 *
 * The alternative is rich-text tags in the messages, which would put markup
 * into all three translation files and make each opt-out URL something a
 * translator could break. Here the URL is ordinary prose and the linking is
 * mechanical.
 */
function linkify(text: string): ReactNode[] {
  return text.split(URL_SPLIT).map((part, i) =>
    IS_URL.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-2 hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations('privacy');

  return (
    <article className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-content text-xl font-bold">{t('title')}</h1>
        <p className="text-content-muted mt-1 text-xs">{t('updated')}</p>
      </header>

      <p className="text-content-muted mt-5 text-sm leading-relaxed">
        {t('intro')}
      </p>

      <div className="mt-8 flex flex-col gap-7">
        {SECTIONS.map((key, index) => (
          <section key={key}>
            <h2 className="text-content text-base font-semibold">
              {index + 1}. {t(`sections.${key}.title`)}
            </h2>
            <div className="mt-2 flex flex-col gap-2">
              {(t.raw(`sections.${key}.body`) as string[]).map(
                (paragraph, i) => (
                  <p
                    key={i}
                    className="text-content-muted text-sm leading-relaxed"
                  >
                    {linkify(paragraph)}
                  </p>
                ),
              )}
              {key === 'contact' && (
                <p className="text-sm">
                  {/* inline-block + padding: a bare 16px-tall link is below
                      the minimum tap target, same fix as the footer. */}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-accent inline-block py-1.5 underline underline-offset-2 hover:opacity-80"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
