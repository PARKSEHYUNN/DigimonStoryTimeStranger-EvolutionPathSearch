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
 * Whether a real ad goes inside is a build-time question: with AdSense
 * configured the box holds a unit, without it the box holds a placeholder and
 * the page makes no ad network requests. See lib/ads.ts.
 */
export type { AdPlacement };

/**
 * Heights are the standard unit sizes plus nothing else — the box is exactly
 * as tall as the creative it will hold, so reserving cannot over-reserve.
 *
 *   mobile  320x100 (large mobile banner)
 *   desktop 728x90  (leaderboard)
 */
const PLACEMENT_STYLE: Record<AdPlacement, CSSProperties> = {
  leaderboard: { '--ad-h': '100px', '--ad-h-md': '90px' } as CSSProperties,
  'in-content': { '--ad-h': '100px', '--ad-h-md': '90px' } as CSSProperties,
  footer: { '--ad-h': '100px', '--ad-h-md': '90px' } as CSSProperties,
};

interface AdSlotProps {
  placement: AdPlacement;
  /**
   * Hidden on small screens — for units that only make sense on desktop.
   *
   * Note this hides with `display: none`, and AdSense measures zero width for
   * such a slot and gives up without retrying when it later becomes visible.
   * A desktop-only unit therefore stays blank for anyone who loaded the page
   * narrow and widened it. Fine for a breakpoint users rarely cross mid-visit;
   * if that changes, the fix is to mount the unit conditionally instead.
   */
  desktopOnly?: boolean;
  label?: string;
}

export function AdSlot({ placement, desktopOnly, label }: AdSlotProps) {
  const unit = adUnitFor(placement);

  return (
    <aside
      aria-label={label ?? 'Advertisement'}
      data-ad-placement={placement}
      style={PLACEMENT_STYLE[placement]}
      className={`bg-surface-sunken/60 mx-auto flex w-full max-w-3xl items-center justify-center overflow-hidden rounded-xl [block-size:var(--ad-h)] md:[block-size:var(--ad-h-md)] ${
        desktopOnly ? 'hidden md:flex' : 'flex'
      }`}
    >
      {unit ? (
        <AdUnit client={unit.client} slot={unit.slot} />
      ) : (
        /* No AdSense configured — the box still holds its space. */
        <span className="text-content-muted/50 text-[0.6rem] tracking-widest uppercase select-none">
          {label ?? 'Ad'}
        </span>
      )}
    </aside>
  );
}
