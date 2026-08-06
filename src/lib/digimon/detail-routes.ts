import { DEFAULT_FILTERS, findRoutes, type Route } from '@/lib/pathfinder';
import { digimons } from './data';
import type { Digimon, Evolution } from './schema';

/**
 * The route content on a Digimon's page, computed at build time.
 *
 * The detail pages only ever showed one hop in each direction, so the thing
 * this site is actually for — the shortest path — was absent from all 1,425 of
 * them. They are also the thinnest pages here: unique body text runs 342
 * characters at the median and under 200 on 46 of them, which is not enough to
 * rank against the established English Digimon wikis.
 *
 * This answers the query people actually type. Nobody searches "Agumon to
 * Omnimon"; they search "how to get Omnimon", and the page for that query is
 * the target's own page.
 */

/** Rookie tiers — where a playthrough starts. Both In-Training levels. */
const SEED_MAX_GENERATION = 1;

/** Ultra level: the apex the "what can this become" question is really about. */
const APEX_GENERATION = 6;

/** Enough to show there is a choice, few enough that they do not read alike. */
const ROUTES_SHOWN = 3;

/** Distinct per Digimon, unlike the full reachable set — see nearestApex. */
const APEX_SHOWN = 5;

const seeds = digimons.filter((d) => d.generation <= SEED_MAX_GENERATION);
const apexes = digimons.filter((d) => d.generation === APEX_GENERATION);

export interface RaisingRoute {
  /** Where the route starts — one of the In-Training Digimon. */
  from: Digimon;
  route: Route;
  hops: number;
}

export interface ApexReach {
  digimon: Digimon;
  hops: number;
  /**
   * How many Digimon beyond this route's own chain the player has to raise.
   *
   * Jogress needs a partner standing beside the line being raised, and that
   * partner is a whole second playthrough of levelling. Two apexes at the same
   * step count are not the same amount of work when one of them wants an extra
   * Digimon, and 82% of the entries shown tie on step count — without this the
   * order among them came down to internal ID, which is to say nothing at all.
   *
   * Partners already on the route do not count: they are being raised anyway.
   */
  extraDigimon: number;

  /**
   * The hop that arrives at this Digimon, so its requirements can be shown.
   *
   * A step count on its own misleads badly here. Agumon reaches Agumon (Bond
   * of Bravery) in "1 step", which reads as trivial, while the edge actually
   * demands agent level 8 and 3,630 attack. Jogress is worse: Omnimon in "1
   * step" hides that a second fully raised Digimon has to exist alongside the
   * first. The requirements are in the data — they were simply never shown.
   *
   * Null when the last hop is a de-evolution, which carries no requirements.
   */
  finalStep: Evolution | null;
}

/**
 * Every page is rendered once per locale, and the routes do not depend on
 * language. Without this the build would repeat all 23,750 searches three
 * times over for identical answers.
 */
const raisingCache = new Map<number, RaisingRoute[]>();
const apexCache = new Map<number, ApexReach[]>();

/**
 * The shortest ways to end up with this Digimon, starting from a fresh one.
 *
 * One route per starting point rather than several from the same one: three
 * variations on the same opening read as padding, whereas three different
 * In-Training Digimon is genuinely three answers.
 *
 * Routes may include de-evolution steps. That is not a bug to filter out —
 * this game allows it and it is sometimes the shortest way, which is the whole
 * premise of the search. The chain labels those hops.
 */
export function raisingRoutes(target: Digimon): RaisingRoute[] {
  const cached = raisingCache.get(target.id);
  if (cached) return cached;

  const found: RaisingRoute[] = [];

  for (const from of seeds) {
    if (from.id === target.id) continue;
    const [route] = findRoutes(from.id, target.id, 1, DEFAULT_FILTERS);
    if (route) found.push({ from, route, hops: route.nodes.length - 1 });
  }

  found.sort((a, b) => a.hops - b.hops || a.from.id - b.from.id);

  // Two starting points can converge on the same chain; showing it twice
  // would look like the list is padded.
  const seen = new Set<string>();
  const routes = found
    .filter((r) => {
      const key = r.route.nodes.join('-');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, ROUTES_SHOWN);

  raisingCache.set(target.id, routes);
  return routes;
}

/**
 * The Ultra-level Digimon this one can reach soonest.
 *
 * Nearest rather than reachable, because every Digimon in the game can reach
 * every one of the 30 — listing them would print the same block on all 475
 * pages, which is duplicate content rather than content. The distances are
 * what differ: WarGreymon reaches Omnimon in one step, Kuramon in six.
 */
/** Jogress partners a route needs that are not already part of it. */
function extraDigimonNeeded(route: Route): number {
  const onRoute = new Set(route.nodes);
  const extra = new Set<number>();

  for (const step of route.steps) {
    // A de-evolution asks nothing of the player, partners included.
    if (!step || step.reversed) continue;
    for (const partner of step.evolution.conditions.jogress ?? []) {
      if (!onRoute.has(partner.id)) extra.add(partner.id);
    }
  }

  return extra.size;
}

export function nearestApex(from: Digimon): ApexReach[] {
  const cached = apexCache.get(from.id);
  if (cached) return cached;

  const reached: ApexReach[] = [];

  for (const digimon of apexes) {
    if (digimon.id === from.id) continue;
    const [route] = findRoutes(from.id, digimon.id, 1, DEFAULT_FILTERS);
    if (!route) continue;

    const last = route.steps.at(-1);
    reached.push({
      digimon,
      hops: route.nodes.length - 1,
      extraDigimon: extraDigimonNeeded(route),
      finalStep: last && !last.reversed ? last.evolution : null,
    });
  }

  // Fewest steps, then fewest Digimon to raise. The id is only a tiebreak of
  // last resort, kept so the build is deterministic.
  reached.sort(
    (a, b) =>
      a.hops - b.hops ||
      a.extraDigimon - b.extraDigimon ||
      a.digimon.id - b.digimon.id,
  );

  const nearest = reached.slice(0, APEX_SHOWN);
  apexCache.set(from.id, nearest);
  return nearest;
}
