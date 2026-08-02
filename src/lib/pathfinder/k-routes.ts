import type { Adjacency } from '../digimon/graph';
import { findShortestRoute, hopKey, type Route } from './bfs';
import type { FilterContext, SearchFilters } from './filters';

/**
 * The K shortest loopless routes, shortest first (Yen's algorithm).
 *
 * The legacy worker took a `k` argument, named its function
 * `findKShortestPaths`, and then returned exactly one route — `k` was never
 * read. Alternates are genuinely useful here: the shortest route often runs
 * through a Jogress or a DLC Digimon, and players want to see what the next
 * option costs.
 */
export function findKShortestRoutes(
  adjacency: Adjacency,
  start: number,
  end: number,
  k: number,
  filters: SearchFilters,
  ctx: FilterContext,
): Route[] {
  if (k < 1) return [];

  const first = findShortestRoute(adjacency, start, end, filters, ctx);
  if (!first) return [];

  const accepted: Route[] = [first];
  // Candidates for the next slot, deduped by node sequence.
  const candidates = new Map<string, Route>();

  while (accepted.length < k) {
    const previous = accepted[accepted.length - 1]!;

    // Each node of the previous route is a place the next route could branch.
    for (let i = 0; i < previous.nodes.length - 1; i++) {
      const spurNode = previous.nodes[i]!;
      const rootNodes = previous.nodes.slice(0, i + 1);
      const rootKey = rootNodes.join(',');

      // Block the hops already taken from this spur by routes sharing this
      // prefix, or the search would just rediscover them.
      const bannedHops = new Set<string>();
      for (const route of accepted) {
        if (route.nodes.length > i + 1 && route.nodes.slice(0, i + 1).join(',') === rootKey) {
          bannedHops.add(hopKey(route.nodes[i]!, route.nodes[i + 1]!));
        }
      }

      // Keep the spur path loopless by removing everything already used.
      const bannedNodes = new Set(rootNodes.slice(0, -1));

      const spur = findShortestRoute(adjacency, spurNode, end, filters, ctx, {
        bannedNodes,
        bannedHops,
      });
      if (!spur) continue;

      const nodes = [...rootNodes.slice(0, -1), ...spur.nodes];
      const key = nodes.join(',');
      if (candidates.has(key)) continue;
      if (accepted.some((r) => r.nodes.join(',') === key)) continue;

      candidates.set(key, {
        nodes,
        steps: [...previous.steps.slice(0, i), ...spur.steps],
      });
    }

    if (candidates.size === 0) break;

    let best: Route | null = null;
    let bestKey = '';
    for (const [key, route] of candidates) {
      if (!best || route.nodes.length < best.nodes.length) {
        best = route;
        bestKey = key;
      }
    }
    if (!best) break;

    candidates.delete(bestKey);
    accepted.push(best);
  }

  return accepted;
}
