import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RouteSearch } from '@/components/digimon/RouteSearch';
import { CLIENT_NAMESPACES, clientMessages } from '@/lib/i18n/messages';
import { jsonLdScript, localeUrl } from '@/lib/seo';
import type { Locale } from '@/lib/i18n/routing';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations('evolution_path');
  const meta = await getTranslations('meta');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': localeUrl(locale),
    name: meta('site_name'),
    description: meta('description'),
    inLanguage: locale,
    // No SearchAction: the route search is client-side with no shareable query
    // URL, and claiming one Google cannot follow would be a false signal.
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content">{t('heading')}</h1>
        <p className="mt-1 text-sm text-content-muted">{t('subheading')}</p>
      </div>
      <NextIntlClientProvider
        messages={await clientMessages(CLIENT_NAMESPACES.search)}
      >
        <RouteSearch />
      </NextIntlClientProvider>
    </>
  );
}
