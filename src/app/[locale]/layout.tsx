import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/lib/i18n/routing';
import { OG_LOCALE, SITE_URL } from '@/lib/site';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CLIENT_NAMESPACES, clientMessages } from '@/lib/i18n/messages';
import { AdSlot } from '@/components/ads/AdSlot';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: 'meta' });

  // Every locale advertises all three variants at their own distinct URLs.
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${SITE_URL}/${l}/`]),
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: `%s | ${t('site_name')}` },
    description: t('description'),
    alternates: {
      canonical: `${SITE_URL}/${locale}/`,
      languages: {
        ...languages,
        'x-default': `${SITE_URL}/${routing.defaultLocale}/`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: t('site_name'),
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}/`,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]!),
    },
    twitter: {
      card: 'summary',
      title: t('title'),
      description: t('description'),
    },
  };
}

/** Applies the stored theme before first paint so dark mode never flashes. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Required for static rendering — without it the tree opts into dynamic
  // rendering and `output: 'export'` fails.
  setRequestLocale(locale as Locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        {/* Only the chrome's namespaces. Screens add their own below. */}
        <NextIntlClientProvider
          messages={await clientMessages(CLIENT_NAMESPACES.chrome)}
        >
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 sm:px-4 sm:py-6">
            <AdSlot placement="leaderboard" />
            <div className="mt-5 sm:mt-6">{children}</div>
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
