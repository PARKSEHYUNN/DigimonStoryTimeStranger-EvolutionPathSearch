/**
 * Local-only read/write API for data/*.json.
 *
 * The legacy editor wrote straight into public/digimon_list.json from a
 * middleware inside the deployed app's vite.config, with no validation and no
 * concurrency guard. Two things replace that:
 *
 *   - nothing reaches disk unless `validateDataset` accepts it, so the admin
 *     tool cannot commit data the build would reject;
 *   - every save carries the revision it was based on, so a stale tab cannot
 *     silently overwrite a newer edit.
 *
 * Writes are canonicalised (sorted, 2-space, trailing newline) before hashing,
 * which keeps diffs to what actually changed and makes the revision stable.
 *
 * Mounted into the admin Vite dev server, or run on its own:
 *   node tools/data-server.ts [port]
 *
 * Binds to 127.0.0.1. This process rewrites the repository's source data; it
 * has no business listening on a network interface.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  validateDataset,
  type Dataset,
  type RawDataset,
} from '../src/lib/digimon/validate.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Overridable so the tests can point the write path at a throwaway directory.
 * Nothing in normal use sets these.
 */
const DATA = process.env.EVOLUTIONPATH_DATA_DIR ?? path.join(ROOT, 'data');
const ICONS = process.env.EVOLUTIONPATH_ICONS_DIR ?? path.join(ROOT, 'public', 'icons');

/** Dataset key → filename. The key is what the wire format uses. */
const FILES = {
  digimons: 'digimons.json',
  evolutions: 'evolutions.json',
  items: 'items.json',
  agentLevels: 'agent-levels.json',
} as const;

type FileKey = keyof typeof FILES;
const FILE_KEYS = Object.keys(FILES) as FileKey[];

/** Bodies are a few hundred KB; anything past this is not a real edit. */
const MAX_BODY = 16 * 1024 * 1024;

/* -------------------------------------------------------------------------- */
/* Canonical form                                                             */
/* -------------------------------------------------------------------------- */

/**
 * One serialization, used for both writing and hashing.
 *
 * Sorting here rather than in the UI means the file order never depends on the
 * order edits happened to be made in.
 */
function serialize(key: FileKey, dataset: Dataset): string {
  let value: unknown;

  switch (key) {
    case 'digimons':
      value = [...dataset.digimons].sort((a, b) => a.id - b.id);
      break;
    case 'evolutions':
      value = [...dataset.evolutions].sort(
        (a, b) => a.from - b.from || a.to - b.to,
      );
      break;
    case 'items':
      value = [...dataset.items].sort((a, b) => a.id - b.id);
      break;
    case 'agentLevels':
      value = {
        byGeneration: sortNumericKeys(dataset.agentLevels.byGeneration),
        byDigimonId: sortNumericKeys(dataset.agentLevels.byDigimonId),
      };
      break;
  }

  return `${JSON.stringify(value, null, 2)}\n`;
}

function sortNumericKeys(record: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => Number(a) - Number(b)),
  );
}

/** Identifies the on-disk state a client's edits were based on. */
function revisionOf(contents: Record<FileKey, string>): string {
  const hash = crypto.createHash('sha256');
  for (const key of FILE_KEYS) hash.update(key).update('\0').update(contents[key]);
  return hash.digest('hex').slice(0, 16);
}

/* -------------------------------------------------------------------------- */
/* Disk                                                                       */
/* -------------------------------------------------------------------------- */

function readRaw(): { raw: RawDataset; revision: string } {
  const contents = {} as Record<FileKey, string>;
  const raw = {} as Record<FileKey, unknown>;

  for (const key of FILE_KEYS) {
    const text = fs.readFileSync(path.join(DATA, FILES[key]), 'utf8');
    contents[key] = text;
    raw[key] = JSON.parse(text);
  }

  return { raw: raw as unknown as RawDataset, revision: revisionOf(contents) };
}

/** Digimon ids that have an icon. Numeric names only — `thumb/` is a directory. */
function iconIds(): ReadonlySet<number> | undefined {
  if (!fs.existsSync(ICONS)) return undefined;
  const ids = new Set<number>();
  for (const name of fs.readdirSync(ICONS)) {
    const base = name.replace(/\.[a-z0-9]+$/i, '');
    if (/^\d+$/.test(base)) ids.add(Number(base));
  }
  return ids;
}

/**
 * Writes only the files whose canonical form changed, each through a temp file
 * and a rename so a crash mid-write cannot leave a truncated data file behind.
 */
function writeDataset(dataset: Dataset): { revision: string; changed: string[] } {
  const contents = {} as Record<FileKey, string>;
  const changed: string[] = [];

  for (const key of FILE_KEYS) {
    const next = serialize(key, dataset);
    contents[key] = next;

    const file = path.join(DATA, FILES[key]);
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current === next) continue;

    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, next, 'utf8');
    fs.renameSync(tmp, file);
    changed.push(FILES[key]);
  }

  return { revision: revisionOf(contents), changed };
}

/* -------------------------------------------------------------------------- */
/* HTTP                                                                       */
/* -------------------------------------------------------------------------- */

function send(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function handleLoad(res: ServerResponse): void {
  const { raw, revision } = readRaw();
  const icons = iconIds();
  const { dataset, errors, notes } = validateDataset(raw, { iconIds: icons });

  // A rejected file still loads: the point of the editor is to fix it. The
  // errors ride along so the UI can show what is wrong from the start.
  send(res, 200, {
    revision,
    dataset: dataset ?? raw,
    iconIds: icons ? [...icons] : null,
    errors,
    notes,
  });
}

async function handleSave(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse(await readBody(req)) as {
    revision?: unknown;
    dataset?: unknown;
  };

  const { revision: current } = readRaw();
  if (body.revision !== current) {
    send(res, 409, {
      error:
        'data/ 파일이 이 편집 세션이 시작된 뒤에 바뀌었습니다. ' +
        '덮어쓰지 않도록 저장을 중단했습니다. 새로 고침 후 다시 편집해 주세요.',
      revision: current,
    });
    return;
  }

  const raw = body.dataset as RawDataset | undefined;
  if (!raw || typeof raw !== 'object') {
    send(res, 400, { error: 'dataset이 없습니다.' });
    return;
  }

  const icons = iconIds();
  const { dataset, errors, notes } = validateDataset(raw, { iconIds: icons });
  if (!dataset || errors.length) {
    send(res, 422, { error: '검증에 실패해 저장하지 않았습니다.', errors, notes });
    return;
  }

  const { revision, changed } = writeDataset(dataset);
  send(res, 200, { revision, changed, notes });
}

/**
 * Connect-style middleware, so the admin Vite server can mount it directly and
 * the whole tool runs as one process on one origin.
 */
export function dataApi(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void {
  const url = (req.url ?? '').split('?')[0];

  if (url !== '/api/dataset') {
    next();
    return;
  }

  const done = (promise: Promise<void>) =>
    promise.catch((error: unknown) => {
      send(res, 500, { error: error instanceof Error ? error.message : String(error) });
    });

  if (req.method === 'GET') {
    void done(Promise.resolve().then(() => handleLoad(res)));
    return;
  }
  if (req.method === 'POST') {
    void done(handleSave(req, res));
    return;
  }

  send(res, 405, { error: `${req.method} not allowed` });
}

/* -------------------------------------------------------------------------- */
/* Standalone                                                                 */
/* -------------------------------------------------------------------------- */

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const port = Number(process.argv[2] ?? 5174);
  http
    .createServer((req, res) =>
      dataApi(req, res, () => send(res, 404, { error: 'not found' })),
    )
    .listen(port, '127.0.0.1', () => {
      console.log(`data server on http://127.0.0.1:${port}/api/dataset`);
    });
}
