import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Enumerations                                                               */
/* -------------------------------------------------------------------------- */

/** In-Training I … Hybrid. Index matches the `generation.*` message keys. */
export const GENERATIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export type Generation = (typeof GENERATIONS)[number];

/** No Data, Vaccine, Virus, Data, Free, Variable, Unknown. */
export const ATTRIBUTES = [0, 1, 2, 3, 4, 5, 6] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

/** Adoring … Compassionate (16 values). */
export const PERSONALITIES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const;
export type Personality = (typeof PERSONALITIES)[number];

/** Numeric stat gates on an evolution. */
export const STAT_KEYS = [
  'HP',
  'SP',
  'ATK',
  'DEF',
  'INT',
  'RES',
  'SPD',
  'TALENT',
] as const;
export type StatKey = (typeof STAT_KEYS)[number];

/** Agent bond gates ("Bonds of Valor" etc.). */
export const BOND_KEYS = [
  'valor',
  'philanthropy',
  'amicability',
  'wisdom',
] as const;
export type BondKey = (typeof BOND_KEYS)[number];

export const LOCALE_KEYS = ['en', 'ko', 'ja'] as const;

/* -------------------------------------------------------------------------- */
/* Schemas                                                                    */
/* -------------------------------------------------------------------------- */

const localizedName = z.object({
  en: z.string().min(1),
  ko: z.string().min(1),
  ja: z.string().min(1),
});

/**
 * One partner in a Jogress (DNA digivolve) pairing: the Digimon that must be
 * present and the personality it must have.
 */
const jogressPartner = z.object({
  id: z.number().int().positive(),
  personality: z.number().int().min(0).max(15),
});

export const evolutionConditionsSchema = z
  .object({
    /** Minimum level ("rank" in the source data). Present on every edge. */
    rank: z.number().int().positive(),
    ...Object.fromEntries(
      STAT_KEYS.map((k) => [k, z.number().int().nonnegative().optional()]),
    ),
    ...Object.fromEntries(
      BOND_KEYS.map((k) => [k, z.number().int().nonnegative().optional()]),
    ),
    /** Required item, referencing items.json. */
    item: z.number().int().positive().optional(),
    /** Exactly two partners when present. */
    jogress: z.tuple([jogressPartner, jogressPartner]).optional(),
  })
  .strict();

export type EvolutionConditions = z.infer<typeof evolutionConditionsSchema>;

export const digimonSchema = z
  .object({
    id: z.number().int().positive(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lowercase kebab-case'),
    names: localizedName,
    generation: z.number().int().min(0).max(8),
    attribute: z.number().int().min(0).max(6),
    personality: z.number().int().min(0).max(15),
    /** True when the Digimon is only obtainable through paid DLC. */
    dlc: z.boolean(),
  })
  .strict();

export type Digimon = z.infer<typeof digimonSchema>;

/**
 * A single directed evolution edge.
 *
 * This is the one and only representation of an evolution. The legacy data
 * stored the same relationship three times — `evolution.from`, `evolution.to`
 * on the counterpart, and `evolution_requirements` — which had already drifted
 * out of sync in four places. With a single directed edge that class of bug is
 * unrepresentable.
 */
export const evolutionSchema = z
  .object({
    from: z.number().int().positive(),
    to: z.number().int().positive(),
    conditions: evolutionConditionsSchema,
  })
  .strict();

export type Evolution = z.infer<typeof evolutionSchema>;

export const itemSchema = z
  .object({ id: z.number().int().positive(), names: localizedName })
  .strict();

export type Item = z.infer<typeof itemSchema>;

/**
 * Minimum agent level required to perform an evolution, keyed by the target's
 * generation, with per-Digimon overrides that win when present.
 */
export const agentLevelsSchema = z
  .object({
    byGeneration: z.record(z.string(), z.number().int().min(1).max(10)),
    byDigimonId: z.record(z.string(), z.number().int().min(1).max(10)),
  })
  .strict();

export type AgentLevels = z.infer<typeof agentLevelsSchema>;

export const digimonsFileSchema = z.array(digimonSchema);
export const evolutionsFileSchema = z.array(evolutionSchema);
export const itemsFileSchema = z.array(itemSchema);
