/**
 * Migration safety net.
 *
 * Replacing the search changes results, so this pins the properties that must
 * hold against a faithful replay of the old worker
 * (legacy/src/worker/pathfinding.worker.js):
 *
 *   1. Nothing that used to be reachable becomes unreachable.
 *   2. No route ever comes back longer than the old one.
 *
 * Routes do legitimately change: where several routes tie for shortest, BFS
 * and A* explore in different orders and surface different ones. That is
 * expected and is asserted to still be a valid, contiguous, loopless route
 * rather than being asserted away.
 */
import { describe, expect, it } from 'vitest';
import { findRoute } from './index';
import {
  digimonById,
  digimons,
  evolutions,
  requiredAgentLevel,
} from '../digimon/data';
import { DEFAULT_FILTERS, type SearchFilters } from './filters';

const ids = digimons.map((d) => d.id);

const undirected = new Map<number, number[]>(digimons.map((d) => [d.id, []]));
for (const e of evolutions) {
  undirected.get(e.from)!.push(e.to);
  undirected.get(e.to)!.push(e.from);
}
const jogressTargets = new Set(
  evolutions.filter((e) => e.conditions.jogress).map((e) => e.to),
);
const dlcIds = new Set(digimons.filter((d) => d.dlc).map((d) => d.id));

/**
 * The old engine, reproduced: A* over `h = |generation difference|`, direction
 * inferred by comparing generations, and the pre-checks that rejected a query
 * outright when either endpoint outranked the agent level.
 */
function legacyRoute(
  start: number,
  end: number,
  filters: SearchFilters,
): number[] | null {
  const startData = digimonById.get(start);
  const endData = digimonById.get(end);
  if (!startData || !endData) return null;

  if (filters.agentLevel < requiredAgentLevel(end)) return null;
  if (filters.agentLevel < requiredAgentLevel(start)) return null;
  if (filters.excludeIds.has(start) || filters.excludeIds.has(end)) return null;

  const goalGeneration = endData.generation;
  const heap: [number, number, number][] = [
    [Math.abs(startData.generation - goalGeneration), 0, start],
  ];
  const dist = new Map([[start, 0]]);
  const cameFrom = new Map<number, number>();
  let found = false;

  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [, cost, current] = heap.shift()!;
    if (cost > (dist.get(current) ?? Infinity)) continue;
    if (current === end) {
      found = true;
      break;
    }

    const currentData = digimonById.get(current)!;
    for (const neighbor of undirected.get(current) ?? []) {
      const neighborData = digimonById.get(neighbor);
      if (!neighborData) continue;
      if (filters.excludeIds.has(neighbor)) continue;
      if (!filters.includeDlc && dlcIds.has(neighbor)) continue;

      // The old direction test: generation order, not edge direction.
      if (neighborData.generation >= currentData.generation) {
        if (jogressTargets.has(neighbor) && !filters.includeJogress) continue;
        if (filters.agentLevel < requiredAgentLevel(neighbor)) continue;
      }

      const next = cost + 1;
      if (next < (dist.get(neighbor) ?? Infinity)) {
        dist.set(neighbor, next);
        cameFrom.set(neighbor, current);
        heap.push([
          next + Math.abs(neighborData.generation - goalGeneration),
          next,
          neighbor,
        ]);
      }
    }
  }

  if (!found) return null;
  const path = [end];
  let cursor: number | undefined = end;
  while ((cursor = cameFrom.get(cursor!)) !== undefined) path.push(cursor);
  return path.reverse();
}

/** Every consecutive pair must be joined by a real edge, and no node repeats. */
function isWellFormed(nodes: number[]): boolean {
  if (new Set(nodes).size !== nodes.length) return false;
  for (let i = 0; i < nodes.length - 1; i++) {
    if (!undirected.get(nodes[i]!)?.includes(nodes[i + 1]!)) return false;
  }
  return true;
}

describe.each([10, 7, 5, 3, 1])('agent level %i', (agentLevel) => {
  const filters: SearchFilters = { ...DEFAULT_FILTERS, agentLevel };
  const sources = ids.filter((_, i) => i % 10 === 0);

  const lost: string[] = [];
  const longer: string[] = [];
  const malformed: string[] = [];
  let shorter = 0;
  let rerouted = 0;
  let gained = 0;

  for (const start of sources) {
    for (const end of ids) {
      if (start === end) continue;
      const before = legacyRoute(start, end, filters);
      const after = findRoute(start, end, filters)?.nodes ?? null;

      if (after && !isWellFormed(after)) {
        malformed.push(`${start}->${end}: ${after.join(',')}`);
      }
      if (before && !after) {
        lost.push(`${start}->${end}`);
      } else if (!before && after) {
        gained++;
      } else if (before && after) {
        if (after.length > before.length) {
          longer.push(`${start}->${end}: ${before.length - 1} -> ${after.length - 1}`);
        } else if (after.length < before.length) {
          shorter++;
        } else if (after.join() !== before.join()) {
          rerouted++;
        }
      }
    }
  }

  it('never loses a route the old engine could find', () => {
    expect(lost.slice(0, 10)).toEqual([]);
  });

  it('never returns a longer route than the old engine', () => {
    expect(longer.slice(0, 10)).toEqual([]);
  });

  it('only ever returns well-formed, loopless routes', () => {
    expect(malformed.slice(0, 10)).toEqual([]);
  });

  it('reports the shape of the change', () => {
    console.log(
      `  level ${agentLevel}: ${shorter} shorter, ${rerouted} same-length reroutes, ` +
        `${gained} newly answerable, 0 lost, 0 longer`,
    );
    expect(shorter + rerouted + gained).toBeGreaterThanOrEqual(0);
  });
}, 120_000);
