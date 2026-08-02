import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { digimonBySlug, digimons, neighborsOf } from '@/lib/digimon/data';
import { digimonName } from '@/lib/digimon/display';
import { AdSlot } from '@/components/ads/AdSlot';
import { DigimonIcon } from '@/components/digimon/DigimonIcon';
import { EvolutionLinkList } from '@/components/digimon/EvolutionLinkList';
import { routing, type Locale } from '@/lib/i18n/routing';

export function generateStaticParams() {
  // 475 Digimon x 3 locales = 1,425 prerendered pages, each with its own URL.
  return routing.locales.flatMap((locale) =>
    digimons.map((digimon) => ({ locale, slug: digimon.slug })),
  );
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

  const facts = [
    { label: t('digimon_info.generation'), value: t(`generation.${digimon.generation}`) },
    { label: t('digimon_info.attribute'), value: t(`attribute.${digimon.attribute}`) },
    { label: t('digimon_info.personality'), value: t(`personality.${digimon.personality}`) },
  ];

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-4 rounded-2xl bg-surface-raised p-4 text-center shadow-sm sm:flex-row sm:gap-5 sm:p-5 sm:text-left">
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
          <h1 className="text-xl font-bold break-words text-content">{name}</h1>
          <dl className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 sm:justify-start">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-1.5 text-sm">
                <dt className="text-content-muted">{fact.label}</dt>
                <dd className="font-medium text-content">{fact.value}</dd>
              </div>
            ))}
          </dl>
          {digimon.dlc && (
            <span className="mt-2 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
              DLC
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-surface-raised p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-content">
            {t('digimon_info.before_digimon')}
          </h2>
          <EvolutionLinkList
            evolutions={evolvesFrom}
            direction="from"
            locale={locale as Locale}
          />
        </section>

        <section className="rounded-2xl bg-surface-raised p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-content">
            {t('digimon_info.after_digimon')}
          </h2>
          <EvolutionLinkList
            evolutions={evolvesTo}
            direction="to"
            locale={locale as Locale}
          />
        </section>
      </div>

      <AdSlot placement="footer" />
    </article>
  );
}
