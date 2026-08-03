/**
 * Google AdSense wiring.
 *
 * Two separate questions live here, and conflating them is the mistake this
 * file is arranged to avoid:
 *
 *   1. Who is allowed to sell this domain's ad inventory? — a public fact,
 *      committed below and published at /ads.txt on every deploy.
 *   2. Should this build actually run ad code? — an environment decision,
 *      because running ads on a domain AdSense has not approved is a policy
 *      problem, and preview deployments are exactly that.
 *
 * The site is a static export, so the answer to (2) is inlined by `next build`
 * and changing it means a rebuild, not a restart.
 */

/**
 * The AdSense publisher ID.
 *
 * Committed rather than configured: it is public by design. It is served at
 * /ads.txt for any advertiser to read and appears in the loader URL on every
 * page — there is nothing here to protect. Keeping it in the repo is what
 * makes /ads.txt correct on every deploy with no dashboard step, which is the
 * whole point of the file: an ads.txt that is missing or stale reads as
 * "unauthorized" to demand partners and caps what they will bid.
 *
 * ads.txt wants this bare `pub-…` form; page code wants it prefixed.
 */
export const ADSENSE_PUBLISHER_ID = 'pub-1963786647016806';

/** The same ID in the `ca-pub-…` form the ad loader and ad units expect. */
export const ADSENSE_CLIENT = `ca-${ADSENSE_PUBLISHER_ID}`;

/**
 * Whether this build loads the AdSense script at all.
 *
 * Off unless NEXT_PUBLIC_ADSENSE_ENABLED is exactly "true", so the safe state
 * is the default one: no loader, no network call, and every AdSlot stays the
 * reserved placeholder it is without ads. Set it on the production deploy
 * only — never on previews, which serve from *.pages.dev.
 */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';

export type AdPlacement = 'leaderboard' | 'in-content' | 'footer';

/**
 * Slot IDs, one per ad unit created in the AdSense dashboard.
 *
 * Indexed access (`process.env[name]`) does not survive the build — Next
 * replaces literal `process.env.NEXT_PUBLIC_*` member reads and nothing else,
 * so each one has to be spelled out.
 */
const SLOT: Record<AdPlacement, string | undefined> = {
  leaderboard: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD,
  'in-content': process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT,
  footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER,
};

export interface AdUnitConfig {
  client: string;
  slot: string;
}

/**
 * The unit to render at `placement`, or null to leave the box a placeholder.
 *
 * A placement with no slot ID configured stays empty even when ads are on:
 * that is how a single position is turned off without touching the layout.
 */
export function adUnitFor(placement: AdPlacement): AdUnitConfig | null {
  const slot = SLOT[placement]?.trim();
  if (!ADS_ENABLED || !slot) return null;
  return { client: ADSENSE_CLIENT, slot };
}
