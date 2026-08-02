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
      // RSC payloads sit beside the HTML and carry the same content; keeping
      // crawlers out of them avoids duplicate-content noise.
      disallow: ['/_next/', '/*.txt$'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
