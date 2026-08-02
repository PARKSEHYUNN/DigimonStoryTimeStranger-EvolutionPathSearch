import { describe, expect, it } from 'vitest';
import { adjacency, findRoute, findRoutes } from './index';
import { DEFAULT_FILTERS, isStepAllowed } from './filters';
import type { FilterContext, SearchFilters } from './filters';
import {
  digimonById,
  digimons,
  requiredAgentLevel,
} from '../digimon/data';

const ctx: FilterContext = { digimonById, requiredAgentLevel };
const allIds = digimons.map((d) => d.id);

const withFilters = (overrides: Partial<SearchFilters>): SearchFilters => ({
  ...DEFAULT_FILTERS,
  ...overrides,
});

/**
 * Independent shortest-hop reference. Deliberately the dumbest correct
 * implementation — a plain queue, no reconstruction, no early exit tricks — so
 * that agreeing with it means something.
 */
function referenceHopCount(
  start: number,
  end: number,
  filters: SearchFilters,
): number | null {
  if (start === end) return 0;
  const dist = new Map<number, number>([[start, 0]]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head]!;
    if (current === end) return dist.get(current)!;
    for (const step of adjacency.get(current) ?? []) {
      if (dist.has(step.target)) continue;
      if (!isStepAllowed(current, step, filters, ctx)) continue;
      dist.set(step.target, dist.get(current)! + 1);
      queue.push(step.target);
    }
  }
  return dist.get(end) ?? null;
}

describe('findRoute', () => {
  it('returns a zero-hop route when start and end match', () => {
    const route = findRoute(1, 1);
    expect(route).toEqual({ nodes: [1], steps: [] });
  });

  it('returns null when no route exists under the filters', () => {
    // Agent level 1 cannot evolve into anything gated above it.
    const route = findRoute(1, 431, withFilters({ agentLevel: 1 }));
    expect(route).toBeNull();
  });

  it('produces a contiguous chain of steps', () => {
    const route = findRoute(1, 431);
    expect(route).not.toBeNull();

    const { nodes, steps } = route!;
    expect(steps).toHaveLength(nodes.length - 1);

    steps.forEach((step, i) => {
      const from = nodes[i]!;
      const to = nodes[i + 1]!;
      expect(step.target).toBe(to);
      // The stored edge is always in its authored direction, so a reversed
      // step means the route walks it backwards.
      const [edgeFrom, edgeTo] = step.reversed
        ? [step.evolution.to, step.evolution.from]
        : [step.evolution.from, step.evolution.to];
      expect(edgeFrom).toBe(from);
      expect(edgeTo).toBe(to);
    });
  });

  /**
   * The defect that motivated the rewrite. The legacy A* returned 8 hops here
   * because its `|generation difference|` heuristic overestimates across the
   * 25 edges that span more than one generation.
   */
  it('finds the true 6-hop route for Firamon -> Lobomon', () => {
    const route = findRoute(100, 188);
    expect(route).not.toBeNull();
    expect(route!.nodes).toHaveLength(7); // 6 hops
    expect(route!.nodes[0]).toBe(100);
    expect(route!.nodes.at(-1)).toBe(188);
  });

  it('matches the reference hop count across every pair from a sample of sources', () => {
    // 40 sources x 475 targets = 19,000 comparisons.
    const sources = allIds.filter((_, i) => i % 12 === 0);
    const mismatches: string[] = [];

    for (const start of sources) {
      for (const end of allIds) {
        const expected = referenceHopCount(start, end, DEFAULT_FILTERS);
        const actual = findRoute(start, end)?.nodes.length;
        const actualHops = actual === undefined ? null : actual - 1;

        if (expected !== actualHops) {
          mismatches.push(`${start}->${end}: expected ${expected}, got ${actualHops}`);
        }
      }
    }

    expect(mismatches.slice(0, 10)).toEqual([]);
  });

  it('stays optimal with filters applied', () => {
    const filters = withFilters({
      agentLevel: 4,
      includeDlc: false,
      includeJogress: false,
    });
    const sources = allIds.filter((_, i) => i % 40 === 0);
    const mismatches: string[] = [];

    for (const start of sources) {
      for (const end of allIds) {
        const expected = referenceHopCount(start, end, filters);
        const actual = findRoute(start, end, filters)?.nodes.length;
        const actualHops = actual === undefined ? null : actual - 1;
        if (expected !== actualHops) {
          mismatches.push(`${start}->${end}: expected ${expected}, got ${actualHops}`);
        }
      }
    }

    expect(mismatches.slice(0, 10)).toEqual([]);
  });
});

describe('filters', () => {
  it('never routes through an excluded Digimon', () => {
    const unfiltered = findRoute(1, 431);
    expect(unfiltered!.nodes.length).toBeGreaterThan(2);

    const banned = unfiltered!.nodes[1]!;
    const route = findRoute(1, 431, withFilters({ excludeIds: new Set([banned]) }));

    expect(route?.nodes ?? []).not.toContain(banned);
  });

  it('returns null when the destination itself is excluded', () => {
    expect(findRoute(1, 431, withFilters({ excludeIds: new Set([431]) }))).toBeNull();
  });

  it('never routes through a DLC Digimon when DLC is off', () => {
    const filters = withFilters({ includeDlc: false });
    const dlcIds = new Set(digimons.filter((d) => d.dlc).map((d) => d.id));
    expect(dlcIds.size).toBeGreaterThan(0);

    for (const end of allIds.filter((_, i) => i % 7 === 0)) {
      const route = findRoute(1, end, filters);
      for (const id of route?.nodes ?? []) {
        expect(dlcIds.has(id)).toBe(false);
      }
    }
  });

  it('never uses a Jogress edge when Jogress is off', () => {
    const filters = withFilters({ includeJogress: false });
    for (const end of allIds.filter((_, i) => i % 7 === 0)) {
      const route = findRoute(1, end, filters);
      for (const step of route?.steps ?? []) {
        expect(step.evolution.conditions.jogress).toBeUndefined();
      }
    }
  });

  it('gates evolving into a Digimon on agent level, but not de-evolving out of one', () => {
    const filters = withFilters({ agentLevel: 3 });
    for (const end of allIds.filter((_, i) => i % 5 === 0)) {
      const route = findRoute(1, end, filters);
      for (const step of route?.steps ?? []) {
        if (!step.reversed) {
          expect(requiredAgentLevel(step.target)).toBeLessThanOrEqual(3);
        }
      }
    }
  });

  it('lets a higher agent level reach at least as much as a lower one', () => {
    const low = withFilters({ agentLevel: 3 });
    const high = withFilters({ agentLevel: 10 });

    for (const end of allIds.filter((_, i) => i % 9 === 0)) {
      const lowRoute = findRoute(1, end, low);
      if (!lowRoute) continue;
      const highRoute = findRoute(1, end, high);
      expect(highRoute).not.toBeNull();
      expect(highRoute!.nodes.length).toBeLessThanOrEqual(lowRoute.nodes.length);
    }
  });
});

describe('findRoutes', () => {
  it('returns alternates ordered by length, all distinct and valid', () => {
    const routes = findRoutes(1, 431, 5);
    expect(routes.length).toBeGreaterThan(1);

    for (let i = 1; i < routes.length; i++) {
      expect(routes[i]!.nodes.length).toBeGreaterThanOrEqual(
        routes[i - 1]!.nodes.length,
      );
    }

    const keys = routes.map((r) => r.nodes.join(','));
    expect(new Set(keys).size).toBe(keys.length);

    for (const route of routes) {
      expect(route.nodes[0]).toBe(1);
      expect(route.nodes.at(-1)).toBe(431);
      expect(route.steps).toHaveLength(route.nodes.length - 1);
      // Loopless.
      expect(new Set(route.nodes).size).toBe(route.nodes.length);
    }
  });

  it('agrees with findRoute on the first result', () => {
    for (const end of allIds.filter((_, i) => i % 30 === 0)) {
      const single = findRoute(1, end);
      const [first] = findRoutes(1, end, 3);
      expect(first?.nodes ?? null).toEqual(single?.nodes ?? null);
    }
  });

  it('returns fewer than k when the graph offers fewer alternates', () => {
    const routes = findRoutes(1, 1, 5);
    expect(routes).toEqual([{ nodes: [1], steps: [] }]);
  });

  it('honours k = 1 and rejects k < 1', () => {
    expect(findRoutes(1, 431, 1)).toHaveLength(1);
    expect(findRoutes(1, 431, 0)).toEqual([]);
  });
});
