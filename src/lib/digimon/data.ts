import digimonsJson from '@data/digimons.json';
import evolutionsJson from '@data/evolutions.json';
import agentLevelsJson from '@data/agent-levels.json';
import itemsJson from '@data/items.json';
import type { AgentLevels, Digimon, Evolution, Item } from './schema';

/**
 * The JSON is shape-checked by `npm run data:validate`, which the build runs
 * before `next build`. Re-parsing with Zod on every import would only repeat
 * that work and drag the schema into the client bundle, so the typed views are
 * asserted here and the gate stays a build step.
 */
export const digimons = digimonsJson as Digimon[];
export const evolutions = evolutionsJson as Evolution[];
export const items = itemsJson as Item[];
export const agentLevels = agentLevelsJson as AgentLevels;

export const digimonById: ReadonlyMap<number, Digimon> = new Map(
  digimons.map((d) => [d.id, d]),
);

export const digimonBySlug: ReadonlyMap<string, Digimon> = new Map(
  digimons.map((d) => [d.slug, d]),
);

export const itemById: ReadonlyMap<number, Item> = new Map(
  items.map((i) => [i.id, i]),
);

/**
 * Minimum agent level needed to perform an evolution into `digimonId`.
 * Per-Digimon overrides beat the generation default.
 */
export function requiredAgentLevel(digimonId: number): number {
  const override = agentLevels.byDigimonId[String(digimonId)];
  if (override !== undefined) return override;

  const digimon = digimonById.get(digimonId);
  if (!digimon) return 1;

  return agentLevels.byGeneration[String(digimon.generation)] ?? 1;
}

/** Digimon reachable in one step, split by direction. */
export interface Neighbors {
  /** Edges where this Digimon is the source — evolving upward. */
  evolvesTo: Evolution[];
  /** Edges where this Digimon is the target — what it came from. */
  evolvesFrom: Evolution[];
}

const neighborIndex = new Map<number, Neighbors>();
for (const d of digimons) {
  neighborIndex.set(d.id, { evolvesTo: [], evolvesFrom: [] });
}
for (const e of evolutions) {
  neighborIndex.get(e.from)?.evolvesTo.push(e);
  neighborIndex.get(e.to)?.evolvesFrom.push(e);
}

export function neighborsOf(digimonId: number): Neighbors {
  return neighborIndex.get(digimonId) ?? { evolvesTo: [], evolvesFrom: [] };
}

/** True when the evolution is a Jogress (DNA digivolve) pairing. */
export function isJogress(evolution: Evolution): boolean {
  return evolution.conditions.jogress !== undefined;
}

/** Digimon that can only be reached through a Jogress. */
export const jogressTargetIds: ReadonlySet<number> = new Set(
  evolutions.filter(isJogress).map((e) => e.to),
);
