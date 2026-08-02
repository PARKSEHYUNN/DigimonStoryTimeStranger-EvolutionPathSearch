import type { Adjacency, Step } from '../digimon/graph';
import { isNodeAllowed, isStepAllowed } from './filters';
import type { FilterContext, SearchFilters } from './filters';

/** A route: the Digimon visited, and the hop taken between each pair. */
export interface Route {
  nodes: number[];
  steps: Step[];
}

export interface Restrictions {
  /** Digimon Yen's algorithm has temporarily removed from the graph. */
  bannedNodes?: ReadonlySet<number>;
  /** Hops removed for this pass, keyed `${from}>${to}`. */
  bannedHops?: ReadonlySet<string>;
}

export const hopKey = (from: number, to: number) => `${from}>${to}`;

/**
 * Shortest route by hop count.
 *
 * Every hop costs exactly 1, so breadth-first search is optimal by
 * construction. The version this replaces ran A* with `h = |generation
 * difference|`, which is not admissible here — 25 edges span more than one
 * generation and the widest jumps six — so it could and did settle for longer
 * routes (Firamon -> Lobomon came back as 8 hops when 6 exist).
 */
export function findShortestRoute(
  adjacency: Adjacency,
  start: number,
  end: number,
  filters: SearchFilters,
  ctx: FilterContext,
  restrictions: Restrictions = {},
): Route | null {
  const { bannedNodes, bannedHops } = restrictions;

  if (!isNodeAllowed(start, filters, ctx)) return null;
  if (!isNodeAllowed(end, filters, ctx)) return null;
  if (bannedNodes?.has(start) || bannedNodes?.has(end)) return null;
  if (start === end) return { nodes: [start], steps: [] };

  // Predecessor plus the hop used to get there. The hop matters: bidirectional
  // pairs (X-Antibody and Alter forms) have a distinct edge in each direction,
  // so a node sequence alone would not identify which conditions applied.
  const cameFrom = new Map<number, { prev: number; step: Step }>();
  const visited = new Set<number>([start]);

  // Plain array with a head index — shift() on a growing queue is O(n).
  const queue: number[] = [start];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++]!;

    for (const step of adjacency.get(current) ?? []) {
      const { target } = step;

      if (visited.has(target)) continue;
      if (bannedNodes?.has(target)) continue;
      if (bannedHops?.has(hopKey(current, target))) continue;
      if (!isStepAllowed(step, filters, ctx)) continue;

      visited.add(target);
      cameFrom.set(target, { prev: current, step });

      if (target === end) return reconstruct(cameFrom, start, end);

      queue.push(target);
    }
  }

  return null;
}

function reconstruct(
  cameFrom: ReadonlyMap<number, { prev: number; step: Step }>,
  start: number,
  end: number,
): Route {
  const nodes: number[] = [end];
  const steps: Step[] = [];

  let current = end;
  while (current !== start) {
    const entry = cameFrom.get(current);
    if (!entry) break;
    steps.push(entry.step);
    nodes.push(entry.prev);
    current = entry.prev;
  }

  nodes.reverse();
  steps.reverse();
  return { nodes, steps };
}
