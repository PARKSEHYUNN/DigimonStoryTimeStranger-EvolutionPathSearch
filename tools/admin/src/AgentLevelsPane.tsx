import { useMemo } from 'react';
import type { AgentLevels } from '@/lib/digimon/schema';
import type { Dataset } from '@/lib/digimon/validate';
import { DigimonPicker } from './DigimonPicker';
import { GENERATION_OPTIONS, generationLabel } from './labels';
import { Field, Icon, Section, buttonClass, inputClass } from './ui';

const LEVELS = Array.from({ length: 10 }, (_, index) => index + 1);

function LevelSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <select
      className={inputClass}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {LEVELS.map((level) => (
        <option key={level} value={level}>
          Lv {level}
        </option>
      ))}
    </select>
  );
}

/**
 * The agent level gate: a default per generation, with per-Digimon overrides
 * that win when present.
 */
export function AgentLevelsPane({
  dataset,
  onDataset,
}: {
  dataset: Dataset;
  onDataset: (next: Dataset) => void;
}) {
  const { agentLevels, digimons } = dataset;

  const byId = useMemo(() => new Map(digimons.map((d) => [d.id, d])), [digimons]);

  const set = (next: AgentLevels) => onDataset({ ...dataset, agentLevels: next });

  const overrides = useMemo(
    () =>
      Object.entries(agentLevels.byDigimonId)
        .map(([id, level]) => ({ id: Number(id), level }))
        .sort((a, b) => a.id - b.id),
    [agentLevels.byDigimonId],
  );

  const overridden = useMemo(
    () => new Set(overrides.map((o) => o.id)),
    [overrides],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="세대별 기본값">
        <div className="grid gap-3 sm:grid-cols-2">
          {GENERATION_OPTIONS.map((option) => (
            <Field key={option.value} label={option.label}>
              <LevelSelect
                value={agentLevels.byGeneration[String(option.value)] ?? 1}
                onChange={(level) =>
                  set({
                    ...agentLevels,
                    byGeneration: {
                      ...agentLevels.byGeneration,
                      [String(option.value)]: level,
                    },
                  })
                }
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title={`개별 설정 — ${overrides.length}종`}>
        <p className="mb-3 text-xs text-slate-500">
          세대 기본값 대신 적용됩니다.
        </p>

        <div className="mb-3 space-y-1.5">
          {overrides.map(({ id, level }) => {
            const digimon = byId.get(id);
            return (
              <div key={id} className="flex items-center gap-2">
                <Icon id={id} size={22} />
                <span className="w-9 shrink-0 text-right font-mono text-xs text-slate-500">
                  {id}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {digimon ? digimon.names.ko : '(없는 디지몬)'}
                  {digimon && (
                    <span className="ml-1.5 text-xs text-slate-600">
                      {generationLabel(digimon.generation)} 기본{' '}
                      {agentLevels.byGeneration[String(digimon.generation)] ?? '?'}
                    </span>
                  )}
                </span>
                <div className="w-24 shrink-0">
                  <LevelSelect
                    value={level}
                    onChange={(next) =>
                      set({
                        ...agentLevels,
                        byDigimonId: { ...agentLevels.byDigimonId, [String(id)]: next },
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => {
                    const { [String(id)]: _removed, ...rest } = agentLevels.byDigimonId;
                    set({ ...agentLevels, byDigimonId: rest });
                  }}
                >
                  해제
                </button>
              </div>
            );
          })}
        </div>

        <Field label="개별 설정 추가">
          <DigimonPicker
            digimons={digimons}
            exclude={overridden}
            onPick={(picked) =>
              set({
                ...agentLevels,
                byDigimonId: {
                  ...agentLevels.byDigimonId,
                  [String(picked.id)]:
                    agentLevels.byGeneration[String(picked.generation)] ?? 1,
                },
              })
            }
          />
        </Field>
      </Section>
    </div>
  );
}
