/**
 * Converts the legacy Digimon icon PNGs to WebP.
 *
 * The originals are 256x256 PNGs averaging 96 KB, 45 MB for the set. The list
 * grid renders them at 48-80 CSS px while downloading the full-size original,
 * so a smaller thumbnail variant is emitted alongside the full one.
 *
 *   public/icons/{id}.webp        256px — detail pages
 *   public/icons/thumb/{id}.webp  128px — list and picker grids
 *
 * Usage: node scripts/optimize-icons.mjs [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'legacy', 'public', 'digimon_icons');
const FULL = path.join(ROOT, 'public', 'icons');
const THUMB = path.join(FULL, 'thumb');

const force = process.argv.includes('--force');

if (!fs.existsSync(SOURCE)) {
  console.error(`source icons not found at ${SOURCE}`);
  process.exit(1);
}

fs.mkdirSync(FULL, { recursive: true });
fs.mkdirSync(THUMB, { recursive: true });

const sources = fs
  .readdirSync(SOURCE)
  .filter((f) => /^\d+\.png$/i.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));

let before = 0;
let after = 0;
let skipped = 0;

console.log(`converting ${sources.length} icons...`);

await Promise.all(
  sources.map(async (file) => {
    const id = parseInt(file);
    const src = path.join(SOURCE, file);
    const fullOut = path.join(FULL, `${id}.webp`);
    const thumbOut = path.join(THUMB, `${id}.webp`);

    before += fs.statSync(src).size;

    if (!force && fs.existsSync(fullOut) && fs.existsSync(thumbOut)) {
      skipped++;
      after += fs.statSync(fullOut).size + fs.statSync(thumbOut).size;
      return;
    }

    // Icons are flat artwork on transparency; near-lossless keeps the edges
    // clean at a fraction of PNG's size.
    await sharp(src).webp({ quality: 90, effort: 6 }).toFile(fullOut);
    await sharp(src)
      .resize(128, 128, { fit: 'inside' })
      .webp({ quality: 82, effort: 6 })
      .toFile(thumbOut);

    after += fs.statSync(fullOut).size + fs.statSync(thumbOut).size;
  }),
);

const mb = (n) => (n / 1024 / 1024).toFixed(2);
console.log(`  source PNG : ${mb(before)} MB`);
console.log(`  WebP total : ${mb(after)} MB  (full + thumb)`);
console.log(`  reduction  : ${(100 - (after / before) * 100).toFixed(1)}%`);
if (skipped) console.log(`  ${skipped} already converted (use --force to redo)`);
