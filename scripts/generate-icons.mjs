/**
 * Builds the app icons from public/logo.png.
 *
 * Without these, every first visit spends a request on /favicon.ico and gets a
 * 404 — the browser asks for it whenever no <link rel="icon"> is present. Next
 * emits that link automatically for files named icon/apple-icon in src/app/.
 *
 * Outputs are committed; re-run only if the logo changes.
 *
 * Usage: node scripts/generate-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'public', 'logo.png');
const APP = path.join(ROOT, 'src', 'app');

const TARGETS = [
  // Browser tab and bookmarks. 192px covers high-DPI tabs and Android home
  // screens from one file.
  { file: 'icon.png', size: 192, background: null },
  // iOS ignores transparency and composites onto black, so this one gets an
  // explicit background rather than an alpha channel.
  { file: 'apple-icon.png', size: 180, background: '#ffffff' },
];

if (!fs.existsSync(SOURCE)) {
  console.error('public/logo.png is missing');
  process.exit(1);
}

for (const { file, size, background } of TARGETS) {
  let pipeline = sharp(SOURCE).resize(size, size, {
    fit: 'contain',
    background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });

  if (background) pipeline = pipeline.flatten({ background });

  const buffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(APP, file), buffer);

  console.log(
    `src/app/${file.padEnd(16)} ${size}x${size}  ${(buffer.length / 1024).toFixed(1)} KB`,
  );
}
