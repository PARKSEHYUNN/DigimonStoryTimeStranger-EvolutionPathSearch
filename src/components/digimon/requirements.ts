import type { getTranslations } from 'next-intl/server';
import { digimonById, itemById } from '@/lib/digimon/data';
import { digimonName, itemName } from '@/lib/digimon/display';
import { BOND_KEYS, STAT_KEYS, type Evolution } from '@/lib/digimon/schema';
import type { Locale } from '@/lib/i18n/routing';

/**
 * What an evolution asks of the player, as sentences.
 *
 * Shared so the three places that show requirements cannot describe the same
 * edge differently. Jogress partners are returned separately rather than mixed
 * in: they are not a threshold to grind towards but a second Digimon that has
 * to exist, and EvolutionLinkList has always given them their own line and
 * colour. A step count that hides them is the misleading part.
 */

type Translator = Awaited<ReturnType<typeof getTranslations>>;

/** Levels, stats, bonds and items. Everything except the Jogress partners. */
export function evolutionRequirements(
  evolution: Evolution,
  locale: Locale,
  t: Translator,
): string[] {
  const { conditions } = evolution;
  const item = conditions.item ? itemById.get(conditions.item) : undefined;

  return [
    t('conditions.level', { value: conditions.rank }),
    ...STAT_KEYS.filter((k) => conditions[k] !== undefined).map((k) =>
      t('conditions.stat', { stat: t(`stats.${k}`), value: conditions[k]! }),
    ),
    ...BOND_KEYS.filter((k) => conditions[k] !== undefined).map((k) =>
      t('conditions.stat', { stat: t(`agent.${k}`), value: conditions[k]! }),
    ),
    ...(item ? [t('conditions.item', { item: itemName(item, locale) })] : []),
  ];
}

/** The other Digimon a Jogress needs, with the personality each must have. */
export function jogressPartners(
  evolution: Evolution,
  locale: Locale,
  t: Translator,
): string[] {
  return (evolution.conditions.jogress ?? []).map((partner) => {
    const digimon = digimonById.get(partner.id);
    return t('conditions.jogress_partner', {
      digimon: digimon ? digimonName(digimon, locale) : `#${partner.id}`,
      personality: t(`personality.${partner.personality}`),
    });
  });
}
