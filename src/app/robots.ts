import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Metadata routes are request handlers by default; `output: 'export'` needs
// them pinned to build time so the file is written into out/.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',

      // Only the RSC payloads. They sit beside the HTML as `index.txt`,
      // carry the same content, and are worth keeping out of the index.
      //
      // `/_next/` is deliberately NOT listed. Every stylesheet and script the
      // site loads lives under /_next/static/, and Google renders a page
      // before judging it — blocking those leaves the crawler looking at
      // unstyled markup and reporting the page as not mobile-friendly. It
      // never protected anything either: there is not a single .txt payload
      // under /_next/, so the rule below already covers what this one was
      // written for.
      disallow: ['/*.txt$'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
