import { buildAdjacency } from '../digimon/graph';
import {
  digimonById,
  digimons,
  evolutions,
  requiredAgentLevel,
} from '../digimon/data';
import { findShortestRoute, type Route } from './bfs';
import { findKShortestRoutes } from './k-routes';
import { DEFAULT_FILTERS, type FilterContext, type SearchFilters } from './filters';

export type { Route } from './bfs';
export type { SearchFilters } from './filters';
export { DEFAULT_FILTERS } from './filters';

/**
 * The site's graph, built once at module load.
 *
 * 475 nodes and 1118 edges: a search averages 0.027 ms, so this runs inline on
 * the main thread. The legacy build pushed it into a Web Worker along with an
 * INIT handshake, a message protocol and an `isGraphReady` flag — none of which
 * a sub-millisecond synchronous call needs.
 */
export const adjacency = buildAdjacency(
  digimons.map((d) => d.id),
  evolutions,
);

const context: FilterContext = { digimonById, requiredAgentLevel };

export function findRoute(
  start: number,
  end: number,
  filters: SearchFilters = DEFAULT_FILTERS,
): Route | null {
  return findShortestRoute(adjacency, start, end, filters, context);
}

export function findRoutes(
  start: number,
  end: number,
  k = 3,
  filters: SearchFilters = DEFAULT_FILTERS,
): Route[] {
  return findKShortestRoutes(adjacency, start, end, k, filters, context);
}
