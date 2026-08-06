import { describe, expect, it } from 'vitest';
import { digimons } from './data';
import { nearestApex, raisingRoutes } from './detail-routes';

const bySlug = (slug: string) => {
  const digimon = digimons.find((d) => d.slug === slug);
  if (!digimon) throw new Error(`no Digimon with slug ${slug}`);
  return digimon;
};

describe('raisingRoutes', () => {
  it('starts every route at an In-Training Digimon', () => {
    for (const slug of ['omnimon', 'wargreymon', 'greymon']) {
      for (const { from } of raisingRoutes(bySlug(slug))) {
        expect(from.generation).toBeLessThanOrEqual(1);
      }
    }
  });

  it('ends every route at the Digimon whose page it is', () => {
    const target = bySlug('omnimon');
    for (const { route } of raisingRoutes(target)) {
      expect(route.nodes.at(-1)).toBe(target.id);
    }
  });

  it('orders by length, shortest first', () => {
    const hops = raisingRoutes(bySlug('omnimon')).map((r) => r.hops);
    expect(hops).toEqual([...hops].sort((a, b) => a - b));
  });

  it('shows at most three, and never the same chain twice', () => {
    for (const slug of ['omnimon', 'agumon', 'kuramon']) {
      const routes = raisingRoutes(bySlug(slug));
      expect(routes.length).toBeLessThanOrEqual(3);
      const chains = routes.map((r) => r.route.nodes.join('-'));
      expect(new Set(chains).size).toBe(chains.length);
    }
  });

  it('never starts a route at the Digimon it is for', () => {
    // In-Training Digimon have pages too, and a route from itself is no route.
    const kuramon = bySlug('kuramon');
    for (const { from } of raisingRoutes(kuramon)) {
      expect(from.id).not.toBe(kuramon.id);
    }
  });
});

describe('nearestApex', () => {
  it('only lists Ultra level Digimon', () => {
    for (const { digimon } of nearestApex(bySlug('agumon'))) {
      expect(digimon.generation).toBe(6);
    }
  });

  it('orders by distance and caps the list', () => {
    const reach = nearestApex(bySlug('agumon'));
    expect(reach.length).toBeLessThanOrEqual(5);
    const hops = reach.map((r) => r.hops);
    expect(hops).toEqual([...hops].sort((a, b) => a - b));
  });

  it('puts a closer Digimon nearer the apex than a distant one', () => {
    // The point of the section: the distances differ per page even though
    // every Digimon can reach every apex eventually.
    const wargreymon = nearestApex(bySlug('wargreymon'))[0]!;
    const kuramon = nearestApex(bySlug('kuramon'))[0]!;
    expect(wargreymon.hops).toBeLessThan(kuramon.hops);
  });

  it('excludes the Digimon itself', () => {
    const omnimon = bySlug('omnimon');
    for (const { digimon } of nearestApex(omnimon)) {
      expect(digimon.id).not.toBe(omnimon.id);
    }
  });
});
