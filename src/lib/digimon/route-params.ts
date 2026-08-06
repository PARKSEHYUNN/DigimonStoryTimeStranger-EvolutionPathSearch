import { digimonBySlug } from './data';
import type { Digimon } from './schema';

/**
 * The route search, expressed as a query string.
 *
 * Without this the search lives entirely in React state: refreshing loses it,
 * and there is no way to hand someone a result — the best you can do is tell
 * them what to type. A tool whose whole output cannot be linked to is a tool
 * nobody quotes.
 *
 * Slugs rather than numeric IDs. They already name the detail pages, they
 * survive a data re-import that renumbers things, and `?from=agumon&to=omnimon`
 * reads as what it is when pasted into a chat.
 */

/** Agent levels the game exposes. Also the accepted range when parsing. */
export const AGENT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const DEFAULT_AGENT_LEVEL = 10;

export interface RouteParams {
  start: Digimon | null;
  end: Digimon | null;
  agentLevel: number;
  includeJogress: boolean;
  includeDlc: boolean;
  excluded: Digimon[];
}

export const EMPTY_PARAMS: RouteParams = {
  start: null,
  end: null,
  agentLevel: DEFAULT_AGENT_LEVEL,
  includeJogress: true,
  includeDlc: true,
  excluded: [],
};

const lookup = (slug: string | null): Digimon | null =>
  (slug && digimonBySlug.get(slug)) || null;

/**
 * Reads a query string into search state.
 *
 * Deliberately forgiving: a URL arrives from someone else's chat message, a
 * bookmark from before a data update, or a hand-edit. Anything unrecognised is
 * dropped and the rest still applies, because a half-understood link is worth
 * more to the reader than an error page.
 */
export function parseRouteParams(search: string): RouteParams {
  const q = new URLSearchParams(search);

  const agent = Number(q.get('agent'));
  const agentLevel = (AGENT_LEVELS as readonly number[]).includes(agent)
    ? agent
    : DEFAULT_AGENT_LEVEL;

  const excluded = (q.get('exclude') ?? '')
    .split(',')
    .map((slug) => lookup(slug.trim()))
    .filter((d): d is Digimon => d !== null);

  return {
    start: lookup(q.get('from')),
    end: lookup(q.get('to')),
    agentLevel,
    // Both default to on, so only the "0" that turns them off is ever written.
    includeJogress: q.get('jogress') !== '0',
    includeDlc: q.get('dlc') !== '0',
    // A Digimon listed twice would be excluded twice over; the set the search
    // builds from this does not care, but the chip list would show duplicates.
    excluded: excluded.filter(
      (d, i) => excluded.findIndex((o) => o.id === d.id) === i,
    ),
  };
}

/**
 * Writes search state back to a query string, defaults omitted.
 *
 * Omitting defaults is what keeps a shared link legible: the common case is
 * two Digimon and nothing else, and `?from=agumon&to=omnimon` should not carry
 * three parameters restating the settings the reader never touched.
 *
 * Returns "" when nothing is set, so the caller can drop the "?" entirely.
 *
 * Only what changes the answer goes in. The silhouette toggle is left out on
 * purpose — it is a viewing preference like dark mode, not part of the query,
 * and a link should not impose it on whoever opens it.
 */
export function toSearchString(params: RouteParams): string {
  const q = new URLSearchParams();

  if (params.start) q.set('from', params.start.slug);
  if (params.end) q.set('to', params.end.slug);
  if (params.agentLevel !== DEFAULT_AGENT_LEVEL) {
    q.set('agent', String(params.agentLevel));
  }
  if (!params.includeJogress) q.set('jogress', '0');
  if (!params.includeDlc) q.set('dlc', '0');
  if (params.excluded.length > 0) {
    q.set('exclude', params.excluded.map((d) => d.slug).join(','));
  }

  return q.toString();
}
