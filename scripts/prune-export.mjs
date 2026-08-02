/**
 * Removes RSC segment-prefetch artifacts that a static export can never serve.
 *
 * Next 16 writes per-route segment payloads as a nested directory:
 *
 *   out/ko/__next.$d$locale/__PAGE__.txt
 *
 * but the client asks for them dot-joined and flat:
 *
 *   /ko/__next.$d$locale.__PAGE__.txt   -> 404
 *
 * The names never line up, so every Link prefetch misses and the files are
 * dead weight. For this site that was 12,877 files and 80 MB — more than half
 * the deployment, and a real problem against Cloudflare Pages' 20,000-file
 * limit on the free plan.
 *
 * `index.txt`, the ordinary RSC payload client-side navigation actually uses,
 * is left alone; it resolves 200 and is what makes soft navigation work.
 *
 * Re-check after upgrading Next: if the path mismatch is fixed upstream, drop
 * this and let the segment cache do its job.
 *
 * Usage: node scripts/prune-export.mjs [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] ?? 'out');

if (!fs.existsSync(OUT)) {
  console.error(`no export at ${OUT}`);
  process.exit(1);
}

let files = 0;
let bytes = 0;

/** Anything Next named as a segment-prefetch artifact. */
const isSegmentArtifact = (name) => name.startsWith('__next.');

function measure(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    files++;
    bytes += stat.size;
    return;
  }
  for (const entry of fs.readdirSync(target)) {
    measure(path.join(target, entry));
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (isSegmentArtifact(entry.name)) {
      measure(full);
      fs.rmSync(full, { recursive: true, force: true });
      continue;
    }

    if (entry.isDirectory()) walk(full);
  }
}

walk(OUT);

const remaining = (function count(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? count(path.join(dir, entry.name)) : 1;
  }
  return n;
})(OUT);

console.log(
  `pruned ${files.toLocaleString()} segment file(s), ${(bytes / 1024 / 1024).toFixed(1)} MB`,
);
console.log(`${remaining.toLocaleString()} files remain in ${path.basename(OUT)}/`);
