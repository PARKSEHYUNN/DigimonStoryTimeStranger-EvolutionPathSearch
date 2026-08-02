import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { digimonById, itemById } from '@/lib/digimon/data';
import { digimonName, itemName } from '@/lib/digimon/display';
import {
  BOND_KEYS,
  STAT_KEYS,
  type Evolution,
} from '@/lib/digimon/schema';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { DigimonIcon } from './DigimonIcon';

/**
 * Server-rendered list of evolutions in or out of a Digimon.
 *
 * Deliberately not a client component: this is the indexable body content that
 * gives each of the 1,425 generated pages something real for a crawler to read.
 */
export async function EvolutionLinkList({
  evolutions,
  direction,
  locale,
}: {
  evolutions: Evolution[];
  direction: 'to' | 'from';
  locale: Locale;
}) {
  const t = await getTranslations();

  if (evolutions.length === 0) {
    return (
      <p className="text-sm text-content-muted">
        {direction === 'to'
          ? t('digimon_info.after_digimon_none')
          : t('digimon_info.before_digimon_none')}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {evolutions.map((evolution) => {
        const otherId = direction === 'to' ? evolution.to : evolution.from;
        const other = digimonById.get(otherId);
        if (!other) return null;

        const name = digimonName(other, locale);
        const { conditions } = evolution;
        const item = conditions.item ? itemById.get(conditions.item) : undefined;

        const requirements = [
          t('conditions.level', { value: conditions.rank }),
          ...STAT_KEYS.filter((k) => conditions[k] !== undefined).map((k) =>
            t('conditions.stat', { stat: t(`stats.${k}`), value: conditions[k]! }),
          ),
          ...BOND_KEYS.filter((k) => conditions[k] !== undefined).map((k) =>
            t('conditions.stat', { stat: t(`agent.${k}`), value: conditions[k]! }),
          ),
          ...(item ? [t('conditions.item', { item: itemName(item, locale) })] : []),
        ];

        return (
          <li key={`${evolution.from}-${evolution.to}`}>
            <Link
              href={`/digimon/${other.slug}`}
              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-sunken"
            >
              <DigimonIcon id={other.id} name={name} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-content">{name}</span>
                  {conditions.jogress && (
                    <span className="rounded-full bg-jogress/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-jogress">
                      {t('evolution_path.jogress')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-content-muted">
                  {requirements.join(' · ')}
                </p>
                {conditions.jogress && (
                  <p className="mt-0.5 text-xs text-jogress">
                    {conditions.jogress
                      .map((partner) => {
                        const p = digimonById.get(partner.id);
                        return t('conditions.jogress_partner', {
                          digimon: p ? digimonName(p, locale) : `#${partner.id}`,
                          personality: t(`personality.${partner.personality}`),
                        });
                      })
                      .join(' + ')}
                  </p>
                )}
              </div>
              <ArrowRight size={16} aria-hidden className="shrink-0 text-content-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
