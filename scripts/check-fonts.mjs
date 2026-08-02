/**
 * Asserts the subset fonts still cover everything the site renders.
 *
 * Subsetting is a manual step, so the failure mode is silent: someone adds a
 * Digimon whose name uses a kanji that is not in the subset, and the character
 * quietly renders in a system fallback — or, worse, as tofu, because the CSS
 * `unicode-range` claims the font covers it.
 *
 * This reads every character out of the exported HTML and compares it with the
 * sets scripts/subset-fonts.mjs was told to build.
 *
 * Usage: node scripts/check-fonts.mjs [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildCharsets } from './lib/charset.mjs';

const OUT = path.resolve(process.argv[2] ?? 'out');
const FONT_DIR = path.join(path.dirname(OUT), 'public', 'font');

const problems = [];
const fail = (message) => problems.push(message);

/* -- what the fonts carry -------------------------------------------------- */

const { kr, jp } = buildCharsets();
const covered = new Set([...kr, ...jp]);

/* -- what the pages render ------------------------------------------------- */

function htmlFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

/** Visible text only: script and style contents are never painted. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

const pages = htmlFiles(OUT);
const rendered = new Map(); // char -> an example page

for (const file of pages) {
  for (const char of visibleText(fs.readFileSync(file, 'utf8'))) {
    // Whitespace and control characters have no glyph to miss.
    if (/\s/.test(char) || char.codePointAt(0) < 0x20) continue;
    if (!rendered.has(char)) rendered.set(char, path.relative(OUT, file));
  }
}

console.log(`${pages.length.toLocaleString()} pages, ${rendered.size} distinct characters`);

const missing = [...rendered].filter(([char]) => !covered.has(char));
if (missing.length) {
  fail(
    `${missing.length} character(s) rendered but not in any subset — ` +
      'run `npm run fonts:subset`',
  );
  for (const [char, page] of missing.slice(0, 20)) {
    const cp = char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    fail(`  "${char}" U+${cp} (${page})`);
  }
}

/* -- the files themselves -------------------------------------------------- */

const EXPECTED_FONTS = ['PretendardVariable.woff2', 'PretendardJPVariable.woff2'];
// Comfortably above the current 586 KB and 131 KB, low enough to catch an
// accidental re-copy of the 2 MB / 5.2 MB originals.
const MAX_BYTES = 900 * 1024;

for (const name of EXPECTED_FONTS) {
  const file = path.join(FONT_DIR, name);
  if (!fs.existsSync(file)) {
    fail(`${name} is missing from public/font — run \`npm run fonts:subset\``);
    continue;
  }
  const { size } = fs.statSync(file);
  console.log(`  ${name.padEnd(28)} ${(size / 1024).toFixed(0)} KB`);
  if (size > MAX_BYTES) {
    fail(`${name} is ${(size / 1024).toFixed(0)} KB — the un-subset original?`);
  }
}

/* -- unicode-range must match the charsets --------------------------------- */

const css = fs.readFileSync(
  path.join(path.dirname(OUT), 'src', 'app', 'fonts.css'),
  'utf8',
);

/** Expands `U+AC00-D7A3, U+00A9` into the characters it claims. */
function parseUnicodeRange(text) {
  const chars = new Set();
  for (const token of text.split(',')) {
    const match = token.trim().match(/^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/i);
    if (!match) continue;
    const from = parseInt(match[1], 16);
    const to = match[2] ? parseInt(match[2], 16) : from;
    for (let cp = from; cp <= to; cp++) chars.add(String.fromCodePoint(cp));
  }
  return chars;
}

const declared = [...css.matchAll(/unicode-range:\s*([^;]+);/gi)].map((m) =>
  parseUnicodeRange(m[1]),
);

if (declared.length !== 2) {
  fail(`expected 2 unicode-range declarations in globals.css, found ${declared.length}`);
} else {
  // Order in the stylesheet is Latin/Korean first, Japanese second.
  for (const [label, range, charset] of [
    ['Latin/Korean', declared[0], kr],
    ['Japanese', declared[1], jp],
  ]) {
    // A range wider than the file makes the browser fetch a font that then
    // renders tofu instead of handing the character to a fallback.
    const overclaimed = [...range].filter((c) => !charset.has(c));
    if (overclaimed.length) {
      fail(
        `${label} unicode-range claims ${overclaimed.length} character(s) the subset ` +
          `does not contain, e.g. U+${overclaimed[0].codePointAt(0).toString(16).toUpperCase()}`,
      );
    }
    // A range narrower than the file sends characters to a fallback for no reason.
    const unreachable = [...charset].filter(
      (c) => !range.has(c) && rendered.has(c),
    );
    if (unreachable.length) {
      fail(
        `${label} subset contains ${unreachable.length} rendered character(s) outside its ` +
          `unicode-range, e.g. "${unreachable[0]}"`,
      );
    }
  }
}

/* -- report ---------------------------------------------------------------- */

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log('\nfont coverage OK');
