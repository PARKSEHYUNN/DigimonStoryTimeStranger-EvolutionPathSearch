/**
 * Writes out/ads.txt.
 *
 * ads.txt is how a domain declares who may sell its ad inventory. A missing or
 * stale one reads as "unauthorized" to demand partners, who then refuse to
 * bid — a revenue problem rather than an error anyone would notice in a build
 * log, which is why this runs unconditionally and fails loudly.
 *
 * The publisher ID comes from src/lib/ads.ts, the same constant the page code
 * uses for the ad loader. One source: the file served at /ads.txt and the ID
 * in the script tag cannot drift apart, and neither depends on a dashboard
 * setting being remembered at deploy time.
 *
 * Note this is deliberately independent of whether ads are switched on.
 * Declaring a seller and running ad code are different things: the former is
 * safe to publish anywhere, including previews.
 *
 * Usage: node scripts/write-ads-txt.mjs [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADSENSE_PUBLISHER_ID } from '../src/lib/ads.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, 'out'));

if (!fs.existsSync(OUT)) {
  console.error(`no export at ${OUT}`);
  process.exit(1);
}

if (!/^pub-\d{16}$/.test(ADSENSE_PUBLISHER_ID)) {
  console.error(
    `ADSENSE_PUBLISHER_ID is malformed: ${ADSENSE_PUBLISHER_ID}\n` +
      'expected pub- followed by 16 digits (src/lib/ads.ts)',
  );
  process.exit(1);
}

// f08c47fec0942fa0 is Google's certification authority ID — the same constant
// for every AdSense publisher, not something derived from the account.
const line = `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`;

fs.writeFileSync(path.join(OUT, 'ads.txt'), line, 'utf8');
console.log(`ads.txt written for ${ADSENSE_PUBLISHER_ID}`);
