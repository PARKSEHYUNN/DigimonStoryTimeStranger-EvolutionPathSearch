/**
 * Cloudflare Web Analytics beacon.
 *
 * Replaces `@vercel/analytics`, which measures nothing once the site is not on
 * Vercel. Cloudflare's version is cookie-less and sends no personal data, so it
 * needs no consent banner.
 *
 * There are two ways to get this beacon onto the page and running both would
 * double every pageview:
 *
 *   1. Turn Web Analytics on for the Pages project. Cloudflare injects the
 *      script at the edge and this component must stay disabled.
 *   2. Set NEXT_PUBLIC_CF_BEACON_TOKEN at build time and this component emits
 *      it — the option that also works behind a proxy or on another host.
 *
 * Unset, it renders nothing at all: no token, no request, no placeholder.
 */
const TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export function Analytics() {
  if (!TOKEN) return null;

  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: TOKEN })}
    />
  );
}
