import { getTranslations } from 'next-intl/server';
import { digimonName } from '@/lib/digimon/display';
import type { ApexReach } from '@/lib/digimon/detail-routes';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { DigimonIcon } from './DigimonIcon';
import { evolutionRequirements, jogressPartners } from './requirements';

/**
 * The Ultra level Digimon this one reaches soonest, and what the last hop costs.
 *
 * Nearest, not reachable. Every Digimon in the game can eventually reach all
 * thirty, so a reachability list would print the same block on 475 pages —
 * duplicate content wearing the costume of content. The distances are what
 * differ.
 *
 * The step count alone was actively misleading, which is why the final hop's
 * requirements are here too. Agumon reaches Agumon (Bond of Bravery) in one
 * step, and that step wants agent level 8 and 3,630 attack — late-game
 * numbers that "1 step" reads as the opposite of. Jogress hides more still: a
 * one-step Omnimon needs a second Digimon raised alongside the first, with a
 * specific personality. Both facts were in the data all along.
 */
export async function NearestApex({
  reach,
  from,
  locale,
}: {
  reach: ApexReach[];
  from: string;
  locale: Locale;
}) {
  const t = await getTranslations({ locale });
  const info = await getTranslations({ locale, namespace: 'digimon_info' });

  if (reach.length === 0) {
    return <p className="text-content-muted text-sm">{info('apex_none')}</p>;
  }

  const entries = reach.map(({ digimon, hops, finalStep }) => ({
    digimon,
    hops,
    name: digimonName(digimon, locale),
    requirements: finalStep
      ? evolutionRequirements(finalStep, locale, t)
      : null,
    partners: finalStep ? jogressPartners(finalStep, locale, t) : [],
  }));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-content-muted text-xs leading-relaxed">
        {info('apex_intro', { name: from })}
      </p>

      <ul className="flex flex-col gap-1">
        {entries.map((entry) => (
          <li key={entry.digimon.id}>
            <Link
              href={`/digimon/${entry.digimon.slug}`}
              className="hover:bg-surface-sunken flex items-start gap-2.5 rounded-lg p-2 transition-colors"
            >
              <DigimonIcon id={entry.digimon.id} name={entry.name} size={40} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-content text-sm font-medium">
                    {entry.name}
                  </span>
                  {entry.partners.length > 0 && (
                    <span className="bg-jogress/15 text-jogress rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold">
                      {t('evolution_path.jogress')}
                    </span>
                  )}
                </div>

                {entry.requirements && (
                  <p className="text-content-muted mt-0.5 text-xs">
                    {entry.requirements.join(' · ')}
                  </p>
                )}

                {/* Own line and colour, matching EvolutionLinkList: a partner
                    is another Digimon to raise, not a number to reach. */}
                {entry.partners.length > 0 && (
                  <p className="text-jogress mt-0.5 text-xs">
                    {entry.partners.join(' + ')}
                  </p>
                )}
              </div>

              <span className="text-content-muted shrink-0 text-xs">
                {info('hops', { hops: entry.hops })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
