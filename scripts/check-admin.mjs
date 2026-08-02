/**
 * Drives the data editor end to end in a real browser.
 *
 * The editor is the only thing that writes data/*.json, and a broken editor is
 * not obvious until someone tries to use it. This starts its dev server, loads
 * the app, edits a Digimon, saves, confirms the bytes reached disk, then checks
 * that a schema violation blocks the save.
 *
 * data/*.json is snapshotted before the run and restored afterwards — including
 * on failure — so the check leaves the repository exactly as it found it.
 *
 * Uses an already-installed Chrome via puppeteer-core, so no browser download.
 *
 * Usage: node scripts/check-admin.mjs
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const DATA_FILES = [
  'digimons.json',
  'evolutions.json',
  'items.json',
  'agent-levels.json',
];
const BASE = 'http://127.0.0.1:5174';

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
  console.error('no Chrome/Edge found; skipping admin check');
  process.exit(0);
}

/* -- harness -------------------------------------------------------------- */

const problems = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '  ok ' : 'FAIL '} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const snapshot = new Map(
  DATA_FILES.map((f) => [f, fs.readFileSync(path.join(DATA, f), 'utf8')]),
);
const restore = () => {
  for (const [file, contents] of snapshot) {
    fs.writeFileSync(path.join(DATA, file), contents, 'utf8');
  }
};

async function startServer() {
  // Vite's JS entry rather than the npx shim: Node refuses to spawn .cmd files
  // without a shell, and a shell here would only add quoting hazards.
  const child = spawn(
    process.execPath,
    [
      path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
      '--config',
      'tools/admin/vite.config.ts',
    ],
    { cwd: ROOT, stdio: 'ignore' },
  );

  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const res = await fetch(`${BASE}/api/dataset`);
      if (res.ok) return child;
    } catch {
      /* not listening yet */
    }
    await wait(500);
  }

  child.kill();
  throw new Error('admin dev server did not start');
}

/** React ignores a raw `.value =`; the native setter plus an input event works. */
const typeInto = (page, handle, value) =>
  page.evaluate(
    (el, text) => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      ).set;
      setter.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    },
    handle,
    value,
  );

const inputForLabel = (page, label) =>
  page.evaluateHandle(
    (text) =>
      [...document.querySelectorAll('label')]
        .find((l) => l.textContent.startsWith(text))
        ?.querySelector('input'),
    label,
  );

/* -- run ------------------------------------------------------------------ */

let server;
let browser;

try {
  server = await startServer();
  browser = await puppeteer.launch({ executablePath, headless: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  const notFound = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('response', (r) => r.status() === 404 && notFound.push(r.url()));

  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForSelector('ul li button', { timeout: 15000 });

  const listed = await page.$$eval('ul li button', (n) => n.length);
  check(listed > 0, '목록 렌더', `${listed}행`);

  const total = (await page.$$eval('p', (n) =>
    n.map((x) => x.textContent).find((t) => /\d+종/.test(t)),
  ))?.trim();
  check(/475/.test(total ?? ''), '전체 개수', total);

  /* select a Digimon */
  await typeInto(
    page,
    await page.$('input[placeholder="이름 또는 ID로 검색"]'),
    'Agumon',
  );
  await wait(300);
  await page.click('ul li button');
  await page.waitForSelector('section h2', { timeout: 5000 });

  const headings = await page.$$eval('section h2', (n) => n.map((x) => x.textContent));
  check(
    headings.some((h) => h.startsWith('진화 후')) &&
      headings.some((h) => h.startsWith('진화 전')),
    '진화 전/후 섹션',
    headings.join(' / '),
  );

  /* expand an edge to reach the conditions editor */
  await page.evaluate(() => document.querySelector('[aria-expanded="false"]')?.click());
  await wait(200);
  const condLabels = await page.$$eval('label span', (n) =>
    n.map((x) => x.textContent.trim()),
  );
  check(
    condLabels.some((l) => l.startsWith('Lv')),
    '조건 편집기 Lv',
  );
  check(
    condLabels.some((l) => l.includes('유대')),
    '유대 조건',
  );
  check(condLabels.includes('필요 아이템'), '아이템 조건');

  /* edit, save, verify it reached disk */
  const marker = `検証${Date.now()}`;
  await typeInto(page, await inputForLabel(page, '이름 (ja)'), marker);
  await wait(300);

  const dirty = await page.$$eval('header span', (n) =>
    n.some((x) => x.textContent.includes('저장하지 않은 변경')),
  );
  check(dirty, '변경 감지');

  await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .find((b) => b.textContent === '저장')
      ?.click(),
  );
  await wait(1200);

  const onDisk = fs.readFileSync(path.join(DATA, 'digimons.json'), 'utf8');
  check(onDisk.includes(marker), '디스크에 반영');
  check(
    JSON.parse(onDisk).length === JSON.parse(snapshot.get('digimons.json')).length,
    '저장이 다른 레코드를 건드리지 않음',
  );

  const banner = await page.evaluate(
    () =>
      [...document.querySelectorAll('div')]
        .map((d) => d.textContent)
        .find((t) => t.startsWith('저장했습니다')) ?? '',
  );
  check(banner.includes('digimons.json'), '저장 결과 표시', banner.slice(0, 50));

  /* a schema violation must block the save */
  await typeInto(page, await inputForLabel(page, '이름 (ko)'), '');
  await wait(600);

  const blocked = await page.evaluate(() => {
    const save = [...document.querySelectorAll('button')].find(
      (b) => b.textContent === '저장',
    );
    const panel = [...document.querySelectorAll('div')]
      .map((d) => d.textContent)
      .find((t) => t.startsWith('검증 오류'));
    return { disabled: save?.disabled ?? false, panel: panel?.slice(0, 90) ?? '' };
  });
  check(blocked.disabled, '오류 시 저장 차단');
  check(/names\.ko/.test(blocked.panel), '오류 내용 표시', blocked.panel);

  check(notFound.length === 0, '404 없음', notFound.slice(0, 3).join(' | '));
  check(consoleErrors.length === 0, '콘솔 오류 없음', consoleErrors.slice(0, 2).join(' | '));
} finally {
  await browser?.close();
  server?.kill();
  restore();
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s): ${problems.join(', ')}`);
  process.exit(1);
}
console.log('\nadmin OK');
