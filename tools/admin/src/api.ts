import type { Dataset } from '@/lib/digimon/validate';

const ENDPOINT = '/api/dataset';

export interface LoadResult {
  revision: string;
  dataset: Dataset;
  /** null when public/icons has not been generated yet. */
  iconIds: number[] | null;
  errors: string[];
  notes: string[];
}

export interface SaveOk {
  ok: true;
  revision: string;
  /** Filenames actually rewritten — empty when the edit was a no-op. */
  changed: string[];
  notes: string[];
}

export interface SaveFailure {
  ok: false;
  /** 409 means the files moved underneath this session; only a reload fixes it. */
  stale: boolean;
  message: string;
  errors: string[];
}

export async function loadDataset(): Promise<LoadResult> {
  const res = await fetch(ENDPOINT, { cache: 'no-store' });
  if (!res.ok) throw new Error(`데이터를 불러오지 못했습니다 (HTTP ${res.status})`);
  return (await res.json()) as LoadResult;
}

export async function saveDataset(
  revision: string,
  dataset: Dataset,
): Promise<SaveOk | SaveFailure> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ revision, dataset }),
  });

  const body = (await res.json()) as Record<string, unknown>;

  if (res.ok) {
    return {
      ok: true,
      revision: String(body.revision),
      changed: (body.changed as string[] | undefined) ?? [],
      notes: (body.notes as string[] | undefined) ?? [],
    };
  }

  return {
    ok: false,
    stale: res.status === 409,
    message: String(body.error ?? `저장에 실패했습니다 (HTTP ${res.status})`),
    errors: (body.errors as string[] | undefined) ?? [],
  };
}
