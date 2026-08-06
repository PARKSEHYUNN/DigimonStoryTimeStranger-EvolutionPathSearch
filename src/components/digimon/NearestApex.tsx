import { getTranslations } from 'next-intl/server';
import { digimonName } from '@/lib/digimon/display';
import type { ApexReach } from '@/lib/digimon/detail-routes';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { DigimonIcon } from './DigimonIcon';

/**
 * The Ultra level Digimon this one reaches soonest.
 *
 * Nearest, not reachable. Every Digimon in the game can eventually reach all
 * thirty, so a reachability list would print the same block on 475 pages —
 * duplicate content wearing the costume of content. The distances are what
 * differ, and they are what a player weighing a raising plan actually wants.
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
  const t = await getTranslations({ locale, namespace: 'digimon_info' });

  if (reach.length === 0) {
    return <p className="text-content-muted text-sm">{t('apex_none')}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-content-muted text-xs leading-relaxed">
        {t('apex_intro', { name: from })}
      </p>

      <ul className="flex flex-col gap-1">
        {reach.map(({ digimon, hops }) => {
          const name = digimonName(digimon, locale);
          return (
            <li key={digimon.id}>
              <Link
                href={`/digimon/${digimon.slug}`}
                className="hover:bg-surface-sunken flex items-center gap-2.5 rounded-lg p-1.5 transition-colors"
              >
                <DigimonIcon id={digimon.id} name={name} size={36} />
                <span className="text-content min-w-0 flex-1 truncate text-sm font-medium">
                  {name}
                </span>
                <span className="text-content-muted shrink-0 text-xs">
                  {t('hops', { hops })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
