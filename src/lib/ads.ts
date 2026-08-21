/**
 * Adsterra wiring.
 *
 * Adsterra has no single site-wide loader the way AdSense's adsbygoogle.js
 * was, and no publisher-level ID to declare either — Adsterra does not
 * provide ads.txt files, so there is nothing here for one. Each placement is
 * its own self-contained embed tied to one ad zone, and the two zone types in
 * use here work differently enough to need separate handling:
 *
 *   - A banner zone (leaderboard) is a fixed pixel size and reads a global
 *     `atOptions` the instant its script runs — see AdUnit.tsx for why that
 *     means never mounting two banners on the same page at once.
 *   - A Native Banner zone (in-content, footer) targets a `<div>` by a fixed
 *     id baked into its own script, and doesn't share global state with
 *     anything else — safe to mount more than once, including alongside a
 *     banner.
 *
 * The site is a static export, so whether ads run at all is inlined by
 * `next build` — changing it means a rebuild, not a restart.
 */

/**
 * Whether this build loads any ad code at all.
 *
 * Off unless NEXT_PUBLIC_ADS_ENABLED is exactly "true", so the safe state is
 * the default one: no ad script, no network call, and every AdSlot stays the
 * reserved placeholder it is without ads. Set it on the production deploy
 * only — never on previews, which serve from *.pages.dev.
 */
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';

export type AdPlacement = 'leaderboard' | 'in-content' | 'footer';

/** One Adsterra banner zone: a size and the key it was created under. */
export interface BannerZone {
  key: string;
  width: number;
  height: number;
}

/** A placement rendered as a banner, swapped by viewport at mount. */
export interface BannerUnit {
  kind: 'banner';
  desktop: BannerZone;
  mobile: BannerZone;
}

/** A placement rendered as a Native Banner: a script and the div it fills. */
export interface NativeUnit {
  kind: 'native';
  containerId: string;
  scriptSrc: string;
}

export type AdUnitConfig = BannerUnit | NativeUnit;

/**
 * The leaderboard's two zones — 728x90 for desktop, 320x50 for mobile.
 * Adsterra banner zones are one fixed size each, unlike an AdSense slot that
 * could pick a creative to fit any reserved box, so covering both
 * breakpoints takes two zones rather than one.
 */
const LEADERBOARD_DESKTOP_KEY = process.env.NEXT_PUBLIC_ADSTERRA_LEADERBOARD_DESKTOP_KEY;
const LEADERBOARD_MOBILE_KEY = process.env.NEXT_PUBLIC_ADSTERRA_LEADERBOARD_MOBILE_KEY;

/**
 * One Native Banner zone, shared by `in-content` and `footer`. Reusing the
 * same zone in two spots is fine here specifically because they never appear
 * on the same page: `in-content` is the home screen's only, `footer` is the
 * detail pages' only.
 */
const NATIVE_CONTAINER_ID = process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_CONTAINER_ID;
const NATIVE_SCRIPT_SRC = process.env.NEXT_PUBLIC_ADSTERRA_NATIVE_SCRIPT_SRC;

/**
 * The unit to render at `placement`, or null to leave the box a placeholder.
 *
 * The leaderboard's two zone keys are required together: a banner missing
 * its mobile or desktop half would leave one breakpoint with no ad and no way
 * to say so, so an incomplete pair is treated the same as none.
 */
export function adUnitFor(placement: AdPlacement): AdUnitConfig | null {
  if (!ADS_ENABLED) return null;

  if (placement === 'leaderboard') {
    if (!LEADERBOARD_DESKTOP_KEY || !LEADERBOARD_MOBILE_KEY) return null;
    return {
      kind: 'banner',
      desktop: { key: LEADERBOARD_DESKTOP_KEY, width: 728, height: 90 },
      mobile: { key: LEADERBOARD_MOBILE_KEY, width: 320, height: 50 },
    };
  }

  if (!NATIVE_CONTAINER_ID || !NATIVE_SCRIPT_SRC) return null;
  return { kind: 'native', containerId: NATIVE_CONTAINER_ID, scriptSrc: NATIVE_SCRIPT_SRC };
}
