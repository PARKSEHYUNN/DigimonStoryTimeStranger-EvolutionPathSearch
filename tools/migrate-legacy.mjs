/**
 * One-shot conversion of the legacy JSON files into the normalized schema.
 *
 *   legacy/public/digimon_list.json     -> data/digimons.json + data/evolutions.json
 *   legacy/public/dlc_list.json         -> folded into digimons[].dlc
 *   legacy/public/jogress_list.json     -> dropped (derivable from conditions.jogress)
 *   legacy/public/agent_level_list.json -> data/agent-levels.json
 *   legacy/public/item_list.json        -> data/items.json
 *
 * The legacy format stored each evolution three times: `evolution.to` on the
 * source, `evolution.from` on the target, and `evolution_requirements` on the
 * source. Four `.from` entries were already missing their counterpart — benign,
 * because each of those edges was also declared on the other side's `.to`, but
 * a demonstration that three copies do drift. Here the union of every direction
 * claim becomes the edge set, so nothing is lost, and the result is a single
 * directed edge list that cannot desync.
 *
 * Run with --verify to re-derive the legacy adjacency from the output and
 * diff it against the original.
 *
 * Usage: node tools/migrate-legacy.mjs [--verify]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEGACY = path.join(ROOT, 'legacy', 'public');
const OUT = path.join(ROOT, 'data');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/* -------------------------------------------------------------------------- */
/* Slugs                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Build a URL slug from the English name. Names carry parentheses, spaces and
 * punctuation ("Omnimon Alter-B", "UlforceVeedramon (X Antibody)") that all
 * collapse to hyphens.
 */
function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function assignSlugs(list) {
  const seen = new Map();
  const slugs = new Map();

  for (const d of list) {
    const base = slugify(d.name[0]) || `digimon-${d.id}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    // Collisions get the id appended so slugs stay stable and unique.
    slugs.set(d.id, count === 0 ? base : `${base}-${d.id}`);
  }
  return slugs;
}

/* -------------------------------------------------------------------------- */
/* Conditions                                                                 */
/* -------------------------------------------------------------------------- */

const KNOWN_CONDITION_KEYS = new Set([
  'rank',
  'HP',
  'SP',
  'ATK',
  'DEF',
  'INT',
  'RES',
  'SPD',
  'TALENT',
  'valor',
  'philanthropy',
  'amicability',
  'wisdom',
  'item',
  'jogress',
]);

const warnings = [];

function normalizeConditions(raw, fromId, toId) {
  const out = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    // `isJogress` is a vestigial flag on two records (474, 475). The `jogress`
    // array beside it already carries the information.
    if (key === 'isJogress') continue;

    if (!KNOWN_CONDITION_KEYS.has(key)) {
      warnings.push(`unknown condition key "${key}" on ${fromId} -> ${toId}`);
      continue;
    }
    out[key] = value;
  }
  if (out.rank === undefined) {
    warnings.push(`missing rank on ${fromId} -> ${toId}, defaulting to 1`);
    out.rank = 1;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Migration                                                                  */
/* -------------------------------------------------------------------------- */

function migrate() {
  const legacyList = readJson(path.join(LEGACY, 'digimon_list.json'));
  const dlc = new Set(readJson(path.join(LEGACY, 'dlc_list.json')).DLC);
  const agentLevel = readJson(path.join(LEGACY, 'agent_level_list.json'));
  const items = readJson(path.join(LEGACY, 'item_list.json'));

  const byId = new Map(legacyList.map((d) => [d.id, d]));
  const slugs = assignSlugs(legacyList);

  const digimons = legacyList.map((d) => ({
    id: d.id,
    slug: slugs.get(d.id),
    names: { en: d.name[0], ko: d.name[1], ja: d.name[2] },
    generation: d.generation,
    attribute: d.attribute,
    personality: d.personality,
    dlc: dlc.has(d.id),
  }));

  // Union of every direction claim in the legacy data. Taking the union rather
  // than trusting one side is what repairs the four broken back-links.
  const edgeKeys = new Set();
  for (const d of legacyList) {
    for (const to of d.evolution.to) edgeKeys.add(`${d.id}>${to}`);
    for (const from of d.evolution.from) edgeKeys.add(`${from}>${d.id}`);
  }

  const evolutions = [];
  // Edges the source never listed in `.to` — recoverable only from the
  // target's `.from`. These are the ones the union rescues.
  const oneSided = [];

  for (const key of edgeKeys) {
    const [from, to] = key.split('>').map(Number);
    if (!byId.has(from) || !byId.has(to)) {
      warnings.push(`edge ${from} -> ${to} references a missing Digimon`);
      continue;
    }

    const source = byId.get(from);
    const req = source.evolution_requirements?.find((r) => r.id === to);

    if (!req) {
      warnings.push(`edge ${from} -> ${to} has no requirements entry`);
    }
    if (!source.evolution.to.includes(to)) {
      oneSided.push(`${from} -> ${to} (recorded only on the target's .from)`);
    }

    evolutions.push({
      from,
      to,
      conditions: normalizeConditions(req?.conditions, from, to),
    });
  }

  evolutions.sort((a, b) => a.from - b.from || a.to - b.to);

  const agentLevels = {
    byGeneration: Object.fromEntries(
      Object.entries(agentLevel.agentLevel).map(([k, v]) => [String(k), v]),
    ),
    byDigimonId: Object.fromEntries(
      Object.entries(agentLevel.exceptionLevel).map(([k, v]) => [String(k), v]),
    ),
  };

  const itemsOut = items.map((i) => ({
    id: i.id,
    names: { en: i.name[0], ko: i.name[1], ja: i.name[2] },
  }));

  return { digimons, evolutions, agentLevels, items: itemsOut, oneSided };
}

/* -------------------------------------------------------------------------- */
/* Verification                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Rebuild the legacy undirected adjacency from both representations and check
 * they describe the same graph. The pathfinder treated the graph as undirected,
 * so this is the property that must survive the migration.
 */
function verify({ digimons, evolutions }) {
  const legacyList = readJson(path.join(LEGACY, 'digimon_list.json'));

  const undirected = (pairs) => {
    const s = new Set();
    for (const [a, b] of pairs) s.add(a < b ? `${a}|${b}` : `${b}|${a}`);
    return s;
  };

  const legacyPairs = [];
  for (const d of legacyList) {
    for (const to of d.evolution.to) legacyPairs.push([d.id, to]);
    for (const from of d.evolution.from) legacyPairs.push([from, d.id]);
  }

  const before = undirected(legacyPairs);
  const after = undirected(evolutions.map((e) => [e.from, e.to]));

  const missing = [...before].filter((k) => !after.has(k));
  const extra = [...after].filter((k) => !before.has(k));

  console.log('\n--- verification ---');
  console.log(`digimon count : ${legacyList.length} -> ${digimons.length}`);
  console.log(`undirected edges : ${before.size} -> ${after.size}`);
  console.log(`missing after migration : ${missing.length}`);
  console.log(`unexpected new edges    : ${extra.length}`);

  if (missing.length) console.log('  missing:', missing.slice(0, 20));
  if (extra.length) console.log('  extra:', extra.slice(0, 20));

  // Every legacy requirement must have landed on exactly one edge.
  const legacyReqCount = legacyList.reduce(
    (n, d) => n + (d.evolution_requirements?.length ?? 0),
    0,
  );
  const withConditions = evolutions.filter(
    (e) => Object.keys(e.conditions).length > 0,
  ).length;
  console.log(
    `requirements : ${legacyReqCount} -> ${withConditions} edges carry conditions`,
  );

  return missing.length === 0 && extra.length === 0;
}

/* -------------------------------------------------------------------------- */

const result = migrate();

fs.mkdirSync(OUT, { recursive: true });
const write = (name, value) =>
  fs.writeFileSync(
    path.join(OUT, name),
    JSON.stringify(value, null, 2) + '\n',
    'utf8',
  );

write('digimons.json', result.digimons);
write('evolutions.json', result.evolutions);
write('agent-levels.json', result.agentLevels);
write('items.json', result.items);

console.log(`digimons.json     ${result.digimons.length}`);
console.log(`evolutions.json   ${result.evolutions.length}`);
console.log(`items.json        ${result.items.length}`);

console.log(
  `\nedges recovered from the target side only: ${result.oneSided.length}`,
);
for (const r of result.oneSided) console.log(`  ${r}`);

// Mutual pairs (a -> b and b -> a both exist) are legitimate: X-Antibody and
// Alter forms convert in both directions. Reported so the count difference
// between directed and undirected edges is explainable.
const mutual = new Set();
const directed = new Set(result.evolutions.map((e) => `${e.from}>${e.to}`));
for (const e of result.evolutions) {
  if (directed.has(`${e.to}>${e.from}`)) {
    mutual.add(e.from < e.to ? `${e.from}<->${e.to}` : `${e.to}<->${e.from}`);
  }
}
console.log(`mutual (bidirectional) pairs: ${mutual.size}`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 30)) console.log(`  ${w}`);
}

if (process.argv.includes('--verify')) {
  const ok = verify(result);
  console.log(ok ? '\nOK: graph preserved' : '\nFAIL: graph changed');
  if (!ok) process.exit(1);
}
