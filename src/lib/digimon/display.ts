import { digimons } from './data';
import type { Locale } from '../i18n/routing';
import type { Digimon, Item } from './schema';

/**
 * Localized names that collide with another Digimon, resolved by appending the
 * English name.
 *
 * Two pairs share a name in Korean and Japanese but not English:
 *
 *   348 Ceresmon        / 349 Ceresmon Medium   -> 케레스몬 / ケレスモン
 *   227 Rapidmon        / 422 Rapidmon (Armor)  -> 래피드몬 / ラピッドモン
 *
 * Left alone that produces two pages with identical titles, which reads as
 * duplicate content, and two indistinguishable rows in the list. The proper fix
 * is for the ko/ja data to carry the qualifier the game uses, but inventing
 * those names is not something to do from here — so the display layer
 * disambiguates and the data stays untouched.
 */
const disambiguated = new Map<string, string>();

for (const locale of ['en', 'ko', 'ja'] as const) {
  const byName = new Map<string, Digimon[]>();
  for (const digimon of digimons) {
    const name = digimon.names[locale];
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name)!.push(digimon);
  }

  for (const [name, group] of byName) {
    if (group.length < 2) continue;
    for (const digimon of group) {
      // Flatten any parentheses in the English name so the qualifier does not
      // nest: "Rapidmon (Armor)" becomes "Rapidmon Armor".
      const qualifier = digimon.names.en.replace(/[()]/g, '').trim();
      disambiguated.set(`${locale}:${digimon.id}`, `${name} (${qualifier})`);
    }
  }
}

/**
 * Localized name, unique across the roster.
 *
 * The legacy data stored names as a positional array, so four separate files
 * carried their own copy of `language === 'en' ? 0 : 'ko' ? 1 : 'ja' ? 2 : 0`.
 * Keying by locale removes the mapping entirely.
 */
export const digimonName = (digimon: Digimon, locale: Locale): string =>
  disambiguated.get(`${locale}:${digimon.id}`) ?? digimon.names[locale];

export const itemName = (item: Item, locale: Locale): string =>
  item.names[locale];

export const iconUrl = (id: number, size: 'full' | 'thumb' = 'full'): string =>
  size === 'thumb' ? `/icons/thumb/${id}.webp` : `/icons/${id}.webp`;
