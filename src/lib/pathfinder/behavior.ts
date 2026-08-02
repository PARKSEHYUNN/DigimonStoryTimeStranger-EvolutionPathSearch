/**
 * Rollback switches for the semantic changes the rewrite made to route rules.
 *
 * The search itself is not switchable: the old A* returned longer routes than
 * exist (89 of 28,440 pairs, worst +4 hops) and there is nothing to roll back
 * to there. What *is* switchable is the three judgement calls about which hops
 * are legal, because those are arguable rather than simply wrong.
 *
 * To roll back, hand `LEGACY_BEHAVIOR` to the search — see `findRoute` in
 * ./index.ts, which takes a behavior argument and defaults to CURRENT_BEHAVIOR.
 * `legacy-behavior.test.ts` asserts the preset actually reproduces the old
 * rules, so the escape hatch is known to work rather than assumed to.
 */
export interface PathfinderBehavior {
  /**
   * How a hop is judged to be an evolution (gated) or a de-evolution (free).
   *
   * - `edge`       — by the authored direction of the evolution. Correct: the
   *                  data says which way the evolution goes.
   * - `generation` — by comparing generations, as the old worker did. This
   *                  misjudges 46 edges: 43 that stay within a generation and
   *                  3 that evolve into a lower-numbered one.
   */
  direction: 'edge' | 'generation';

  /**
   * Reject the whole query when the *starting* Digimon's own agent-level
   * requirement exceeds the player's level.
   *
   * The old worker did this. It assumes the only way to hold a Digimon is to
   * have evolved into it, so it answered "no route" for Digimon obtained by
   * other means. Turning it off makes 1,746-5,485 previously-refused queries
   * answerable, depending on level.
   */
  gateStartNode: boolean;

  /**
   * Apply the "exclude Jogress" filter to backward hops as well.
   *
   * The old worker checked it only on hops it considered evolutions, so a
   * route could still de-evolve out of a Jogress-only Digimon with the toggle
   * off — which reads as a leak in the filter.
   */
  jogressBlocksReverse: boolean;
}

export const CURRENT_BEHAVIOR: PathfinderBehavior = {
  direction: 'edge',
  gateStartNode: false,
  jogressBlocksReverse: true,
};

/** Restores the old worker's rules. See the interface docs for the trade-offs. */
export const LEGACY_BEHAVIOR: PathfinderBehavior = {
  direction: 'generation',
  gateStartNode: true,
  jogressBlocksReverse: false,
};
