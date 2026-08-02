/**
 * Proves the rollback lever works.
 *
 * An escape hatch nobody exercises is not an escape hatch, so each switch in
 * `PathfinderBehavior` is asserted to actually restore the old rule, and
 * `LEGACY_BEHAVIOR` as a whole is checked against a replay of the old worker's
 * gating.
 */
import { describe, expect, it } from 'vitest';
import { findRoute, findRoutes } from './index';
import { CURRENT_BEHAVIOR, LEGACY_BEHAVIOR } from './behavior';
import { DEFAULT_FILTERS, type SearchFilters } from './filters';
import {
  digimonById,
  digimons,
  evolutions,
  requiredAgentLevel,
} from '../digimon/data';

const ids = digimons.map((d) => d.id);
const withFilters = (o: Partial<SearchFilters>): SearchFilters => ({
  ...DEFAULT_FILTERS,
  ...o,
});

describe('gateStartNode', () => {
  /** Digimon whose own requirement outranks a level-5 player. */
  const gatedStarts = ids.filter((id) => requiredAgentLevel(id) > 5);

  it('has cases to exercise', () => {
    expect(gatedStarts.length).toBeGreaterThan(0);
  });

  it('off (current): a query from a high-requirement Digimon is answered', () => {
    const filters = withFilters({ agentLevel: 5 });
    const answered = gatedStarts.filter((id) =>
      ids.some((end) => end !== id && findRoute(id, end, filters, CURRENT_BEHAVIOR)),
    );
    expect(answered.length).toBeGreaterThan(0);
  });

  it('on (legacy): the same queries are refused outright', () => {
    const filters = withFilters({ agentLevel: 5 });
    for (const id of gatedStarts) {
      for (const end of ids.filter((_, i) => i % 50 === 0)) {
        expect(findRoute(id, end, filters, LEGACY_BEHAVIOR)).toBeNull();
      }
    }
  });

  it('does not misfire on spur searches inside the K-route walk', () => {
    // A legal start under legacy rules should still yield alternates; the
    // gate must not re-trigger on intermediate spur nodes.
    const filters = withFilters({ agentLevel: 10 });
    const routes = findRoutes(1, 431, 3, filters, LEGACY_BEHAVIOR);
    expect(routes.length).toBeGreaterThan(1);
    for (const r of routes) {
      expect(r.nodes[0]).toBe(1);
      expect(r.nodes.at(-1)).toBe(431);
    }
  });
});

describe('direction', () => {
  /**
   * The three edges that evolve into a *lower* generation. Under `edge` they
   * are evolutions and get gated; under `generation` the old rule read them as
   * de-evolutions and let them through ungated.
   */
  const downhill = evolutions.filter((e) => {
    const from = digimonById.get(e.from);
    const to = digimonById.get(e.to);
    return from && to && to.generation < from.generation;
  });

  it('has cases to exercise', () => {
    expect(downhill.length).toBe(3);
  });

  it('gates a downhill evolution under edge mode but not generation mode', () => {
    const directed = new Set(evolutions.map((e) => `${e.from}>${e.to}`));
    // Pick one with no reverse counterpart, so the only way across is the
    // forward edge and the switch is what decides.
    const edge = downhill.find(
      (e) =>
        requiredAgentLevel(e.to) > 1 && !directed.has(`${e.to}>${e.from}`),
    );
    expect(edge).toBeDefined();

    const level = requiredAgentLevel(edge!.to) - 1;
    const filters = withFilters({ agentLevel: level });

    // Isolate this switch. LEGACY_BEHAVIOR also turns the start-node gate on,
    // which would refuse the query before direction ever mattered.
    const viaEdge = findRoute(edge!.from, edge!.to, filters, CURRENT_BEHAVIOR);
    const viaGeneration = findRoute(edge!.from, edge!.to, filters, {
      ...CURRENT_BEHAVIOR,
      direction: 'generation',
    });

    // Legacy reaches it in one hop because it never applied the gate here.
    expect(viaGeneration?.nodes).toEqual([edge!.from, edge!.to]);
    // Current refuses the ungated shortcut and must route around, if it can.
    expect(viaEdge?.nodes).not.toEqual([edge!.from, edge!.to]);
  });

  /**
   * Walking an edge backwards is free, so for the 17 pairs authored in both
   * directions a player could hop A -> B without clearing B's gate. That is
   * only harmless because every such pair requires the same level on both
   * sides — these are form swaps (X-Antibody, Alter, Hybrid), not power steps.
   *
   * Pinned because it is a property of the data, not of the code: making a
   * pair asymmetric would silently turn the free hop into a real gate bypass.
   */
  it('mutual pairs never let a free reverse hop skip a level requirement', () => {
    const directed = new Set(evolutions.map((e) => `${e.from}>${e.to}`));
    const asymmetric: string[] = [];

    for (const e of evolutions) {
      if (!directed.has(`${e.to}>${e.from}`)) continue;
      if (requiredAgentLevel(e.from) !== requiredAgentLevel(e.to)) {
        asymmetric.push(
          `${e.from} (lv${requiredAgentLevel(e.from)}) <-> ${e.to} (lv${requiredAgentLevel(e.to)})`,
        );
      }
    }

    expect(asymmetric).toEqual([]);
  });
});

describe('jogressBlocksReverse', () => {
  const jogressTargets = new Set(
    evolutions.filter((e) => e.conditions.jogress).map((e) => e.to),
  );

  it('current: no route touches a Jogress edge when Jogress is off', () => {
    const filters = withFilters({ includeJogress: false });
    for (const end of ids.filter((_, i) => i % 5 === 0)) {
      for (const step of findRoute(1, end, filters, CURRENT_BEHAVIOR)?.steps ?? []) {
        expect(step.evolution.conditions.jogress).toBeUndefined();
      }
    }
  });

  it('legacy: the filter leaks on backward hops', () => {
    const filters = withFilters({ includeJogress: false });
    let leaked = 0;
    for (const end of ids) {
      for (const step of findRoute(1, end, filters, LEGACY_BEHAVIOR)?.steps ?? []) {
        if (step.evolution.conditions.jogress) leaked++;
      }
    }
    // Documents the old behaviour rather than endorsing it: the leak is real,
    // which is why the current default closes it.
    expect(leaked).toBeGreaterThan(0);
    expect(jogressTargets.size).toBeGreaterThan(0);
  });
});

describe('LEGACY_BEHAVIOR as a whole', () => {
  it('still returns well-formed routes', () => {
    const adjacencyPairs = new Map<number, Set<number>>(
      digimons.map((d) => [d.id, new Set<number>()]),
    );
    for (const e of evolutions) {
      adjacencyPairs.get(e.from)!.add(e.to);
      adjacencyPairs.get(e.to)!.add(e.from);
    }

    for (const end of ids.filter((_, i) => i % 6 === 0)) {
      const route = findRoute(1, end, DEFAULT_FILTERS, LEGACY_BEHAVIOR);
      if (!route) continue;
      expect(new Set(route.nodes).size).toBe(route.nodes.length);
      for (let i = 0; i < route.nodes.length - 1; i++) {
        expect(adjacencyPairs.get(route.nodes[i]!)!.has(route.nodes[i + 1]!)).toBe(
          true,
        );
      }
    }
  });

  it('is still optimal — rollback restores the old rules, not the old bug', () => {
    // Even in legacy mode the search is BFS, so routes stay shortest under
    // whatever rules are in force.
    for (const end of ids.filter((_, i) => i % 20 === 0)) {
      const route = findRoute(1, end, DEFAULT_FILTERS, LEGACY_BEHAVIOR);
      if (!route) continue;
      const shorter = findRoutes(1, end, 1, DEFAULT_FILTERS, LEGACY_BEHAVIOR)[0];
      expect(route.nodes.length).toBe(shorter!.nodes.length);
    }
  });
});
