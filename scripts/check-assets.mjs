/**
 * Checks what a browser actually fetches and renders from the export.
 *
 * The static checks cannot see any of this: whether a locale pulls the font it
 * needs and no other, whether the declared unicode-ranges leave a character
 * rendering in a fallback face, or whether anything still 404s. All of it only
 * becomes observable once a browser lays the page out.
 *
 * Uses an already-installed Chrome via puppeteer-core, so no browser download.
 *
 * Usage: node scripts/check-assets.mjs [baseUrl]
 */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const BASE = process.argv[2] ?? 'http://localhost:4173';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('no Chrome/Edge found; skipping asset check');
  process.exit(0);
}

const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '  ok ' : 'FAIL '} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

/**
 * Which locale should pull which font. Korean pages render no Japanese at all,
 * so fetching the JP face there would be pure waste.
 */
const PAGES = [
  { path: '/ko/digimon/agumon/', fonts: ['PretendardVariable.woff2'] },
  { path: '/en/digimon/agumon/', fonts: ['PretendardVariable.woff2'] },
  {
    path: '/ja/digimon/agumon/',
    fonts: ['PretendardVariable.woff2', 'PretendardJPVariable.woff2'],
  },
];

const browser = await puppeteer.launch({ executablePath, headless: true });

try {
  for (const { path: url, fonts: expected } of PAGES) {
    const page = await browser.newPage();

    const requested = new Set();
    const failed = [];
    page.on('response', (res) => {
      const name = new URL(res.url()).pathname.split('/').pop();
      if (name?.endsWith('.woff2')) requested.add(name);
      if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
    });

    await page.goto(BASE + url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);

    const loaded = [...requested].sort();
    check(
      loaded.join() === [...expected].sort().join(),
      `${url} 폰트 요청`,
      loaded.length ? loaded.join(', ') : '(없음)',
    );
    check(failed.length === 0, `${url} 4xx 없음`, failed.slice(0, 2).join(' | '));

    /**
     * Every character on the page must come from Pretendard. A character the
     * subset lacks but whose unicode-range claims it renders as tofu, which is
     * worse than the fallback it would otherwise have got — and neither is
     * visible to a static check.
     */
    const uncovered = await page.evaluate(() => {
      const text = document.body.innerText;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const missing = [];
      for (const char of new Set(text)) {
        if (/\s/.test(char)) continue;
        // A glyph the font lacks measures the same as the fallback-only stack.
        ctx.font = '400 40px "Pretendard Variable", cursive';
        const withFont = ctx.measureText(char).width;
        ctx.font = '400 40px cursive';
        const withoutFont = ctx.measureText(char).width;
        if (Math.abs(withFont - withoutFont) < 0.01) missing.push(char);
      }
      return missing;
    });

    check(
      uncovered.length === 0,
      `${url} 모든 글자가 웹폰트로 렌더`,
      uncovered.length ? `폴백: ${uncovered.slice(0, 12).join(' ')}` : '',
    );

    await page.close();
  }

  /* -- the favicon request every browser makes unprompted ------------------ */

  const page = await browser.newPage();
  const iconLinks = await page
    .goto(`${BASE}/ko/`, { waitUntil: 'domcontentloaded' })
    .then(() =>
      page.$$eval('link[rel="icon"], link[rel="apple-touch-icon"]', (nodes) =>
        nodes.map((n) => n.getAttribute('href')),
      ),
    );
  check(iconLinks.length >= 2, '아이콘 <link> 선언', iconLinks.join(' '));

  for (const href of iconLinks) {
    const res = await page.goto(new URL(href, BASE).href);
    // 304 is a hit: the page already referenced the icon, so the second request
    // revalidates rather than re-downloads.
    const status = res.status();
    check(
      status === 200 || status === 304,
      `아이콘 응답 ${href.split('?')[0]}`,
      String(status),
    );
  }
  await page.close();
} finally {
  await browser.close();
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s): ${problems.join(', ')}`);
  process.exit(1);
}
console.log('\nassets OK');
