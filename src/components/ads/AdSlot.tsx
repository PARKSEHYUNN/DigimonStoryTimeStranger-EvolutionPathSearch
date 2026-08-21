import type { CSSProperties } from 'react';
import { adUnitFor, type AdPlacement } from '@/lib/ads';
import { AdUnit } from '@/components/ads/AdUnit';

/**
 * Reserved space for a banner ad.
 *
 * The box claims its final height from first paint, before any ad script runs.
 * Inserting ads into an unreserved layout is the classic source of Cumulative
 * Layout Shift, and CLS feeds Core Web Vitals — which is the ranking signal
 * this whole rewrite exists to improve. Reserving now costs nothing; retrofitting
 * later means re-measuring every screen.
 *
 * Whether a real ad goes inside is a build-time question: with a zone
 * configured the box holds a unit, without it the box holds a placeholder and
 * the page makes no ad network requests. See lib/ads.ts.
 */
export type { AdPlacement };

/**
 * `leaderboard` reserves its two Adsterra banner zones exactly: 320x50 on
 * mobile, 728x90 on desktop — a banner is a fixed pixel size, so this cannot
 * over- or under-reserve. `in-content` and `footer` hold a Native Banner
 * instead, which has no such fixed size — Adsterra's widget renders however
 * tall its content needs, so these are a starting estimate to be revisited
 * once real creatives are live, not a measured value like the leaderboard's.
 */
const PLACEMENT_STYLE: Record<AdPlacement, CSSProperties> = {
  leaderboard: { '--ad-h': '50px', '--ad-h-md': '90px' } as CSSProperties,
  'in-content': { '--ad-h': '100px', '--ad-h-md': '90px' } as CSSProperties,
  footer: { '--ad-h': '100px', '--ad-h-md': '90px' } as CSSProperties,
};

interface AdSlotProps {
  placement: AdPlacement;
  /**
   * Hidden on small screens — for units that only make sense on desktop.
   *
   * Note this hides with `display: none`, and a hidden slot measures zero
   * width and gives up without retrying when it later becomes visible.
   * A desktop-only unit therefore stays blank for anyone who loaded the page
   * narrow and widened it. Fine for a breakpoint users rarely cross mid-visit;
   * if that changes, the fix is to mount the unit conditionally instead.
   */
  desktopOnly?: boolean;
  label?: string;
}

export function AdSlot({ placement, desktopOnly, label }: AdSlotProps) {
  const unit = adUnitFor(placement);

  // A banner is a known fixed size, so clipping to it is safe. A Native
  // Banner's height is only an estimate — clipping that would just as likely
  // cut off real ad content as absorb a layout shift, so it grows instead.
  const sizing =
    unit?.kind === 'native'
      ? '[min-block-size:var(--ad-h)] md:[min-block-size:var(--ad-h-md)]'
      : 'overflow-hidden [block-size:var(--ad-h)] md:[block-size:var(--ad-h-md)]';

  return (
    <aside
      aria-label={label ?? 'Advertisement'}
      data-ad-placement={placement}
      style={PLACEMENT_STYLE[placement]}
      className={`bg-surface-sunken/60 mx-auto flex w-full max-w-3xl items-center justify-center rounded-xl ${sizing} ${
        desktopOnly ? 'hidden md:flex' : 'flex'
      }`}
    >
      {unit ? (
        <AdUnit {...unit} />
      ) : (
        /* No zone configured — the box still holds its space. */
        <span className="text-content-muted/50 text-[0.6rem] tracking-widest uppercase select-none">
          {label ?? 'Ad'}
        </span>
      )}
    </aside>
  );
}
