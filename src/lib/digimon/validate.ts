/**
 * The integrity rules for data/*.json, as a pure function.
 *
 * This is the single gate. `scripts/validate-data.ts` runs it before every
 * build, `tools/data-server.ts` runs it before every write, and the admin UI
 * runs it on every keystroke — all three against this file, so the admin tool
 * cannot accept anything the build would later reject.
 *
 * Deliberately free of `node:fs`: it also runs in the browser. Icon presence is
 * the one check that needs the filesystem, so the caller passes in the ids it
 * found.
 *
 * Imports carry explicit `.ts` extensions because Node's native type stripping
 * runs this file directly. Nothing in the Next build imports it, so the
 * bundler never sees the specifier.
 */
import {
  agentLevelsSchema,
  digimonsFileSchema,
  evolutionsFileSchema,
  itemsFileSchema,
  type AgentLevels,
  type Digimon,
  type Evolution,
  type Item,
} from './schema.ts';

export interface Dataset {
  digimons: Digimon[];
  evolutions: Evolution[];
  items: Item[];
  agentLevels: AgentLevels;
}

/** The same four slots, before parsing. */
export interface RawDataset {
  digimons: unknown;
  evolutions: unknown;
  items: unknown;
  agentLevels: unknown;
}

export interface ValidationReport {
  /** Blocking. The build fails and the admin tool refuses to write. */
  errors: string[];
  /** Worth knowing, not worth blocking on. */
  notes: string[];
}

export interface IntegrityOptions {
  /**
   * Digimon ids that have an icon file. Omit to skip the check rather than
   * report every Digimon as missing one.
   */
  iconIds?: ReadonlySet<number> | undefined;
}

/* -------------------------------------------------------------------------- */
/* Shape                                                                      */
/* -------------------------------------------------------------------------- */

const ISSUE_LIMIT = 20;

/** Zod-parses all four files. `dataset` is null when any of them fails. */
export function parseDataset(raw: RawDataset): {
  dataset: Dataset | null;
  errors: string[];
} {
  const errors: string[] = [];

  const digimons = digimonsFileSchema.safeParse(raw.digimons);
  const evolutions = evolutionsFileSchema.safeParse(raw.evolutions);
  const items = itemsFileSchema.safeParse(raw.items);
  const agentLevels = agentLevelsSchema.safeParse(raw.agentLevels);

  for (const [name, result] of [
    ['digimons.json', digimons],
    ['evolutions.json', evolutions],
    ['items.json', items],
    ['agent-levels.json', agentLevels],
  ] as const) {
    if (result.success) continue;
    for (const issue of result.error.issues.slice(0, ISSUE_LIMIT)) {
      errors.push(`${name}: ${issue.path.join('.') || '(root)'} — ${issue.message}`);
    }
  }

  if (
    !digimons.success ||
    !evolutions.success ||
    !items.success ||
    !agentLevels.success
  ) {
    return { dataset: null, errors };
  }

  return {
    dataset: {
      digimons: digimons.data,
      evolutions: evolutions.data,
      items: items.data,
      agentLevels: agentLevels.data,
    },
    errors,
  };
}

/* -------------------------------------------------------------------------- */
/* Cross-file integrity                                                       */
/* -------------------------------------------------------------------------- */

/** Everything a schema cannot express: uniqueness, references, reachability. */
export function checkIntegrity(
  dataset: Dataset,
  options: IntegrityOptions = {},
): ValidationReport {
  const { digimons, evolutions, items, agentLevels } = dataset;
  const errors: string[] = [];
  const notes: string[] = [];

  /* -- uniqueness --------------------------------------------------------- */

  const byId = new Map<number, Digimon>();
  for (const d of digimons) {
    if (byId.has(d.id)) errors.push(`중복 디지몬 id ${d.id}`);
    byId.set(d.id, d);
  }

  const slugs = new Map<string, number>();
  for (const d of digimons) {
    const owner = slugs.get(d.slug);
    if (owner !== undefined) {
      errors.push(`슬러그 "${d.slug}"를 ${owner}번과 ${d.id}번이 함께 사용`);
    }
    slugs.set(d.slug, d.id);
  }

  const itemIds = new Set<number>();
  for (const i of items) {
    if (itemIds.has(i.id)) errors.push(`중복 아이템 id ${i.id}`);
    itemIds.add(i.id);
  }

  /* -- referential integrity ---------------------------------------------- */

  const seen = new Set<string>();
  for (const e of evolutions) {
    const key = `${e.from} → ${e.to}`;
    if (seen.has(key)) errors.push(`중복 진화 간선 ${key}`);
    seen.add(key);

    if (!byId.has(e.from)) errors.push(`진화 ${key}: 존재하지 않는 출발 ${e.from}`);
    if (!byId.has(e.to)) errors.push(`진화 ${key}: 존재하지 않는 도착 ${e.to}`);
    if (e.from === e.to) errors.push(`진화 ${key}: 자기 자신으로의 진화`);

    const { item, jogress } = e.conditions;
    if (item !== undefined && !itemIds.has(item)) {
      errors.push(`진화 ${key}: 존재하지 않는 아이템 ${item}`);
    }
    if (jogress) {
      for (const partner of jogress) {
        if (!byId.has(partner.id)) {
          errors.push(`진화 ${key}: 조그레스 상대 ${partner.id}가 존재하지 않음`);
        }
      }
      // Holds across all 34 Jogress edges in the data, and a Digimon fusing
      // with itself has no meaning in the game.
      if (jogress[0].id === jogress[1].id) {
        errors.push(`진화 ${key}: 조그레스 상대 둘이 같음 (${jogress[0].id})`);
      }
      // One partner is always the Digimon initiating the fusion.
      const ids = jogress.map((p) => p.id);
      if (!ids.includes(e.from)) {
        notes.push(
          `진화 ${key}: 조그레스 상대(${ids.join(', ')})에 출발 디지몬이 없음`,
        );
      }
    }
  }

  /* -- agent levels ------------------------------------------------------- */

  for (const key of Object.keys(agentLevels.byDigimonId)) {
    if (!byId.has(Number(key))) {
      errors.push(`agent-levels: 존재하지 않는 디지몬 ${key}의 개별 설정`);
    }
  }

  const generations = new Set(digimons.map((d) => d.generation));
  for (const gen of generations) {
    if (agentLevels.byGeneration[String(gen)] === undefined) {
      errors.push(`agent-levels: ${gen}세대의 기본 레벨이 없음`);
    }
  }
  for (const key of Object.keys(agentLevels.byGeneration)) {
    if (!generations.has(Number(key))) {
      notes.push(`agent-levels: ${key}세대에 해당하는 디지몬이 없음`);
    }
  }

  /* -- connectivity ------------------------------------------------------- */

  const connected = new Set<number>();
  for (const e of evolutions) {
    connected.add(e.from);
    connected.add(e.to);
  }
  const isolated = digimons.filter((d) => !connected.has(d.id));
  if (isolated.length) {
    notes.push(
      `진화 관계가 없는 디지몬 ${isolated.length}종: ` +
        isolated
          .slice(0, 15)
          .map((d) => `${d.id} ${d.names.en}`)
          .join(', '),
    );
  }

  /* -- assets ------------------------------------------------------------- */

  if (options.iconIds) {
    const missing = digimons.filter((d) => !options.iconIds!.has(d.id));
    if (missing.length) {
      errors.push(
        `아이콘이 없는 디지몬 ${missing.length}종: ` +
          missing
            .slice(0, 15)
            .map((d) => `${d.id} ${d.names.en}`)
            .join(', '),
      );
    }
  }

  return { errors, notes };
}

/** Parse then check. Integrity runs only when the shape is sound. */
export function validateDataset(
  raw: RawDataset,
  options: IntegrityOptions = {},
): { dataset: Dataset | null } & ValidationReport {
  const { dataset, errors } = parseDataset(raw);
  if (!dataset) return { dataset: null, errors, notes: [] };

  const integrity = checkIntegrity(dataset, options);
  return {
    dataset,
    errors: [...errors, ...integrity.errors],
    notes: integrity.notes,
  };
}
