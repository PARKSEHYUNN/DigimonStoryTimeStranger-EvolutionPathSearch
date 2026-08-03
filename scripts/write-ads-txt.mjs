/**
 * Writes out/ads.txt from NEXT_PUBLIC_ADSENSE_CLIENT.
 *
 * ads.txt is how a domain declares who is allowed to sell its inventory.
 * Without it AdSense reports the site as "unauthorized" and most demand
 * partners refuse to bid, so a missing file is a revenue problem rather than
 * an error anyone would notice in a build log.
 *
 * It is generated rather than committed to public/ because the publisher ID
 * is an account secret-ish value that belongs in the deploy environment, in
 * the same place as the ID the page code already reads. One source, no chance
 * of the two drifting apart.
 *
 * With no publisher ID set this writes nothing and says so — the same
 * ads-are-off default the rest of the wiring takes.
 *
 * Usage: node scripts/write-ads-txt.mjs [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] ?? 'out');

if (!fs.existsSync(OUT)) {
  console.error(`no export at ${OUT}`);
  process.exit(1);
}

// ads.txt wants the bare `pub-…` form; page code wants `ca-pub-…`. Accept
// either from the environment so it can be pasted straight from the dashboard.
const publisherId = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '')
  .trim()
  .replace(/^ca-/, '');

if (!publisherId) {
  console.log('ads.txt skipped — NEXT_PUBLIC_ADSENSE_CLIENT is not set');
  process.exit(0);
}

if (!/^pub-\d{16}$/.test(publisherId)) {
  console.error(
    `NEXT_PUBLIC_ADSENSE_CLIENT is malformed: ${publisherId}\n` +
      'expected ca-pub- followed by 16 digits',
  );
  process.exit(1);
}

// f08c47fec0942fa0 is Google's certification authority ID — the same constant
// for every AdSense publisher, not something derived from the account.
const line = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;

fs.writeFileSync(path.join(OUT, 'ads.txt'), line, 'utf8');
console.log(`ads.txt written for ${publisherId}`);
