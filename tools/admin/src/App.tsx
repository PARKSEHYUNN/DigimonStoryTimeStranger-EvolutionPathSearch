import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Dataset } from '@/lib/digimon/validate';
import { validateDataset } from '@/lib/digimon/validate';
import { AgentLevelsPane } from './AgentLevelsPane';
import { DigimonPane } from './DigimonPane';
import { ItemsPane } from './ItemsPane';
import { loadDataset, saveDataset } from './api';
import { primaryButtonClass } from './ui';

type Tab = 'digimon' | 'items' | 'agent';

const TABS: { id: Tab; label: string }[] = [
  { id: 'digimon', label: '디지몬' },
  { id: 'items', label: '아이템' },
  { id: 'agent', label: '에이전트 레벨' },
];

interface Loaded {
  revision: string;
  dataset: Dataset;
  iconIds: ReadonlySet<number> | undefined;
}

export function App() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    { kind: 'ok' | 'error'; message: string; details?: string[] } | null
  >(null);
  const [tab, setTab] = useState<Tab>('digimon');

  useEffect(() => {
    loadDataset()
      .then((result) =>
        setLoaded({
          revision: result.revision,
          dataset: result.dataset,
          iconIds: result.iconIds ? new Set(result.iconIds) : undefined,
        }),
      )
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error.message : String(error)),
      );
  }, []);

  // Closing with unsaved edits loses them: nothing is written until Save.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /**
   * Validated with the exact function the server uses before writing and the
   * build uses before shipping, so what shows here is what will be enforced.
   * Deferred so a 1,100-edge revalidation never blocks a keystroke.
   */
  const deferred = useDeferredValue(loaded?.dataset);
  const report = useMemo(() => {
    if (!deferred) return { errors: [], notes: [] };
    const { errors, notes } = validateDataset(deferred, {
      iconIds: loaded?.iconIds,
    });
    return { errors, notes };
  }, [deferred, loaded?.iconIds]);

  const validating = loaded?.dataset !== deferred;

  const update = (next: Dataset) => {
    setLoaded((current) => (current ? { ...current, dataset: next } : current));
    setDirty(true);
    setStatus(null);
  };

  const save = async () => {
    if (!loaded) return;
    setSaving(true);
    setStatus(null);
    try {
      const result = await saveDataset(loaded.revision, loaded.dataset);
      if (result.ok) {
        setLoaded({ ...loaded, revision: result.revision });
        setDirty(false);
        setStatus({
          kind: 'ok',
          message: result.changed.length
            ? `저장했습니다 — ${result.changed.join(', ')}`
            : '변경된 내용이 없어 파일을 건드리지 않았습니다.',
          details: result.notes,
        });
      } else {
        setStatus({ kind: 'error', message: result.message, details: result.errors });
      }
    } catch (error: unknown) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <Centered>
        <p className="text-red-400">{loadError}</p>
        <p className="mt-2 text-slate-500">`npm run admin`으로 다시 실행해 주세요.</p>
      </Centered>
    );
  }

  if (!loaded) return <Centered>불러오는 중…</Centered>;

  const blocked = report.errors.length > 0;

  return (
    <div className="mx-auto max-w-[110rem] p-4 sm:p-6">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-base font-semibold text-slate-100">
          EvolutionPath 데이터 편집기
        </h1>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
          {loaded.revision}
        </span>

        <nav className="ml-2 flex gap-1">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${
                tab === entry.id
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {dirty && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              저장하지 않은 변경
            </span>
          )}
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!dirty || blocked || saving || validating}
            title={blocked ? '검증 오류를 먼저 해결해야 저장할 수 있습니다.' : undefined}
            onClick={() => void save()}
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </header>

      {status && (
        <Panel tone={status.kind === 'ok' ? 'ok' : 'error'}>
          <p>{status.message}</p>
          {status.details?.length ? (
            <ul className="mt-1.5 space-y-0.5 font-mono text-xs">
              {status.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </Panel>
      )}

      {report.errors.length > 0 && (
        <Panel tone="error">
          <p className="font-medium">
            검증 오류 {report.errors.length}건 — 해결해야 저장할 수 있습니다.
          </p>
          <ul className="mt-1.5 max-h-40 space-y-0.5 overflow-y-auto font-mono text-xs">
            {report.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Panel>
      )}

      {report.notes.length > 0 && (
        <Panel tone="note">
          <ul className="space-y-0.5 text-xs">
            {report.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Panel>
      )}

      {tab === 'digimon' && (
        <DigimonPane dataset={loaded.dataset} onDataset={update} />
      )}
      {tab === 'items' && <ItemsPane dataset={loaded.dataset} onDataset={update} />}
      {tab === 'agent' && (
        <AgentLevelsPane dataset={loaded.dataset} onDataset={update} />
      )}
    </div>
  );
}

function Panel({
  tone,
  children,
}: {
  tone: 'ok' | 'error' | 'note';
  children: ReactNode;
}) {
  const tones = {
    ok: 'border-emerald-900 bg-emerald-950/40 text-emerald-300',
    error: 'border-red-900 bg-red-950/40 text-red-300',
    note: 'border-slate-800 bg-slate-900/40 text-slate-400',
  } as const;

  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-sm text-slate-400">
      {children}
    </div>
  );
}
