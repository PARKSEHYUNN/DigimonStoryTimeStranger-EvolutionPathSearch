'use client';

import { useEffect, useRef } from 'react';
import type { AdUnitConfig } from '@/lib/ads';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One AdSense display unit, filling the box AdSlot reserved for it.
 *
 * Sizing is left entirely to CSS. The <ins> is 100% of a parent whose height
 * is already pinned to a standard unit height, so AdSense measures a fixed
 * box and picks a horizontal creative that fits inside it. The alternative —
 * `data-ad-format="auto"` with a free height — lets the creative decide how
 * tall the page gets after load, which is the layout shift the reserved box
 * exists to prevent.
 *
 * `data-full-width-responsive="false"` keeps it from ignoring that box and
 * going edge-to-edge on phones.
 */
export function AdUnit({ client, slot }: AdUnitConfig) {
  const requested = useRef(false);

  useEffect(() => {
    // Strict Mode runs effects twice. A second push against an <ins> that
    // already has one throws "All 'ins' elements in the DOM with class=
    // adsbygoogle already have ads in them" and kills the rest of the queue.
    if (requested.current) return;
    requested.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // Loader blocked, offline, or an ad blocker. The reserved box simply
      // stays empty — nothing else on the page depends on this.
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', width: '100%', height: '100%' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="horizontal"
      data-full-width-responsive="false"
    />
  );
}
