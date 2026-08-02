'use client';

import { useLocale, useTranslations } from 'next-intl';
import { digimonById, itemById } from '@/lib/digimon/data';
import { digimonName, itemName } from '@/lib/digimon/display';
import {
  BOND_KEYS,
  STAT_KEYS,
  type EvolutionConditions as Conditions,
} from '@/lib/digimon/schema';
import type { Locale } from '@/lib/i18n/routing';

/**
 * Renders every requirement on an evolution.
 *
 * The legacy arrow only surfaced the Jogress partners; level, stats, bonds and
 * items were carried in the data but never shown on the route.
 */
export function EvolutionConditions({
  conditions,
  reversed,
}: {
  conditions: Conditions;
  reversed: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  // Walking the edge backwards is a de-evolution; the forward requirements
  // are not what the player has to satisfy.
  if (reversed) return null;

  const stats = STAT_KEYS.filter((k) => conditions[k] !== undefined);
  const bonds = BOND_KEYS.filter((k) => conditions[k] !== undefined);
  const item = conditions.item ? itemById.get(conditions.item) : undefined;

  return (
    <ul className="flex flex-col items-center gap-0.5 text-[0.65rem] leading-tight">
      <li className="font-semibold text-content">
        {t('conditions.level', { value: conditions.rank })}
      </li>

      {stats.map((key) => (
        <li key={key} className="text-content-muted">
          {t('conditions.stat', {
            stat: t(`stats.${key}`),
            value: conditions[key]!,
          })}
        </li>
      ))}

      {bonds.map((key) => (
        <li key={key} className="text-content-muted">
          {t('conditions.stat', {
            stat: t(`agent.${key}`),
            value: conditions[key]!,
          })}
        </li>
      ))}

      {item && (
        <li className="text-accent">
          {t('conditions.item', { item: itemName(item, locale) })}
        </li>
      )}

      {conditions.jogress?.map((partner) => {
        const digimon = digimonById.get(partner.id);
        return (
          <li key={partner.id} className="text-jogress">
            {t('conditions.jogress_partner', {
              digimon: digimon ? digimonName(digimon, locale) : `#${partner.id}`,
              personality: t(`personality.${partner.personality}`),
            })}
          </li>
        );
      })}
    </ul>
  );
}
