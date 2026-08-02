/**
 * Integrity gate for data/*.json, run before every build.
 *
 * The rules live in src/lib/digimon/validate.ts so that this script and the
 * admin tool enforce exactly the same thing — a dataset the editor accepted
 * can never be one the build rejects.
 *
 * Usage: node scripts/validate-data.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDataset } from '../src/lib/digimon/validate.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const ICONS = path.join(ROOT, 'public', 'icons');

const readJson = (name: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));

/** Digimon ids with an icon. Numeric names only — `thumb/` is a directory. */
function iconIds(): ReadonlySet<number> | undefined {
  if (!fs.existsSync(ICONS)) return undefined;
  const ids = new Set<number>();
  for (const name of fs.readdirSync(ICONS)) {
    const base = name.replace(/\.[a-z0-9]+$/i, '');
    if (/^\d+$/.test(base)) ids.add(Number(base));
  }
  return ids;
}

const icons = iconIds();
const { dataset, errors, notes } = validateDataset(
  {
    digimons: readJson('digimons.json'),
    evolutions: readJson('evolutions.json'),
    items: readJson('items.json'),
    agentLevels: readJson('agent-levels.json'),
  },
  { iconIds: icons },
);

console.log(
  dataset
    ? `checked ${dataset.digimons.length} Digimon, ${dataset.evolutions.length} evolutions`
    : 'schema validation failed',
);
if (!icons) console.log('note: public/icons not built yet — run `npm run icons:optimize`');
for (const n of notes) console.log(`note: ${n}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log('data OK');
