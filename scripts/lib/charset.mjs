/**
 * Which characters each web font is expected to carry.
 *
 * Shared by the subsetter and the coverage check so the two cannot disagree:
 * `subset-fonts` builds exactly these sets, and `check-fonts` asserts the
 * exported HTML never renders a character outside them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const range = (from, to) => {
  const out = new Set();
  for (let cp = from; cp <= to; cp++) out.add(String.fromCodePoint(cp));
  return out;
};

const union = (...sets) => new Set(sets.flatMap((set) => [...set]));

const within = (set, from, to) =>
  new Set(
    [...set].filter((c) => c.codePointAt(0) >= from && c.codePointAt(0) <= to),
  );

/** Every character appearing in the site's own strings. */
function siteCharacters() {
  const chars = new Set();

  const walk = (value) => {
    if (typeof value === 'string') for (const c of value) chars.add(c);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };

  for (const locale of ['en', 'ko', 'ja']) {
    walk(JSON.parse(fs.readFileSync(path.join(ROOT, 'src/messages', `${locale}.json`), 'utf8')));
  }
  for (const file of ['data/digimons.json', 'data/items.json']) {
    for (const record of JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'))) {
      walk(record.names);
    }
  }

  return chars;
}

const ASCII = range(0x20, 0x7e);
const HANGUL_SYLLABLES = range(0xac00, 0xd7a3);
const HIRAGANA = range(0x3040, 0x309f);
const KATAKANA = range(0x30a0, 0x30ff);

/**
 * Punctuation the site uses that falls outside the main blocks. Split by which
 * face should own it so the `unicode-range` declarations stay disjoint.
 */
const LATIN_PUNCTUATION = new Set(['©', '·', '—', '…']);
const CJK_PUNCTUATION = new Set([
  '、', // 、
  '。', // 。
  '！', // ！
  '（', // （
  '）', // ）
  '：', // ：
  'Ⅰ', // Ⅰ
  'Ⅱ', // Ⅱ
]);

export function buildCharsets() {
  const site = siteCharacters();

  return {
    site,

    /**
     * Latin and Korean. Carries *all* 11,172 modern Hangul syllables rather
     * than only the ~390 the site renders: the extra glyphs cost 149 KB and
     * buy complete coverage of anything a visitor types into the search box or
     * the bug report form. A Korean-majority audience should never see a
     * fallback font mid-word.
     */
    kr: union(ASCII, LATIN_PUNCTUATION, HANGUL_SYLLABLES),

    /**
     * Japanese. Full kana, but only the kanji the site actually renders.
     *
     * Covering JIS X 0208 level 1 as well would cost 1.5 MB instead of 164 KB,
     * and the difference is only visible in text a visitor types themselves —
     * which every device capable of Japanese input can already render from a
     * system font. Site content is fully covered either way.
     */
    jp: union(HIRAGANA, KATAKANA, CJK_PUNCTUATION, within(site, 0x4e00, 0x9fff)),
  };
}

export { ASCII, HANGUL_SYLLABLES, HIRAGANA, KATAKANA, CJK_PUNCTUATION, LATIN_PUNCTUATION };
