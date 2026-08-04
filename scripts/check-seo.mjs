/**
 * Audits the exported HTML for the signals this rewrite exists to produce.
 *
 * The site it replaces had two URLs and pointed all three hreflang variants at
 * the same page, so none of this could be checked before. Everything here is
 * read out of out/ rather than assumed.
 *
 * Usage: node scripts/check-seo.mjs [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] ?? 'out');
const LOCALES = ['en', 'ko', 'ja'];

const problems = [];
const fail = (msg) => problems.push(msg);

const read = (p) => fs.readFileSync(p, 'utf8');
const attr = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

function htmlFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (entry.name === 'index.html') acc.push(full);
  }
  return acc;
}

/**
 * Error pages are excluded: they are not canonical anything, carry no
 * translations, and should not be indexed, so demanding SEO tags of them
 * would be wrong rather than thorough.
 */
const isErrorPage = (file) => {
  const rel = path.relative(OUT, file).replace(/\\/g, '/');
  return (
    rel.startsWith('404/') ||
    rel.startsWith('_not-found/') ||
    // The root language router is the same case: a noindex redirect stub with
    // no locale of its own, so canonical and hreflang would be meaningless.
    rel === 'index.html'
  );
};

const allPages = htmlFiles(OUT);
const pages = allPages.filter((f) => !isErrorPage(f));
console.log(
  `${pages.length.toLocaleString()} content pages ` +
    `(+${allPages.length - pages.length} error pages, not audited)\n`,
);

/* -- per-page tags -------------------------------------------------------- */

const titles = new Map();
const descriptions = new Map();
let missingCanonical = 0;
let missingDescription = 0;
let badHreflang = 0;
let withJsonLd = 0;

for (const file of pages) {
  const html = read(file);
  const rel = path.relative(OUT, file).replace(/\\/g, '/');

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const description =
    html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const canonical = html.match(/rel="canonical" href="([^"]*)"/)?.[1];
  const hreflangs = attr(html, /hrefLang="([^"]*)"/g);
  const lang = html.match(/<html lang="([^"]*)"/)?.[1];

  if (!canonical) missingCanonical++;
  if (!description) missingDescription++;
  if (html.includes('application/ld+json')) withJsonLd++;

  // Every page must advertise all three locales plus x-default.
  const expected = [...LOCALES, 'x-default'];
  if (expected.some((l) => !hreflangs.includes(l))) badHreflang++;

  // The declared language must match the URL's locale segment.
  const urlLocale = rel.split('/')[0];
  if (LOCALES.includes(urlLocale) && lang !== urlLocale) {
    fail(`${rel}: <html lang="${lang}"> but URL locale is ${urlLocale}`);
  }

  if (title) titles.set(title, (titles.get(title) ?? 0) + 1);
  if (description) {
    descriptions.set(description, (descriptions.get(description) ?? 0) + 1);
  }
}

if (missingCanonical) fail(`${missingCanonical} page(s) without a canonical`);
if (missingDescription) fail(`${missingDescription} page(s) without a description`);
if (badHreflang) fail(`${badHreflang} page(s) with incomplete hreflang`);

console.log(`canonical present   : ${pages.length - missingCanonical}/${pages.length}`);
console.log(`hreflang complete   : ${pages.length - badHreflang}/${pages.length}`);
console.log(`description present : ${pages.length - missingDescription}/${pages.length}`);
console.log(`JSON-LD present     : ${withJsonLd}/${pages.length}`);

/* -- uniqueness ----------------------------------------------------------- */

const dupTitles = [...titles].filter(([, n]) => n > 1);
const dupDescriptions = [...descriptions].filter(([, n]) => n > 1);

console.log(`\nunique titles       : ${titles.size}`);
console.log(`unique descriptions : ${descriptions.size}`);

// Titles and descriptions identify a page; two pages sharing one reads to a
// crawler as duplicate content. Every content page must be distinct.
for (const [text, n] of dupTitles) {
  fail(`title on ${n} pages: "${text.slice(0, 70)}"`);
}
for (const [text, n] of dupDescriptions) {
  fail(`description on ${n} pages: "${text.slice(0, 70)}"`);
}

/* -- sitemap and robots --------------------------------------------------- */

const sitemapPath = path.join(OUT, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  fail('sitemap.xml was not generated');
} else {
  const xml = read(sitemapPath);
  const urls = attr(xml, /<loc>([^<]*)<\/loc>/g);
  const alternates = (xml.match(/xhtml:link/g) ?? []).length;
  console.log(`\nsitemap URLs        : ${urls.length.toLocaleString()}`);
  console.log(`sitemap alternates  : ${alternates.toLocaleString()}`);

  if (new Set(urls).size !== urls.length) fail('sitemap contains duplicate URLs');
  if (urls.length > 50_000) fail('sitemap exceeds the 50,000 URL limit');
  if (!alternates) fail('sitemap has no hreflang alternates');

  // Every sitemap URL must resolve to a generated page.
  const missing = urls.filter((url) => {
    const rel = url.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
    return !fs.existsSync(path.join(OUT, rel, 'index.html'));
  });
  if (missing.length) {
    fail(`${missing.length} sitemap URL(s) have no page, e.g. ${missing[0]}`);
  } else {
    console.log('sitemap URLs resolve: all');
  }
}

const robotsPath = path.join(OUT, 'robots.txt');
if (!fs.existsSync(robotsPath)) fail('robots.txt was not generated');
else if (!read(robotsPath).includes('Sitemap:')) {
  fail('robots.txt does not reference the sitemap');
}

/* -- report --------------------------------------------------------------- */

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
  process.exit(1);
}
console.log('\nSEO output OK');
