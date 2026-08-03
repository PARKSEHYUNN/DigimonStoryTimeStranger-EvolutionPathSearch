/**
 * Google AdSense wiring, resolved at build time.
 *
 * The site is a static export: there is no server to read environment at
 * request time, so `next build` inlines these values into the HTML. Changing
 * one means a rebuild, not a restart — they live in the Cloudflare Pages
 * project's environment variables.
 *
 * With NEXT_PUBLIC_ADSENSE_CLIENT unset nothing about ads exists on the page:
 * no loader script, no network call, and every AdSlot stays the reserved
 * placeholder it is today. That is deliberately the default, because preview
 * deployments run on *.pages.dev — a domain AdSense has not approved — and
 * serving ads from an unapproved domain is what gets an account flagged.
 */

export type AdPlacement = 'leaderboard' | 'in-content' | 'footer';

/**
 * AdSense accepts the publisher ID as `ca-pub-…` in page code and as `pub-…`
 * in ads.txt. Both forms get pasted out of the dashboard, so take either and
 * settle on the page-code form here.
 */
function normalizeClient(raw: string | undefined): string {
  const id = raw?.trim();
  if (!id) return '';
  return id.startsWith('ca-') ? id : `ca-${id}`;
}

export const ADSENSE_CLIENT = normalizeClient(
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT,
);

/**
 * Slot IDs are per ad unit, created in the AdSense dashboard.
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
 * A placement with no slot ID configured stays empty even when the rest of
 * AdSense is live: that is how you turn a single position off without
 * touching the layout.
 */
export function adUnitFor(placement: AdPlacement): AdUnitConfig | null {
  const slot = SLOT[placement]?.trim();
  if (!ADSENSE_CLIENT || !slot) return null;
  return { client: ADSENSE_CLIENT, slot };
}
