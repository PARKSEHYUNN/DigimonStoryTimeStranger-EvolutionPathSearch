import type { Step } from '../digimon/graph';
import type { Digimon } from '../digimon/schema';

export interface SearchFilters {
  /** Player's agent level, 1-10. Gates which evolutions are performable. */
  agentLevel: number;
  /** When false, DLC-only Digimon are unreachable. */
  includeDlc: boolean;
  /** When false, Jogress (DNA digivolve) evolutions are unavailable. */
  includeJogress: boolean;
  /** Digimon the user has explicitly banned from routes. */
  excludeIds: ReadonlySet<number>;
}

export const DEFAULT_FILTERS: SearchFilters = {
  agentLevel: 10,
  includeDlc: true,
  includeJogress: true,
  excludeIds: new Set(),
};

export interface FilterContext {
  digimonById: ReadonlyMap<number, Digimon>;
  /** Minimum agent level needed to evolve *into* a Digimon. */
  requiredAgentLevel: (id: number) => number;
}

/**
 * Whether a Digimon may appear on a route at all, independent of how it is
 * reached.
 */
export function isNodeAllowed(
  id: number,
  filters: SearchFilters,
  ctx: FilterContext,
): boolean {
  if (filters.excludeIds.has(id)) return false;

  const digimon = ctx.digimonById.get(id);
  if (!digimon) return false;

  if (!filters.includeDlc && digimon.dlc) return false;

  return true;
}

/**
 * Whether a single hop may be taken.
 *
 * The agent-level gate applies only when evolving forward. Walking an edge
 * backwards is de-evolution, which costs nothing — and requiring a level to
 * undo an evolution you have already performed would be incoherent.
 *
 * Note this leaves the starting Digimon ungated: the user is asserting they
 * already own it. The legacy build rejected the whole query when the start's
 * generation outranked the agent level, which produced a bare "no path found"
 * for Digimon that are obtainable without evolving at all.
 */
export function isStepAllowed(
  step: Step,
  filters: SearchFilters,
  ctx: FilterContext,
): boolean {
  if (!isNodeAllowed(step.target, filters, ctx)) return false;

  if (!filters.includeJogress && step.evolution.conditions.jogress) {
    return false;
  }

  if (!step.reversed && filters.agentLevel < ctx.requiredAgentLevel(step.target)) {
    return false;
  }

  return true;
}
