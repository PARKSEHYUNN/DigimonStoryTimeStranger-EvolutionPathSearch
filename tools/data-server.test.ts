/**
 * The write path is the only thing in this repo that can corrupt the data, so
 * it gets tested rather than trusted: the validation gate, the stale-revision
 * guard, and the canonical serialization that keeps diffs honest.
 *
 * Runs against a throwaway data directory — the real data/ is never touched.
 */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Dataset } from '../src/lib/digimon/validate.ts';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'evolutionpath-data-'));

/** Small enough to read at a glance, complete enough to satisfy every rule. */
const seed = (): Dataset => ({
  digimons: [
    {
      id: 1,
      slug: 'agumon',
      names: { en: 'Agumon', ko: '아구몬', ja: 'アグモン' },
      generation: 2,
      attribute: 1,
      personality: 5,
      dlc: false,
    },
    {
      id: 2,
      slug: 'greymon',
      names: { en: 'Greymon', ko: '그레이몬', ja: 'グレイモン' },
      generation: 3,
      attribute: 1,
      personality: 5,
      dlc: false,
    },
  ],
  evolutions: [{ from: 1, to: 2, conditions: { rank: 11, ATK: 120 } }],
  items: [{ id: 1, names: { en: 'Digi-Egg', ko: '캡슐', ja: 'デジメンタル' } }],
  agentLevels: { byGeneration: { '2': 1, '3': 3 }, byDigimonId: {} },
});

const FILES = {
  digimons: 'digimons.json',
  evolutions: 'evolutions.json',
  items: 'items.json',
  agentLevels: 'agent-levels.json',
} as const;

function writeSeed(dataset: Dataset = seed()): void {
  for (const [key, file] of Object.entries(FILES)) {
    const value = dataset[key as keyof Dataset];
    fs.writeFileSync(
      path.join(DIR, file),
      `${JSON.stringify(value, null, 2)}\n`,
      'utf8',
    );
  }
}

const onDisk = <T,>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as T;

let base: string;
let server: http.Server;

beforeAll(async () => {
  process.env.EVOLUTIONPATH_DATA_DIR = DIR;
  // Points nowhere on purpose: the icon check is skipped rather than failing
  // every Digimon in a fixture that has no images.
  process.env.EVOLUTIONPATH_ICONS_DIR = path.join(DIR, 'no-icons');

  writeSeed();

  // Imported after the env is set — the paths are resolved at module load.
  const { dataApi } = await import('./data-server.ts');

  server = http.createServer((req, res) =>
    dataApi(req, res, () => {
      res.writeHead(404).end('not found');
    }),
  );
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  fs.rmSync(DIR, { recursive: true, force: true });
});

beforeEach(() => writeSeed());

const load = async () =>
  (await (await fetch(`${base}/api/dataset`)).json()) as {
    revision: string;
    dataset: Dataset;
    errors: string[];
    notes: string[];
  };

const save = async (revision: string, dataset: unknown) => {
  const res = await fetch(`${base}/api/dataset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ revision, dataset }),
  });
  const body = (await res.json()) as {
    revision?: string;
    changed?: string[];
    errors?: string[];
  };
  return {
    status: res.status,
    revision: body.revision,
    changed: body.changed ?? [],
    // Joined so a test can assert on the text without indexing into a list
    // whose order is not part of the contract.
    complaints: (body.errors ?? []).join('\n'),
  };
};

describe('GET /api/dataset', () => {
  it('returns the dataset with a revision and no complaints', async () => {
    const loaded = await load();
    expect(loaded.errors).toEqual([]);
    expect(loaded.notes).toEqual([]);
    expect(loaded.revision).toMatch(/^[0-9a-f]{16}$/);
    expect(loaded.dataset.digimons).toHaveLength(2);
  });
});

describe('POST /api/dataset', () => {
  it('writes nothing when the dataset is unchanged', async () => {
    const { revision, dataset } = await load();
    const { status, changed, revision: saved } = await save(revision, dataset);

    expect(status).toBe(200);
    expect(changed).toEqual([]);
    expect(saved).toBe(revision);
  });

  it('writes only the files that changed', async () => {
    const { revision, dataset } = await load();
    dataset.digimons[0]!.names.ko = '아구몬 (수정)';

    const { status, changed } = await save(revision, dataset);

    expect(status).toBe(200);
    expect(changed).toEqual(['digimons.json']);
    expect(onDisk<Dataset['digimons']>('digimons.json')[0]!.names.ko).toBe(
      '아구몬 (수정)',
    );
  });

  it('refuses a save based on a revision that is no longer current', async () => {
    const { revision, dataset } = await load();

    // Someone else edits the files in between.
    const other = seed();
    other.digimons[0]!.names.ko = '다른 편집';
    writeSeed(other);

    const { status } = await save(revision, dataset);

    expect(status).toBe(409);
    expect(onDisk<Dataset['digimons']>('digimons.json')[0]!.names.ko).toBe(
      '다른 편집',
    );
  });

  it('rejects a shape the schema does not accept, leaving the files alone', async () => {
    const { revision, dataset } = await load();
    (dataset.digimons[0] as { generation: number }).generation = 99;

    const { status, complaints } = await save(revision, dataset);

    expect(status).toBe(422);
    expect(complaints).toContain('generation');
    expect(onDisk<Dataset['digimons']>('digimons.json')[0]!.generation).toBe(2);
  });

  it('rejects an evolution pointing at a Digimon that does not exist', async () => {
    const { revision, dataset } = await load();
    dataset.evolutions[0]!.to = 999;

    const { status, complaints } = await save(revision, dataset);

    expect(status).toBe(422);
    expect(complaints).toContain('999');
    expect(onDisk<Dataset['evolutions']>('evolutions.json')[0]!.to).toBe(2);
  });

  it('rejects a duplicate slug', async () => {
    const { revision, dataset } = await load();
    dataset.digimons[1]!.slug = 'agumon';

    const { status, complaints } = await save(revision, dataset);

    expect(status).toBe(422);
    expect(complaints).toContain('agumon');
  });

  it('rejects a Jogress pairing a Digimon with itself', async () => {
    const { revision, dataset } = await load();
    dataset.evolutions[0]!.conditions.jogress = [
      { id: 1, personality: 5 },
      { id: 1, personality: 5 },
    ];

    const { status, complaints } = await save(revision, dataset);

    expect(status).toBe(422);
    expect(complaints).toContain('조그레스');
  });
});

describe('canonical output', () => {
  it('sorts records and normalises condition key order', async () => {
    const { revision, dataset } = await load();

    dataset.digimons.push({
      id: 3,
      slug: 'metalgreymon',
      names: { en: 'MetalGreymon', ko: '메탈그레이몬', ja: 'メタルグレイモン' },
      generation: 3,
      attribute: 1,
      personality: 5,
      dlc: true,
    });
    // Deliberately out of order, with conditions keyed the wrong way round.
    dataset.evolutions.unshift({
      from: 2,
      to: 3,
      conditions: { ATK: 300, rank: 20 } as never,
    });

    const { status } = await save(revision, dataset);
    expect(status).toBe(200);

    const evolutions = onDisk<Dataset['evolutions']>('evolutions.json');
    expect(evolutions.map((e) => [e.from, e.to])).toEqual([
      [1, 2],
      [2, 3],
    ]);
    // Schema order, not insertion order — so a re-save produces no diff.
    expect(Object.keys(evolutions[1]!.conditions)).toEqual(['rank', 'ATK']);
  });

  it('produces the same revision for the same content', async () => {
    const first = await load();
    writeSeed();
    const second = await load();
    expect(second.revision).toBe(first.revision);
  });
});

describe('routing', () => {
  it('passes unrelated requests through to the next handler', async () => {
    const res = await fetch(`${base}/something-else`);
    expect(res.status).toBe(404);
  });

  it('rejects methods it does not implement', async () => {
    const res = await fetch(`${base}/api/dataset`, { method: 'DELETE' });
    expect(res.status).toBe(405);
  });
});
