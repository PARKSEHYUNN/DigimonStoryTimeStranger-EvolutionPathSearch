/**
 * Catches layout breakage at real viewport sizes.
 *
 * Static class review is not enough — horizontal overflow only shows up once
 * the browser lays the page out. This drives the built `out/` directory through
 * headless Chrome and reports, per viewport:
 *
 *   - documentElement.scrollWidth exceeding the viewport (page-level h-scroll)
 *   - any element wider than its container
 *   - tap targets below the 24x24 CSS px minimum (WCAG 2.2 AA)
 *
 * Uses an already-installed Chrome via puppeteer-core, so no browser download.
 *
 * Usage: node scripts/check-responsive.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('no Chrome/Edge found; skipping responsive check');
  process.exit(0);
}

const VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568, mobile: true },
  { name: 'iPhone 12', width: 390, height: 844, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: false },
  { name: 'desktop', width: 1280, height: 800, mobile: false },
];

const PAGES = [
  { name: 'search', path: '/ko/' },
  { name: 'list', path: '/ko/digimon/' },
  { name: 'detail', path: '/ko/digimon/agumon/' },
  { name: 'detail (ja)', path: '/ja/digimon/omnimon/' },
];

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let failures = 0;

for (const viewport of VIEWPORTS) {
  console.log(`\n${viewport.name}  ${viewport.width}x${viewport.height}`);

  for (const target of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      isMobile: viewport.mobile,
      hasTouch: viewport.mobile,
    });

    await page.goto(`${BASE}${target.path}`, { waitUntil: 'networkidle0' });

    const report = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const viewWidth = document.documentElement.clientWidth;

      const overflowing = [];
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        // Anything poking past the right edge of the viewport.
        if (rect.right > viewWidth + 1) {
          const style = getComputedStyle(el);
          // Scroll containers are allowed to have wider content.
          const parent = el.parentElement;
          const parentStyle = parent ? getComputedStyle(parent) : null;
          const inScroller =
            parentStyle &&
            ['auto', 'scroll'].includes(parentStyle.overflowX);
          if (inScroller || ['auto', 'scroll'].includes(style.overflowX)) continue;

          overflowing.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className?.toString() ?? '').slice(0, 60),
            right: Math.round(rect.right),
            text: (el.textContent ?? '').trim().slice(0, 30),
          });
        }
      }

      const smallTargets = [];
      for (const el of document.querySelectorAll(
        'a, button, [role="switch"], input, select',
      )) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        // WCAG 2.2 SC 2.5.8 exempts targets sitting inline in a sentence,
        // where line-height rather than the control decides the height.
        const display = getComputedStyle(el).display;
        const inSentence =
          display === 'inline' &&
          (el.parentElement?.textContent ?? '').trim() !==
            (el.textContent ?? '').trim();
        if (inSentence) continue;

        if (rect.width < 24 || rect.height < 24) {
          smallTargets.push({
            tag: el.tagName.toLowerCase(),
            size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
            label:
              el.getAttribute('aria-label') ??
              (el.textContent ?? '').trim().slice(0, 24),
          });
        }
      }

      return {
        docWidth,
        viewWidth,
        overflowing: overflowing.slice(0, 5),
        overflowCount: overflowing.length,
        smallTargets: smallTargets.slice(0, 5),
        smallCount: smallTargets.length,
      };
    });

    const hScroll = report.docWidth > report.viewWidth + 1;
    const ok = !hScroll && report.overflowCount === 0 && report.smallCount === 0;
    if (!ok) failures++;

    console.log(
      `  ${ok ? 'ok  ' : 'FAIL'} ${target.name.padEnd(12)} ` +
        `doc ${report.docWidth}px${hScroll ? ` > view ${report.viewWidth}px` : ''}` +
        `${report.overflowCount ? `  overflow x${report.overflowCount}` : ''}` +
        `${report.smallCount ? `  small-tap x${report.smallCount}` : ''}`,
    );

    for (const o of report.overflowing) {
      console.log(`         overflow: <${o.tag} class="${o.cls}"> right=${o.right} "${o.text}"`);
    }
    for (const s of report.smallTargets) {
      console.log(`         tap ${s.size}: <${s.tag}> "${s.label}"`);
    }

    await page.close();
  }
}

await browser.close();
console.log(failures ? `\n${failures} page/viewport combination(s) with issues` : '\nall clean');
process.exit(failures ? 1 : 0);
