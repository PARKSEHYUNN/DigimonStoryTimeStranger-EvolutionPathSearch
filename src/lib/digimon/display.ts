import type { Locale } from '../i18n/routing';
import type { Digimon, Item } from './schema';

/**
 * Localized name lookup.
 *
 * The legacy data stored names as a positional array, so four separate files
 * carried their own copy of `language === 'en' ? 0 : 'ko' ? 1 : 'ja' ? 2 : 0`.
 * Keying by locale removes the mapping entirely.
 */
export const digimonName = (digimon: Digimon, locale: Locale): string =>
  digimon.names[locale];

export const itemName = (item: Item, locale: Locale): string =>
  item.names[locale];

export const iconUrl = (id: number, size: 'full' | 'thumb' = 'full'): string =>
  size === 'thumb' ? `/icons/thumb/${id}.webp` : `/icons/${id}.webp`;
