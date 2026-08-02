import type { CSSProperties } from 'react';

/**
 * Reserved space for a banner ad.
 *
 * The box claims its final height from first paint, before any ad script runs.
 * Inserting ads into an unreserved layout is the classic source of Cumulative
 * Layout Shift, and CLS feeds Core Web Vitals — which is the ranking signal
 * this whole rewrite exists to improve. Reserving now costs nothing; retrofitting
 * later means re-measuring every screen.
 *
 * No network calls are made yet. To go live, drop the provider's script into
 * the locale layout and render the unit inside `children` here; nothing else
 * about the layout has to move.
 */
export type AdPlacement = 'leaderboard' | 'in-content' | 'footer';

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
  /** Hidden on small screens — for units that only make sense on desktop. */
  desktopOnly?: boolean;
  label?: string;
}

export function AdSlot({ placement, desktopOnly, label }: AdSlotProps) {
  return (
    <aside
      aria-label={label ?? 'Advertisement'}
      data-ad-placement={placement}
      style={PLACEMENT_STYLE[placement]}
      className={`mx-auto flex w-full max-w-3xl items-center justify-center overflow-hidden rounded-xl bg-surface-sunken/60 [block-size:var(--ad-h)] md:[block-size:var(--ad-h-md)] ${
        desktopOnly ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Placeholder until a provider is wired up. Swap for the ad unit. */}
      <span className="text-[0.6rem] tracking-widest text-content-muted/50 uppercase select-none">
        {label ?? 'Ad'}
      </span>
    </aside>
  );
}
