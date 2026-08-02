import { useMemo, useState } from 'react';
import type {
  Digimon,
  Evolution,
  EvolutionConditions,
  Item,
} from '@/lib/digimon/schema';
import { BOND_KEYS, STAT_KEYS } from '@/lib/digimon/schema';
import type { Dataset } from '@/lib/digimon/validate';
import { ConditionsEditor } from './ConditionsEditor';
import { DigimonPicker } from './DigimonPicker';
import {
  ATTRIBUTE_OPTIONS,
  GENERATION_OPTIONS,
  PERSONALITY_OPTIONS,
  bondLabel,
} from './labels';
import {
  Field,
  Icon,
  Section,
  Select,
  buttonClass,
  dangerButtonClass,
  inputClass,
} from './ui';

export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** One-line digest so a collapsed edge still says what it requires. */
function summarize(conditions: EvolutionConditions, items: readonly Item[]): string {
  const parts = [`Lv ${conditions.rank}`];
  for (const key of STAT_KEYS) {
    const value = conditions[key];
    if (value !== undefined) parts.push(`${key} ${value}`);
  }
  for (const key of BOND_KEYS) {
    const value = conditions[key];
    if (value !== undefined) parts.push(`${bondLabel(key)} ${value}`);
  }
  if (conditions.item !== undefined) {
    const item = items.find((i) => i.id === conditions.item);
    parts.push(item ? item.names.ko : `아이템 #${conditions.item}`);
  }
  if (conditions.jogress) parts.push('조그레스');
  return parts.join(' · ');
}

export function DigimonEditor({
  digimon,
  dataset,
  onDataset,
  onSelect,
  onDelete,
}: {
  digimon: Digimon;
  dataset: Dataset;
  onDataset: (next: Dataset) => void;
  onSelect: (id: number) => void;
  onDelete: () => void;
}) {
  const { digimons, evolutions, items } = dataset;

  const byId = useMemo(
    () => new Map(digimons.map((d) => [d.id, d])),
    [digimons],
  );

  const outgoing = useMemo(
    () => evolutions.filter((e) => e.from === digimon.id),
    [evolutions, digimon.id],
  );
  const incoming = useMemo(
    () => evolutions.filter((e) => e.to === digimon.id),
    [evolutions, digimon.id],
  );

  const patch = (changes: Partial<Digimon>) =>
    onDataset({
      ...dataset,
      digimons: digimons.map((d) =>
        d.id === digimon.id ? { ...d, ...changes } : d,
      ),
    });

  const setEvolutions = (next: Evolution[]) => onDataset({ ...dataset, evolutions: next });

  const addEdge = (from: number, to: number) =>
    setEvolutions([...evolutions, { from, to, conditions: { rank: 1 } }]);

  const removeEdge = (from: number, to: number) =>
    setEvolutions(evolutions.filter((e) => !(e.from === from && e.to === to)));

  const setConditions = (from: number, to: number, conditions: EvolutionConditions) =>
    setEvolutions(
      evolutions.map((e) =>
        e.from === from && e.to === to ? { ...e, conditions } : e,
      ),
    );

  /**
   * Deleting cascades the edges that touch this Digimon, since an edge without
   * an endpoint has no meaning. Jogress mentions on *other* edges are a
   * different matter — removing them would quietly change what those edges
   * require — so they block the delete and get listed instead.
   */
  const handleDelete = () => {
    const jogressRefs = evolutions.filter(
      (e) =>
        e.from !== digimon.id &&
        e.to !== digimon.id &&
        e.conditions.jogress?.some((p) => p.id === digimon.id),
    );

    if (jogressRefs.length) {
      window.alert(
        `다른 진화 ${jogressRefs.length}건이 이 디지몬을 조그레스 상대로 지정하고 있어 삭제할 수 없습니다.\n` +
          jogressRefs
            .slice(0, 10)
            .map((e) => `  ${e.from} → ${e.to}`)
            .join('\n'),
      );
      return;
    }

    const edges = outgoing.length + incoming.length;
    if (
      !window.confirm(
        `${digimon.id} ${digimon.names.ko}을(를) 삭제합니다.\n연결된 진화 ${edges}건도 함께 삭제됩니다.`,
      )
    ) {
      return;
    }

    const { [String(digimon.id)]: _removed, ...byDigimonId } =
      dataset.agentLevels.byDigimonId;

    onDataset({
      ...dataset,
      digimons: digimons.filter((d) => d.id !== digimon.id),
      evolutions: evolutions.filter(
        (e) => e.from !== digimon.id && e.to !== digimon.id,
      ),
      agentLevels: { ...dataset.agentLevels, byDigimonId },
    });
    onDelete();
  };

  const connectedOut = new Set([digimon.id, ...outgoing.map((e) => e.to)]);
  const connectedIn = new Set([digimon.id, ...incoming.map((e) => e.from)]);

  return (
    <div className="space-y-4">
      <Section
        title="기본 정보"
        action={
          <button type="button" className={dangerButtonClass} onClick={handleDelete}>
            삭제
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="ID" hint="변경 불가">
            <input
              className={`${inputClass} text-slate-500`}
              value={digimon.id}
              readOnly
            />
          </Field>

          <Field label="슬러그" hint="URL 경로">
            <div className="flex gap-1.5">
              <input
                className={inputClass}
                value={digimon.slug}
                onChange={(event) => patch({ slug: event.target.value })}
              />
              <button
                type="button"
                className={`${buttonClass} shrink-0`}
                title="영어 이름에서 생성"
                onClick={() => patch({ slug: slugify(digimon.names.en) })}
              >
                자동
              </button>
            </div>
          </Field>

          <Field label="DLC">
            <label className="flex h-[34px] cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 accent-violet-500"
                checked={digimon.dlc}
                onChange={(event) => patch({ dlc: event.target.checked })}
              />
              유료 DLC 전용
            </label>
          </Field>

          {(['en', 'ko', 'ja'] as const).map((locale) => (
            <Field key={locale} label={`이름 (${locale})`}>
              <input
                className={inputClass}
                value={digimon.names[locale]}
                onChange={(event) =>
                  patch({ names: { ...digimon.names, [locale]: event.target.value } })
                }
              />
            </Field>
          ))}

          <Field label="세대">
            <Select
              value={digimon.generation}
              options={GENERATION_OPTIONS}
              onChange={(generation) => patch({ generation })}
            />
          </Field>
          <Field label="속성">
            <Select
              value={digimon.attribute}
              options={ATTRIBUTE_OPTIONS}
              onChange={(attribute) => patch({ attribute })}
            />
          </Field>
          <Field label="기본 성격">
            <Select
              value={digimon.personality}
              options={PERSONALITY_OPTIONS}
              onChange={(personality) => patch({ personality })}
            />
          </Field>
        </div>
      </Section>

      <Section title={`진화 후 — ${outgoing.length}건`}>
        <p className="mb-3 text-xs text-slate-500">
          이 디지몬에서 나가는 진화입니다. 조건은 이 간선 하나에만 저장되므로 상대편을
          따로 고칠 필요가 없습니다.
        </p>
        <div className="space-y-2">
          {outgoing.map((edge) => (
            <EdgeRow
              key={`${edge.from}>${edge.to}`}
              edge={edge}
              counterpart={byId.get(edge.to)}
              arrow="→"
              source={digimon}
              digimons={digimons}
              items={items}
              onSelect={onSelect}
              onRemove={() => removeEdge(edge.from, edge.to)}
              onConditions={(conditions) =>
                setConditions(edge.from, edge.to, conditions)
              }
            />
          ))}
        </div>
        <div className="mt-3">
          <Field label="진화 후 추가">
            <DigimonPicker
              digimons={digimons}
              exclude={connectedOut}
              onPick={(picked) => addEdge(digimon.id, picked.id)}
            />
          </Field>
        </div>
      </Section>

      <Section title={`진화 전 — ${incoming.length}건`}>
        <p className="mb-3 text-xs text-slate-500">
          다른 디지몬에서 이 디지몬으로 들어오는 진화입니다. 여기서 수정하면 그
          디지몬의 간선이 바로 바뀝니다.
        </p>
        <div className="space-y-2">
          {incoming.map((edge) => {
            const from = byId.get(edge.from);
            return (
              <EdgeRow
                key={`${edge.from}>${edge.to}`}
                edge={edge}
                counterpart={from}
                arrow="←"
                source={from ?? digimon}
                digimons={digimons}
                items={items}
                onSelect={onSelect}
                onRemove={() => removeEdge(edge.from, edge.to)}
                onConditions={(conditions) =>
                  setConditions(edge.from, edge.to, conditions)
                }
              />
            );
          })}
        </div>
        <div className="mt-3">
          <Field label="진화 전 추가">
            <DigimonPicker
              digimons={digimons}
              exclude={connectedIn}
              onPick={(picked) => addEdge(picked.id, digimon.id)}
            />
          </Field>
        </div>
      </Section>
    </div>
  );
}

function EdgeRow({
  edge,
  counterpart,
  arrow,
  source,
  digimons,
  items,
  onSelect,
  onRemove,
  onConditions,
}: {
  edge: Evolution;
  counterpart: Digimon | undefined;
  arrow: '→' | '←';
  source: Digimon;
  digimons: readonly Digimon[];
  items: readonly Item[];
  onSelect: (id: number) => void;
  onRemove: () => void;
  onConditions: (conditions: EvolutionConditions) => void;
}) {
  const [open, setOpen] = useState(false);
  const otherId = arrow === '→' ? edge.to : edge.from;

  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/60">
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          className="w-6 shrink-0 text-slate-500 hover:text-slate-200"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? '▾' : '▸'}
        </button>
        <span className="text-slate-600">{arrow}</span>
        <Icon id={otherId} size={22} />
        <button
          type="button"
          className="truncate text-sm text-sky-400 hover:underline"
          onClick={() => onSelect(otherId)}
        >
          {counterpart ? `${counterpart.id} · ${counterpart.names.ko}` : `#${otherId} (없음)`}
        </button>
        <span className="ml-auto hidden truncate pl-3 text-xs text-slate-500 sm:block">
          {summarize(edge.conditions, items)}
        </span>
        <button
          type="button"
          className="shrink-0 px-1 text-slate-600 hover:text-red-400"
          title="이 진화 삭제"
          onClick={onRemove}
        >
          ✕
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-800 p-3">
          <ConditionsEditor
            conditions={edge.conditions}
            source={source}
            digimons={digimons}
            items={items}
            onChange={onConditions}
          />
        </div>
      )}
    </div>
  );
}
