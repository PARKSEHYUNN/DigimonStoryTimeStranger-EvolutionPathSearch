/**
 * Enum labels, read from the site's own Korean messages.
 *
 * The legacy admin kept its own hard-coded copy of the generation, attribute,
 * personality and item names, which is how it ended up listing items the data
 * no longer had. Here the labels come from the shipped translations and the
 * item names come from the dataset being edited, so there is nothing to drift.
 */
import ko from '@/messages/ko.json';
import {
  ATTRIBUTES,
  BOND_KEYS,
  GENERATIONS,
  PERSONALITIES,
  STAT_KEYS,
} from '@/lib/digimon/schema';

const messages = ko as unknown as Record<string, Record<string, string>>;

const label = (namespace: string, key: number | string): string =>
  messages[namespace]?.[String(key)] ?? `#${key}`;

export const generationLabel = (value: number) => label('generation', value);
export const attributeLabel = (value: number) => label('attribute', value);
export const personalityLabel = (value: number) => label('personality', value);
export const statLabel = (key: string) => label('stats', key);
export const bondLabel = (key: string) => label('agent', key);

/** Typed as plain numbers: the editor holds work-in-progress values that the
 *  schema has not accepted yet, so narrowing to the literal unions here would
 *  only force casts at every call site. */
type Option = { value: number; label: string };

export const GENERATION_OPTIONS: Option[] = GENERATIONS.map((value) => ({
  value,
  label: `${value} · ${generationLabel(value)}`,
}));

export const ATTRIBUTE_OPTIONS: Option[] = ATTRIBUTES.map((value) => ({
  value,
  label: `${value} · ${attributeLabel(value)}`,
}));

export const PERSONALITY_OPTIONS: Option[] = PERSONALITIES.map((value) => ({
  value,
  label: `${value} · ${personalityLabel(value)}`,
}));

export { BOND_KEYS, STAT_KEYS };
