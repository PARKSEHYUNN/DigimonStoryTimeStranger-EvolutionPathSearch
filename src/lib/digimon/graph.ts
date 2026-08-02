import type { Evolution } from './schema';

/**
 * A traversable step between two Digimon.
 *
 * The search walks evolutions in both directions — the old site did too, and
 * labelled the backward hops "de-evolution" — so every edge appears twice in
 * the adjacency, once per direction.
 */
export interface Step {
  /** Where this step lands. */
  target: number;
  /** The evolution being used, always stored in its authored direction. */
  evolution: Evolution;
  /**
   * True when walking the edge backwards (de-evolving).
   *
   * The legacy build inferred this by comparing generations, which misread 46
   * edges: 43 that stay within a generation and 3 that legitimately evolve into
   * a lower-numbered one (Magnamon -> Magnamon X, the two Hybrids -> Susanomon).
   * Edge direction is the authored fact, so it is used directly.
   */
  reversed: boolean;
}

export type Adjacency = ReadonlyMap<number, readonly Step[]>;

export function buildAdjacency(
  nodeIds: Iterable<number>,
  evolutions: readonly Evolution[],
): Adjacency {
  const adjacency = new Map<number, Step[]>();
  for (const id of nodeIds) adjacency.set(id, []);

  for (const evolution of evolutions) {
    adjacency
      .get(evolution.from)
      ?.push({ target: evolution.to, evolution, reversed: false });
    adjacency
      .get(evolution.to)
      ?.push({ target: evolution.from, evolution, reversed: true });
  }

  return adjacency;
}
