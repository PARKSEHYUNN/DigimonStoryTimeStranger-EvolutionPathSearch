import { ADSENSE_CLIENT } from '@/lib/ads';

/**
 * The AdSense loader, once per document.
 *
 * This is the same snippet the AdSense dashboard hands out for site
 * verification, so its presence is what makes the review pass — the ad units
 * themselves are not required for that step.
 *
 * A plain async script rather than `next/script`: it belongs in <head> of a
 * server-rendered document with no client component to host it, which is the
 * same reason Analytics.tsx emits a raw tag.
 *
 * Unset client ID renders nothing at all — see lib/ads.ts.
 */
export function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}
