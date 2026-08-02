import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RouteSearch } from '@/components/digimon/RouteSearch';
import { CLIENT_NAMESPACES, clientMessages } from '@/lib/i18n/messages';
import type { Locale } from '@/lib/i18n/routing';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations('evolution_path');

  return (
    <>
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
