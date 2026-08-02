import { buildAdjacency } from '../digimon/graph';
import {
  digimonById,
  digimons,
  evolutions,
  requiredAgentLevel,
} from '../digimon/data';
import { CURRENT_BEHAVIOR, type PathfinderBehavior } from './behavior';
import { findShortestRoute, type Route } from './bfs';
import { findKShortestRoutes } from './k-routes';
import {
  DEFAULT_FILTERS,
  type FilterContext,
  type SearchFilters,
} from './filters';

export type { Route } from './bfs';
export type { SearchFilters } from './filters';
export { DEFAULT_FILTERS } from './filters';
export {
  CURRENT_BEHAVIOR,
  LEGACY_BEHAVIOR,
  type PathfinderBehavior,
} from './behavior';

/**
 * The site's graph, built once at module load.
 *
 * 475 nodes and 1118 edges: a search averages 0.04 ms, so this runs inline on
 * the main thread. The legacy build pushed it into a Web Worker along with an
 * INIT handshake, a message protocol and an `isGraphReady` flag — none of which
 * a sub-millisecond synchronous call needs.
 */
export const adjacency = buildAdjacency(
  digimons.map((d) => d.id),
  evolutions,
);

const context: FilterContext = { digimonById, requiredAgentLevel };

/**
 * `behavior` is the rollback lever. Pass `LEGACY_BEHAVIOR` to restore the old
 * worker's rules about which hops are legal; see ./behavior.ts for what each
 * switch changes and what it costs.
 */
export function findRoute(
  start: number,
  end: number,
  filters: SearchFilters = DEFAULT_FILTERS,
  behavior: PathfinderBehavior = CURRENT_BEHAVIOR,
): Route | null {
  return findShortestRoute(
    adjacency,
    start,
    end,
    filters,
    context,
    {},
    behavior,
  );
}

export function findRoutes(
  start: number,
  end: number,
  k = 3,
  filters: SearchFilters = DEFAULT_FILTERS,
  behavior: PathfinderBehavior = CURRENT_BEHAVIOR,
): Route[] {
  return findKShortestRoutes(
    adjacency,
    start,
    end,
    k,
    filters,
    context,
    behavior,
  );
}
