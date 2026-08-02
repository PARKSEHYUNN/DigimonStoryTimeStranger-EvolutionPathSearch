import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DigimonListView } from '@/components/digimon/DigimonListView';
import { CLIENT_NAMESPACES, clientMessages } from '@/lib/i18n/messages';
import { routing, type Locale } from '@/lib/i18n/routing';
import { SITE_URL } from '@/lib/site';

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

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/digimon/`,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((l) => [l, `${SITE_URL}/${l}/digimon/`]),
        ),
        'x-default': `${SITE_URL}/${routing.defaultLocale}/digimon/`,
      },
    },
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

  return (
    <>
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
