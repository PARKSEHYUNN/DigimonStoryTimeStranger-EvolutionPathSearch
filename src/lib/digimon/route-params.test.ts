import { describe, expect, it } from 'vitest';
import { digimons } from './data';
import {
  DEFAULT_AGENT_LEVEL,
  EMPTY_PARAMS,
  parseRouteParams,
  toSearchString,
  type RouteParams,
} from './route-params';

const bySlug = (slug: string) => {
  const digimon = digimons.find((d) => d.slug === slug);
  if (!digimon) throw new Error(`no fixture Digimon for slug ${slug}`);
  return digimon;
};

const agumon = bySlug('agumon');

/** Any Digimon that is not Agumon — the identities do not matter here. */
const nth = (index: number) => {
  const digimon = digimons.filter((d) => d.slug !== 'agumon')[index];
  if (!digimon) throw new Error('fixture data has too few Digimon');
  return digimon;
};

const other = nth(0);
const third = nth(1);

describe('parseRouteParams', () => {
  it('reads an empty query as the untouched search', () => {
    expect(parseRouteParams('')).toEqual(EMPTY_PARAMS);
  });

  it('resolves endpoints by slug', () => {
    const { start, end } = parseRouteParams(
      `?from=${agumon.slug}&to=${other.slug}`,
    );
    expect(start?.id).toBe(agumon.id);
    expect(end?.id).toBe(other.id);
  });

  it('drops a slug that no longer exists rather than failing', () => {
    // Links outlive data. A bookmark from before a rename should still open
    // with whichever half of it still resolves.
    const params = parseRouteParams(`?from=not-a-digimon&to=${agumon.slug}`);
    expect(params.start).toBeNull();
    expect(params.end?.id).toBe(agumon.id);
  });

  it('only turns the toggles off for an explicit 0', () => {
    expect(parseRouteParams('?jogress=0&dlc=0')).toMatchObject({
      includeJogress: false,
      includeDlc: false,
    });
    expect(parseRouteParams('?jogress=1&dlc=1')).toMatchObject({
      includeJogress: true,
      includeDlc: true,
    });
  });

  it('falls back to the default agent level when out of range', () => {
    for (const bad of ['0', '11', '-3', 'ten', '', '5.5']) {
      expect(parseRouteParams(`?agent=${bad}`).agentLevel).toBe(
        DEFAULT_AGENT_LEVEL,
      );
    }
    expect(parseRouteParams('?agent=1').agentLevel).toBe(1);
    expect(parseRouteParams('?agent=7').agentLevel).toBe(7);
  });

  it('reads the exclusion list and discards unknown entries', () => {
    const params = parseRouteParams(
      `?exclude=${other.slug},nope,${third.slug}`,
    );
    expect(params.excluded.map((d) => d.slug)).toEqual([
      other.slug,
      third.slug,
    ]);
  });

  it('collapses a Digimon listed twice', () => {
    const params = parseRouteParams(`?exclude=${other.slug},${other.slug}`);
    expect(params.excluded).toHaveLength(1);
  });
});

describe('toSearchString', () => {
  const params = (over: Partial<RouteParams> = {}): RouteParams => ({
    ...EMPTY_PARAMS,
    ...over,
  });

  it('writes nothing when nothing has been chosen', () => {
    expect(toSearchString(params())).toBe('');
  });

  it('omits every setting left at its default', () => {
    // The common share is two Digimon; the link should say only that.
    const qs = toSearchString(params({ start: agumon, end: other }));
    expect(qs).toBe(`from=${agumon.slug}&to=${other.slug}`);
  });

  it('writes settings only once they differ from the default', () => {
    const qs = toSearchString(
      params({ agentLevel: 3, includeJogress: false, includeDlc: false }),
    );
    expect(qs).toContain('agent=3');
    expect(qs).toContain('jogress=0');
    expect(qs).toContain('dlc=0');
  });

  it('survives a round trip', () => {
    const original = params({
      start: agumon,
      end: other,
      agentLevel: 4,
      includeJogress: false,
      includeDlc: true,
      excluded: [third],
    });
    expect(parseRouteParams(`?${toSearchString(original)}`)).toEqual(original);
  });

  it('round-trips the untouched search back to empty', () => {
    expect(parseRouteParams(`?${toSearchString(params())}`)).toEqual(
      EMPTY_PARAMS,
    );
  });
});
