import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  digimonById,
  digimonBySlug,
  digimons,
  neighborsOf,
} from '@/lib/digimon/data';
import { digimonName, iconUrl } from '@/lib/digimon/display';
import { AdSlot } from '@/components/ads/AdSlot';
import { DigimonIcon } from '@/components/digimon/DigimonIcon';
import { EvolutionLinkList } from '@/components/digimon/EvolutionLinkList';
import { RaisingRoutes } from '@/components/digimon/RaisingRoutes';
import { NearestApex } from '@/components/digimon/NearestApex';
import { nearestApex, raisingRoutes } from '@/lib/digimon/detail-routes';
import { routing, type Locale } from '@/lib/i18n/routing';
import {
  alternatesFor,
  jsonLdScript,
  localeUrl,
  otherLocales,
} from '@/lib/seo';
import { OG_LOCALE, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  // 475 Digimon x 3 locales = 1,425 prerendered pages, each with its own URL.
  return routing.locales.flatMap((locale) =>
    digimons.map((digimon) => ({ locale, slug: digimon.slug })),
  );
}

/** Neighbouring Digimon names, so the SERP snippet says something concrete. */
async function describeRelations(id: number, locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'meta' });
  const { evolvesTo, evolvesFrom } = neighborsOf(id);

  const namesOf = (ids: number[]) =>
    ids
      .map((n) => digimonById.get(n))
      .filter((d) => d !== undefined)
      .map((d) => digimonName(d, locale));

  const from = namesOf(evolvesFrom.map((e) => e.from));
  const to = namesOf(evolvesTo.map((e) => e.to));

  const parts: string[] = [];
  if (from.length) parts.push(t('evolves_from', { names: from.join(', ') }));
  if (to.length) parts.push(t('evolves_into', { names: to.join(', ') }));

  return parts.length ? parts.join(' ') : t('no_relations');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const digimon = digimonBySlug.get(slug);
  if (!digimon) return {};

  const t = await getTranslations({ locale, namespace: 'meta' });
  const common = await getTranslations({ locale });
  const name = digimonName(digimon, locale as Locale);

  const title = t('digimon_title', { name });
  const description = t('digimon_description', {
    name,
    generation: common(`generation.${digimon.generation}`),
    attribute: common(`attribute.${digimon.attribute}`),
    relations: await describeRelations(digimon.id, locale as Locale),
  });

  const path = `digimon/${digimon.slug}`;
  const image = `${SITE_URL}${iconUrl(digimon.id)}`;

  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: {
      type: 'article',
      title,
      description,
      url: localeUrl(locale, path),
      siteName: t('site_name'),
      locale: OG_LOCALE[locale],
      alternateLocale: otherLocales(locale).map((l) => OG_LOCALE[l]!),
      // Square art, so the compact card suits it better than a wide banner.
      images: [{ url: image, width: 256, height: 256, alt: name }],
    },
    twitter: { card: 'summary', title, description, images: [image] },
  };
}

export default async function DigimonDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const digimon = digimonBySlug.get(slug);
  if (!digimon) notFound();

  const t = await getTranslations();
  const name = digimonName(digimon, locale as Locale);
  const { evolvesTo, evolvesFrom } = neighborsOf(digimon.id);
  const apexReach = nearestApex(digimon);

  const facts = [
    {
      label: t('digimon_info.generation'),
      value: t(`generation.${digimon.generation}`),
    },
    {
      label: t('digimon_info.attribute'),
      value: t(`attribute.${digimon.attribute}`),
    },
    {
      label: t('digimon_info.personality'),
      value: t(`personality.${digimon.personality}`),
    },
  ];

  // Describes exactly what the page holds: a named thing with an image, plus
  // the trail that got the reader here.
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemPage',
        '@id': localeUrl(locale, `digimon/${digimon.slug}`),
        name,
        inLanguage: locale,
        about: {
          '@type': 'Thing',
          name,
          image: `${SITE_URL}${iconUrl(digimon.id)}`,
          additionalProperty: facts.map((f) => ({
            '@type': 'PropertyValue',
            name: f.label,
            value: f.value,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: t('meta.breadcrumb_home'),
            item: localeUrl(locale),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: t('digimon_list.title'),
            item: localeUrl(locale, 'digimon'),
          },
          { '@type': 'ListItem', position: 3, name },
        ],
      },
    ],
  };

  return (
    <article className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />

      <header className="bg-surface-raised flex flex-col items-center gap-4 rounded-2xl p-4 text-center shadow-sm sm:flex-row sm:gap-5 sm:p-5 sm:text-left">
        <div className="shrink-0">
          <DigimonIcon
            id={digimon.id}
            name={name}
            size={112}
            variant="full"
            priority
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-content text-xl font-bold break-words">{name}</h1>
          <dl className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 sm:justify-start">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-1.5 text-sm">
                <dt className="text-content-muted">{fact.label}</dt>
                <dd className="text-content font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
          {digimon.dlc && (
            <span className="bg-accent/15 text-accent mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold">
              DLC
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-surface-raised rounded-2xl p-4 shadow-sm sm:p-5">
          <h2 className="text-content mb-3 text-sm font-semibold">
            {t('digimon_info.before_digimon')}
          </h2>
          <EvolutionLinkList
            evolutions={evolvesFrom}
            direction="from"
            locale={locale as Locale}
          />
        </section>

        <section className="bg-surface-raised rounded-2xl p-4 shadow-sm sm:p-5">
          <h2 className="text-content mb-3 text-sm font-semibold">
            {t('digimon_info.after_digimon')}
          </h2>
          <EvolutionLinkList
            evolutions={evolvesTo}
            direction="to"
            locale={locale as Locale}
          />
        </section>
      </div>

      <section className="bg-surface-raised rounded-2xl p-4 shadow-sm sm:p-5">
        <h2 className="text-content mb-3 text-sm font-semibold">
          {t('digimon_info.raising_heading', { name })}
        </h2>
        <RaisingRoutes
          routes={raisingRoutes(digimon)}
          target={name}
          locale={locale as Locale}
        />
      </section>

      {/* Dropped rather than shown empty. An Ultra with no Ultra next door has
          nothing to answer here, and a heading over "none" reads worse than the
          absence — see APEX_NEIGHBOUR_LIMIT. */}
      {apexReach.length > 0 && (
        <section className="bg-surface-raised rounded-2xl p-4 shadow-sm sm:p-5">
          <h2 className="text-content mb-3 text-sm font-semibold">
            {t('digimon_info.apex_heading')}
          </h2>
          <NearestApex
            reach={apexReach}
            from={name}
            locale={locale as Locale}
          />
        </section>
      )}

      <AdSlot placement="footer" />
    </article>
  );
}
