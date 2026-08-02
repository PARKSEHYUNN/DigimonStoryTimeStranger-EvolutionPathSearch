import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig: NextConfig = {
  // Fully static site: no server runtime, deployed as plain files to
  // Cloudflare Pages. Every route is prerendered at build time.
  output: 'export',

  // Cloudflare Pages serves `foo/index.html` for `/foo/`; trailing slashes
  // keep Next's generated links and the served paths in agreement.
  trailingSlash: true,

  // The default next/image loader needs a server. Icons are pre-converted to
  // WebP at build time by scripts/optimize-icons.mjs instead.
  images: { unoptimized: true },
};

export default withNextIntl(nextConfig);
