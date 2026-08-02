/**
 * Integrity gate for data/*.json.
 *
 * Runs before every build and from the admin tool before it writes. Shape is
 * checked with the Zod schemas; everything below that is cross-file
 * referential integrity that a schema cannot express.
 *
 * Usage: node scripts/validate-data.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  agentLevelsSchema,
  digimonsFileSchema,
  evolutionsFileSchema,
  itemsFileSchema,
} from '../src/lib/digimon/schema.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const ICONS = path.join(ROOT, 'public', 'icons');

const errors: string[] = [];
const notes: string[] = [];

const fail = (msg: string) => errors.push(msg);

function readJson(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
}

/* -- shape ---------------------------------------------------------------- */

const digimonsResult = digimonsFileSchema.safeParse(readJson('digimons.json'));
const evolutionsResult = evolutionsFileSchema.safeParse(
  readJson('evolutions.json'),
);
const itemsResult = itemsFileSchema.safeParse(readJson('items.json'));
const agentResult = agentLevelsSchema.safeParse(readJson('agent-levels.json'));

for (const [name, result] of [
  ['digimons.json', digimonsResult],
  ['evolutions.json', evolutionsResult],
  ['items.json', itemsResult],
  ['agent-levels.json', agentResult],
] as const) {
  if (!result.success) {
    for (const issue of result.error.issues.slice(0, 20)) {
      fail(`${name}: ${issue.path.join('.')} — ${issue.message}`);
    }
  }
}

if (
  !digimonsResult.success ||
  !evolutionsResult.success ||
  !itemsResult.success ||
  !agentResult.success
) {
  report();
}

const digimons = digimonsResult.data!;
const evolutions = evolutionsResult.data!;
const items = itemsResult.data!;
const agentLevels = agentResult.data!;

/* -- uniqueness ----------------------------------------------------------- */

const byId = new Map<number, (typeof digimons)[number]>();
for (const d of digimons) {
  if (byId.has(d.id)) fail(`duplicate Digimon id ${d.id}`);
  byId.set(d.id, d);
}

const slugs = new Map<string, number>();
for (const d of digimons) {
  const existing = slugs.get(d.slug);
  if (existing !== undefined) {
    fail(`slug "${d.slug}" used by both ${existing} and ${d.id}`);
  }
  slugs.set(d.slug, d.id);
}

const itemIds = new Set<number>();
for (const i of items) {
  if (itemIds.has(i.id)) fail(`duplicate item id ${i.id}`);
  itemIds.add(i.id);
}

/* -- referential integrity ------------------------------------------------ */

const edgeKeys = new Set<string>();
for (const e of evolutions) {
  const key = `${e.from}>${e.to}`;
  if (edgeKeys.has(key)) fail(`duplicate evolution ${e.from} -> ${e.to}`);
  edgeKeys.add(key);

  if (!byId.has(e.from)) fail(`evolution ${key}: unknown source ${e.from}`);
  if (!byId.has(e.to)) fail(`evolution ${key}: unknown target ${e.to}`);
  if (e.from === e.to) fail(`evolution ${key}: self-loop`);

  const { item, jogress } = e.conditions;
  if (item !== undefined && !itemIds.has(item)) {
    fail(`evolution ${key}: unknown item ${item}`);
  }
  if (jogress) {
    for (const partner of jogress) {
      if (!byId.has(partner.id)) {
        fail(`evolution ${key}: jogress partner ${partner.id} does not exist`);
      }
    }
    // One partner is always the Digimon initiating the fusion.
    const ids = jogress.map((p) => p.id);
    if (!ids.includes(e.from)) {
      notes.push(
        `evolution ${key}: neither jogress partner (${ids.join(', ')}) is the source`,
      );
    }
  }
}

for (const key of Object.keys(agentLevels.byDigimonId)) {
  if (!byId.has(Number(key))) {
    fail(`agent-levels: override for unknown Digimon ${key}`);
  }
}

const generations = new Set(digimons.map((d) => d.generation));
for (const key of Object.keys(agentLevels.byGeneration)) {
  if (!generations.has(Number(key))) {
    notes.push(`agent-levels: generation ${key} has no Digimon`);
  }
}

/* -- connectivity --------------------------------------------------------- */

const connected = new Set<number>();
for (const e of evolutions) {
  connected.add(e.from);
  connected.add(e.to);
}
const isolated = digimons.filter((d) => !connected.has(d.id));
if (isolated.length) {
  notes.push(
    `${isolated.length} Digimon have no evolutions: ${isolated
      .map((d) => `${d.id} ${d.names.en}`)
      .join(', ')}`,
  );
}

/* -- assets --------------------------------------------------------------- */

if (fs.existsSync(ICONS)) {
  const present = new Set(
    fs.readdirSync(ICONS).map((f) => f.replace(/\.[a-z0-9]+$/i, '')),
  );
  const missing = digimons.filter((d) => !present.has(String(d.id)));
  if (missing.length) {
    fail(
      `${missing.length} Digimon have no icon: ${missing
        .slice(0, 15)
        .map((d) => d.id)
        .join(', ')}`,
    );
  }
} else {
  notes.push('public/icons not built yet — run `npm run icons:optimize`');
}

/* -- report --------------------------------------------------------------- */

function report(): never {
  console.log(
    `checked ${digimonsResult.success ? digimonsResult.data.length : '?'} Digimon, ` +
      `${evolutionsResult.success ? evolutionsResult.data.length : '?'} evolutions`,
  );

  for (const n of notes) console.log(`note: ${n}`);

  if (errors.length) {
    console.error(`\n${errors.length} error(s):`);
    for (const e of errors) console.error(`  ${e}`);
    process.exit(1);
  }

  console.log('data OK');
  process.exit(0);
}

report();
