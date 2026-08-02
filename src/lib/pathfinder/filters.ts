import type { Step } from '../digimon/graph';
import type { Digimon } from '../digimon/schema';
import { CURRENT_BEHAVIOR, type PathfinderBehavior } from './behavior';

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
 * Whether the hop counts as evolving (gated) rather than de-evolving (free).
 * See `PathfinderBehavior.direction` for why this is switchable.
 */
function isEvolvingHop(
  from: number,
  step: Step,
  ctx: FilterContext,
  behavior: PathfinderBehavior,
): boolean {
  if (behavior.direction === 'edge') return !step.reversed;

  const source = ctx.digimonById.get(from);
  const target = ctx.digimonById.get(step.target);
  if (!source || !target) return !step.reversed;

  return target.generation >= source.generation;
}

/**
 * Whether a single hop may be taken.
 *
 * The agent-level gate applies only when evolving forward. Walking an edge
 * backwards is de-evolution, which costs nothing — requiring a level to undo
 * an evolution you already performed would be incoherent.
 */
export function isStepAllowed(
  from: number,
  step: Step,
  filters: SearchFilters,
  ctx: FilterContext,
  behavior: PathfinderBehavior = CURRENT_BEHAVIOR,
): boolean {
  if (!isNodeAllowed(step.target, filters, ctx)) return false;

  const evolving = isEvolvingHop(from, step, ctx, behavior);

  if (!filters.includeJogress && step.evolution.conditions.jogress) {
    if (evolving || behavior.jogressBlocksReverse) return false;
  }

  if (evolving && filters.agentLevel < ctx.requiredAgentLevel(step.target)) {
    return false;
  }

  return true;
}
