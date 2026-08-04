/**
 * Writes out/index.html — the language router at the bare root.
 *
 * The site has no page at `/`: every locale is prefixed, so `/` has to send
 * the visitor somewhere. This picks that destination from the reader's own
 * stated choice first, and their browser's language second.
 *
 * Why only here, and nowhere else
 * -------------------------------
 * `/` is the one URL on the site that makes no language claim, which makes it
 * the only safe place to redirect on a guess. Doing the same thing on a locale
 * page would mean Googlebot — which renders with an en-US locale — following a
 * link to /ko/ and being bounced to /en/. /ko/ is the x-default and the
 * highest-priority page in the sitemap; having it redirect for the crawler
 * would undo the hreflang work the rewrite exists for. Google's own
 * multi-regional guidance warns against exactly this. Deep links are never
 * touched: /ko/digimon/agumon/ stays Korean for everyone.
 *
 * Why generated rather than committed to public/
 * ----------------------------------------------
 * The locale list, the default and the storage key come from
 * src/lib/i18n/locales.ts — the same constants the app uses. A hand-written
 * public/index.html would be a second copy of all three, free to drift the
 * day a locale is added.
 *
 * This replaces the `/ -> /ko/` rule that used to live in _redirects. Both
 * cannot exist: an edge redirect would fire before this file is ever served.
 *
 * Usage: node scripts/write-root-router.mjs [outDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_STORAGE_KEY,
} from '../src/lib/i18n/locales.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, 'out'));

if (!fs.existsSync(OUT)) {
  console.error(`no export at ${OUT}`);
  process.exit(1);
}

const json = (value) => JSON.stringify(value);

/**
 * Deliberately ES5 and dependency-free: it runs before anything else on the
 * visitor's first paint, and a syntax error here strands them at a blank root.
 */
const SCRIPT = `(function () {
  var LOCALES = ${json([...LOCALES])};
  var FALLBACK = ${json(DEFAULT_LOCALE)};
  var KEY = ${json(LOCALE_STORAGE_KEY)};

  function stored() {
    try {
      var saved = localStorage.getItem(KEY);
      return LOCALES.indexOf(saved) === -1 ? null : saved;
    } catch (e) {
      // Storage disabled or partitioned. Fall through to the browser's list.
      return null;
    }
  }

  function preferred() {
    var list = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      // navigator.languages is already in preference order, so the first
      // match wins. Compare primary subtags only: 'ja-JP' and 'ja' both mean
      // Japanese here, and the site has one variant per language.
      var base = String(list[i] || '').toLowerCase().split('-')[0];
      if (LOCALES.indexOf(base) !== -1) return base;
    }
    return FALLBACK;
  }

  // replace(), not assign(): the root must not sit in history, or Back from
  // the landing page bounces the reader straight forward again.
  // search and hash are carried so shared links with parameters survive.
  location.replace(
    '/' + (stored() || preferred()) + '/' + location.search + location.hash
  );
})();`;

const html = `<!doctype html>
<html lang="${DEFAULT_LOCALE}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- A router, not a page. Nothing here should be indexed; the locale
         homepages carry the canonical content. -->
    <meta name="robots" content="noindex" />
    <title>Digimon Story Time Stranger — Evolution Path</title>
    <script>
${SCRIPT}
    </script>
    <noscript>
      <meta http-equiv="refresh" content="0; url=/${DEFAULT_LOCALE}/" />
    </noscript>
  </head>
  <body>
    <noscript>
      <p>
        <a href="/${DEFAULT_LOCALE}/">Continue to the site</a>
      </p>
    </noscript>
  </body>
</html>
`;

fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
console.log(
  `root router written (${LOCALES.join(', ')}; falls back to ${DEFAULT_LOCALE})`,
);
