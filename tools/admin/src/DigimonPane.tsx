import { useMemo, useState } from 'react';
import type { Digimon } from '@/lib/digimon/schema';
import type { Dataset } from '@/lib/digimon/validate';
import { DigimonEditor } from './DigimonEditor';
import { searchDigimons } from './DigimonPicker';
import { GENERATION_OPTIONS, generationLabel } from './labels';
import { Icon, buttonClass, inputClass, primaryButtonClass } from './ui';

/** Long enough to scroll through, short enough that the list stays instant. */
const LIST_LIMIT = 300;

export function DigimonPane({
  dataset,
  onDataset,
}: {
  dataset: Dataset;
  onDataset: (next: Dataset) => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState<number | 'all'>('all');
  const [dlcOnly, setDlcOnly] = useState(false);

  const { digimons, evolutions } = dataset;

  const matches = useMemo(() => {
    const base = query.trim()
      ? searchDigimons(digimons, query, Number.POSITIVE_INFINITY)
      : digimons;
    return base.filter(
      (d) =>
        (generation === 'all' || d.generation === generation) &&
        (!dlcOnly || d.dlc),
    );
  }, [digimons, query, generation, dlcOnly]);

  const edgeCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const e of evolutions) {
      counts.set(e.from, (counts.get(e.from) ?? 0) + 1);
      counts.set(e.to, (counts.get(e.to) ?? 0) + 1);
    }
    return counts;
  }, [evolutions]);

  const selected = digimons.find((d) => d.id === selectedId) ?? null;

  /** Fills the lowest gap before extending the range, so ids stay contiguous. */
  const nextId = useMemo(() => {
    const taken = new Set(digimons.map((d) => d.id));
    let candidate = 1;
    while (taken.has(candidate)) candidate++;
    return candidate;
  }, [digimons]);

  const createDigimon = () => {
    const created: Digimon = {
      id: nextId,
      slug: `digimon-${nextId}`,
      names: { en: '', ko: '', ja: '' },
      generation: 0,
      attribute: 0,
      personality: 0,
      dlc: false,
    };
    onDataset({ ...dataset, digimons: [...digimons, created] });
    setSelectedId(created.id);
    setQuery('');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
      <div className="flex max-h-[calc(100vh-11rem)] flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder="이름 또는 ID로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className={`${primaryButtonClass} shrink-0`}
            onClick={createDigimon}
            title={`ID ${nextId}로 추가`}
          >
            + {nextId}
          </button>
        </div>

        <div className="flex gap-2">
          <select
            className={inputClass}
            value={String(generation)}
            onChange={(event) =>
              setGeneration(
                event.target.value === 'all' ? 'all' : Number(event.target.value),
              )
            }
          >
            <option value="all">모든 세대</option>
            {GENERATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-slate-400">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-violet-500"
              checked={dlcOnly}
              onChange={(event) => setDlcOnly(event.target.checked)}
            />
            DLC만
          </label>
        </div>

        <p className="text-xs text-slate-500">
          {matches.length.toLocaleString()}종
          {matches.length > LIST_LIMIT && ` (앞 ${LIST_LIMIT}종 표시)`}
        </p>

        <ul className="-mr-1 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {matches.slice(0, LIST_LIMIT).map((digimon) => (
            <li key={digimon.id}>
              <button
                type="button"
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                  digimon.id === selectedId
                    ? 'bg-sky-950 text-sky-100'
                    : 'hover:bg-slate-800'
                }`}
                onClick={() => setSelectedId(digimon.id)}
              >
                <span className="w-9 shrink-0 text-right font-mono text-xs text-slate-500">
                  {digimon.id}
                </span>
                <Icon id={digimon.id} size={22} />
                <span className="truncate">{digimon.names.ko || '(이름 없음)'}</span>
                {digimon.dlc && (
                  <span className="shrink-0 rounded bg-violet-950 px-1 text-[10px] text-violet-300">
                    DLC
                  </span>
                )}
                <span className="ml-auto shrink-0 text-[10px] text-slate-600">
                  {generationLabel(digimon.generation)} · {edgeCounts.get(digimon.id) ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0">
        {selected ? (
          <DigimonEditor
            key={selected.id}
            digimon={selected}
            dataset={dataset}
            onDataset={onDataset}
            onSelect={setSelectedId}
            onDelete={() => setSelectedId(null)}
          />
        ) : (
          <EmptyState onCreate={createDigimon} nextId={nextId} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ nextId, onCreate }: { nextId: number; onCreate: () => void }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-800 text-sm text-slate-500">
      <p>왼쪽에서 디지몬을 선택하세요.</p>
      <button type="button" className={buttonClass} onClick={onCreate}>
        ID {nextId}로 새 디지몬 추가
      </button>
    </div>
  );
}
