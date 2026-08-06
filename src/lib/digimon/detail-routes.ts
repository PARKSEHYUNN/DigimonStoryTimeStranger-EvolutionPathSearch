import { DEFAULT_FILTERS, findRoutes, type Route } from '@/lib/pathfinder';
import { digimons, evolutions } from './data';
import { BOND_KEYS, STAT_KEYS, type Digimon, type Evolution } from './schema';

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
export const ROUTES_SHOWN = 3;

/**
 * Distinct per Digimon, unlike the full reachable set — see nearestApex.
 *
 * Nine rather than five because the ordering was quietly deciding what appears
 * at all. Agumon has nine Ultras at four steps, so a list of five cut four of
 * them, and the ones cut were the Jogress ones — Omnimon among them, off the
 * page of the Digimon it is most associated with. Across the site that left 48
 * pages showing no Jogress option whatever; at nine it is one.
 *
 * Nine is where the curve flattens. Ten clears the last page but costs every
 * one of the 475 an extra row to do it.
 */
export const APEX_SHOWN = 9;

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
   * How demanding the final hop's thresholds are, from 0 upwards.
   *
   * Raw numbers cannot be compared across stats: HP requirements run to 4,900
   * where SP tops out at 2,660, so summing them would mark every HP-gated
   * evolution as the hardest by arithmetic alone. Each requirement is scored
   * against the largest the game ever asks for that same stat, and the shares
   * are added — which captures both how high the bars are and how many of
   * them there are.
   *
   * Ranks below this rather than above it, deliberately. 856 of the entries
   * shown have no stat requirements at all because they are Jogress: the cost
   * is a whole second Digimon, not a threshold. Sorting on thresholds first
   * would float exactly those to the top as the "easiest".
   */
  conditionLoad: number;

  /**
   * The hop that arrives at this Digimon, so its requirements can be shown.
   *
   * Note the DLC caveat: owning the DLC removes an evolution's requirements
   * rather than adding a shortcut, and the data does not model that yet — so
   * these thresholds describe the non-DLC path. Revisit when DLC gains the
   * per-evolution detail to express it.
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
 * The largest value the game ever demands of each stat, so requirements can be
 * scored as a share of it rather than compared as raw numbers.
 */
const REQUIREMENT_CEILING = new Map<string, number>();
for (const evolution of evolutions) {
  for (const key of [...STAT_KEYS, ...BOND_KEYS]) {
    const value = evolution.conditions[key];
    if (value === undefined) continue;
    REQUIREMENT_CEILING.set(
      key,
      Math.max(REQUIREMENT_CEILING.get(key) ?? 0, value),
    );
  }
}

/** How demanding an evolution's thresholds are — see ApexReach.conditionLoad. */
function conditionLoadOf(evolution: Evolution | null): number {
  if (!evolution) return 0;

  let load = 0;
  for (const key of [...STAT_KEYS, ...BOND_KEYS]) {
    const value = evolution.conditions[key];
    if (value === undefined) continue;
    const ceiling = REQUIREMENT_CEILING.get(key);
    if (ceiling) load += value / ceiling;
  }
  return load;
}

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

/**
 * The Ultra-level Digimon this one can reach soonest.
 *
 * Nearest rather than reachable, because every Digimon in the game can reach
 * every one of the 30 — listing them would print the same block on all 475
 * pages, which is duplicate content rather than content. The distances are
 * what differ: WarGreymon reaches Omnimon in one step, Kuramon in six.
 */
export function nearestApex(from: Digimon): ApexReach[] {
  const cached = apexCache.get(from.id);
  if (cached) return cached;

  const reached: ApexReach[] = [];

  for (const digimon of apexes) {
    if (digimon.id === from.id) continue;
    const [route] = findRoutes(from.id, digimon.id, 1, DEFAULT_FILTERS);
    if (!route) continue;

    const last = route.steps.at(-1);
    const finalStep = last && !last.reversed ? last.evolution : null;
    reached.push({
      digimon,
      hops: route.nodes.length - 1,
      extraDigimon: extraDigimonNeeded(route),
      conditionLoad: conditionLoadOf(finalStep),
      finalStep,
    });
  }

  // Fewest steps, then fewest Digimon to raise, then the gentlest thresholds.
  // Two thirds of the entries still tied after the first two, so the third
  // decides most of the remaining order. The id is a tiebreak of last resort,
  // kept only so the build is deterministic.
  reached.sort(
    (a, b) =>
      a.hops - b.hops ||
      a.extraDigimon - b.extraDigimon ||
      a.conditionLoad - b.conditionLoad ||
      a.digimon.id - b.digimon.id,
  );

  const nearest = reached.slice(0, APEX_SHOWN);
  apexCache.set(from.id, nearest);
  return nearest;
}
