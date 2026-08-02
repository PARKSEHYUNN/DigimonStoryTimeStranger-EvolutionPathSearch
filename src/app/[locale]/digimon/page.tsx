import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DigimonListView } from '@/components/digimon/DigimonListView';
import { CLIENT_NAMESPACES, clientMessages } from '@/lib/i18n/messages';
import { routing, type Locale } from '@/lib/i18n/routing';
import {
  alternatesFor,
  jsonLdScript,
  localeUrl,
  otherLocales,
} from '@/lib/seo';
import { OG_LOCALE } from '@/lib/site';
import { digimons } from '@/lib/digimon/data';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'digimon_list' });

  const meta = await getTranslations({ locale, namespace: 'meta' });
  const description = meta('list_description');

  return {
    title: t('title'),
    description,
    alternates: alternatesFor(locale, 'digimon'),
    openGraph: {
      type: 'website',
      title: t('title'),
      description,
      url: localeUrl(locale, 'digimon'),
      siteName: meta('site_name'),
      locale: OG_LOCALE[locale],
      alternateLocale: otherLocales(locale).map((l) => OG_LOCALE[l]!),
    },
    twitter: { card: 'summary', title: t('title'), description },
  };
}

export default async function DigimonListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations('digimon_list');
  const meta = await getTranslations('meta');

  // A collection page whose size is stated rather than enumerated — listing
  // 475 entries here would bloat every page for no extra signal.
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': localeUrl(locale, 'digimon'),
        name: t('title'),
        description: meta('list_description'),
        inLanguage: locale,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: digimons.length,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: meta('breadcrumb_home'),
            item: localeUrl(locale),
          },
          { '@type': 'ListItem', position: 2, name: t('title') },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content">{t('title')}</h1>
        <p className="mt-1 text-sm text-content-muted">{t('description')}</p>
      </div>
      <NextIntlClientProvider
        messages={await clientMessages(CLIENT_NAMESPACES.browser)}
      >
        <DigimonListView />
      </NextIntlClientProvider>
    </>
  );
}
