/**
 * Golden record of what the engine actually returns.
 *
 * The parity test proves the current engine is no worse than the old one. This
 * one does something different: it freezes a deterministic sample of real
 * routes so that any *future* change to route selection shows up as a
 * reviewable diff instead of a silent surprise.
 *
 * When a change is intended:
 *
 *     npx vitest run -u src/lib/pathfinder/routes.snapshot.test.ts
 *
 * then read the diff in the committed `.snap` before accepting it. A diff that
 * you cannot explain is the signal to roll back — see ./behavior.ts.
 */
import { describe, expect, it } from 'vitest';
import { findRoute, findRoutes } from './index';
import { LEGACY_BEHAVIOR } from './behavior';
import { DEFAULT_FILTERS, type SearchFilters } from './filters';
import { digimonById, digimons } from '../digimon/data';

const ids = digimons.map((d) => d.id);

/** Fixed pseudo-random pairs — stable across runs, spread across the graph. */
function samplePairs(count: number): [number, number][] {
  const pairs: [number, number][] = [];
  let seed = 20260802;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  while (pairs.length < count) {
    const a = ids[next() % ids.length]!;
    const b = ids[next() % ids.length]!;
    if (a !== b) pairs.push([a, b]);
  }
  return pairs;
}

const name = (id: number) => digimonById.get(id)?.names.en ?? `#${id}`;
const render = (nodes: number[]) => nodes.map(name).join(' > ');

function table(
  pairs: [number, number][],
  filters: SearchFilters,
  behavior?: typeof LEGACY_BEHAVIOR,
): string[] {
  return pairs.map(([from, to]) => {
    const route = findRoute(from, to, filters, behavior);
    const label = `${name(from)} -> ${name(to)}`;
    return route
      ? `${label}  [${route.nodes.length - 1} hops]  ${render(route.nodes)}`
      : `${label}  [no route]`;
  });
}

const pairs = samplePairs(120);

describe('route snapshots', () => {
  it('default filters', () => {
    expect(table(pairs, DEFAULT_FILTERS)).toMatchSnapshot();
  });

  it('agent level 5, no DLC, no Jogress', () => {
    expect(
      table(pairs.slice(0, 60), {
        ...DEFAULT_FILTERS,
        agentLevel: 5,
        includeDlc: false,
        includeJogress: false,
      }),
    ).toMatchSnapshot();
  });

  it('legacy behavior preset', () => {
    expect(table(pairs.slice(0, 60), DEFAULT_FILTERS, LEGACY_BEHAVIOR)).toMatchSnapshot();
  });

  it('alternate routes (k=3)', () => {
    const rendered = pairs.slice(0, 20).map(([from, to]) => {
      const routes = findRoutes(from, to, 3);
      return `${name(from)} -> ${name(to)}\n${routes
        .map((r, i) => `    ${i + 1}. [${r.nodes.length - 1}] ${render(r.nodes)}`)
        .join('\n')}`;
    });
    expect(rendered).toMatchSnapshot();
  });
});
