'use client';

import { useEffect, useRef } from 'react';
import type { AdUnitConfig, BannerUnit, BannerZone, NativeUnit } from '@/lib/ads';

declare global {
  interface Window {
    atOptions?: {
      key: string;
      format: string;
      height: number;
      width: number;
      params: Record<string, unknown>;
    };
  }
}

/** Matches the breakpoint AdSlot's own CSS switches its reserved height on. */
const DESKTOP_BREAKPOINT = 768;

/** Dispatches to the embed Adsterra actually uses for this zone type. */
export function AdUnit(unit: AdUnitConfig) {
  if (unit.kind === 'native') return <NativeAdUnit {...unit} />;
  return <BannerAdUnit {...unit} />;
}

/**
 * One Adsterra banner, filling the box AdSlot reserved for it.
 *
 * Adsterra's snippet is two plain <script> tags: one sets a global
 * `atOptions`, the next — an "invoke.js" scoped to that zone's key — reads it
 * synchronously to know what to draw. There is no per-instance handle to
 * pass options through, so nothing else may write `atOptions` between the
 * two, which is why this waits for its own script to finish loading before
 * anything else on the page could reuse the global for a different zone. A
 * page here never carries two banner placements at once for exactly that
 * reason — see lib/ads.ts.
 *
 * Both tags are created imperatively rather than written into JSX: a script
 * element made this way defaults to `async = true`, which is also how you
 * opt into Chrome's "ignored document.write in an async script" intervention
 * for third-party scripts. Setting it false keeps this one running the same
 * way it would from a plain, synchronous <script> in static HTML.
 */
function BannerAdUnit({ desktop, mobile }: BannerUnit) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requested = useRef(false);

  useEffect(() => {
    // Strict Mode runs effects twice; a second injection would draw the
    // banner twice into the same box.
    if (requested.current) return;
    requested.current = true;

    const container = containerRef.current;
    if (!container) return;

    const zone: BannerZone =
      window.innerWidth >= DESKTOP_BREAKPOINT ? desktop : mobile;

    window.atOptions = {
      key: zone.key,
      format: 'iframe',
      height: zone.height,
      width: zone.width,
      params: {},
    };

    const script = document.createElement('script');
    script.async = false;
    script.src = `https://www.highperformanceformat.com/${zone.key}/invoke.js`;
    container.appendChild(script);
  }, [desktop, mobile]);

  return <div ref={containerRef} />;
}

/**
 * One Adsterra Native Banner.
 *
 * Unlike the banner zone, this one carries no shared global to race: the
 * script finds its target by a fixed `id` baked into the script itself
 * (`container-<key>`), so two of these — even the same zone twice on
 * different pages, which is what in-content and footer do — never collide.
 * That is also why it can run genuinely async, `data-cfasync="false"` and
 * all, exactly as Adsterra hands it out.
 */
function NativeAdUnit({ containerId, scriptSrc }: NativeUnit) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const script = document.createElement('script');
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = scriptSrc;
    wrapperRef.current?.appendChild(script);
  }, [scriptSrc]);

  return (
    <div ref={wrapperRef} className="w-full">
      <div id={containerId} />
    </div>
  );
}
