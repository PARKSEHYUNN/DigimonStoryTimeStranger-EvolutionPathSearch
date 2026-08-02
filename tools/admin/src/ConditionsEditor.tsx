import { useState } from 'react';
import type {
  BondKey,
  Digimon,
  EvolutionConditions,
  Item,
  StatKey,
} from '@/lib/digimon/schema';
import { DigimonPicker } from './DigimonPicker';
import {
  BOND_KEYS,
  PERSONALITY_OPTIONS,
  STAT_KEYS,
  bondLabel,
  personalityLabel,
  statLabel,
} from './labels';
import { Field, Icon, NumberInput, Select, buttonClass, inputClass } from './ui';

type ThresholdKey = StatKey | BondKey;

/**
 * The requirements on one directed edge.
 *
 * `rank` is the only mandatory field; every other threshold is present or
 * absent, never zero, so clearing an input removes the condition rather than
 * setting it to 0.
 */
export function ConditionsEditor({
  conditions,
  source,
  digimons,
  items,
  onChange,
}: {
  conditions: EvolutionConditions;
  /** The edge's `from` Digimon — the one that must be a Jogress partner. */
  source: Digimon;
  digimons: readonly Digimon[];
  items: readonly Item[];
  onChange: (conditions: EvolutionConditions) => void;
}) {
  const setThreshold = (key: ThresholdKey, value: number | undefined) => {
    const next = { ...conditions };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  const setItem = (id: number | undefined) => {
    const next = { ...conditions };
    if (id === undefined) delete next.item;
    else next.item = id;
    onChange(next);
  };

  const toggleJogress = (enabled: boolean) => {
    const next = { ...conditions };
    if (!enabled) {
      delete next.jogress;
    } else {
      // Seeded with the source on both sides: the source is always one of the
      // partners, and the duplicate is flagged until the other is picked.
      next.jogress = [
        { id: source.id, personality: source.personality },
        { id: source.id, personality: source.personality },
      ];
    }
    onChange(next);
  };

  const setPartner = (index: 0 | 1, patch: { id?: number; personality?: number }) => {
    if (!conditions.jogress) return;
    const partners = [conditions.jogress[0], conditions.jogress[1]] as [
      { id: number; personality: number },
      { id: number; personality: number },
    ];
    partners[index] = { ...partners[index], ...patch };
    onChange({ ...conditions, jogress: partners });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Field label="Lv" hint="필수">
          <NumberInput
            min={1}
            placeholder="1"
            value={conditions.rank}
            onChange={(value) => onChange({ ...conditions, rank: value ?? 1 })}
          />
        </Field>

        {STAT_KEYS.map((key) => (
          <Field key={key} label={key} hint={statLabel(key)}>
            <NumberInput
              value={conditions[key]}
              onChange={(value) => setThreshold(key, value)}
            />
          </Field>
        ))}

        {BOND_KEYS.map((key) => (
          <Field key={key} label={bondLabel(key)}>
            <NumberInput
              value={conditions[key]}
              onChange={(value) => setThreshold(key, value)}
            />
          </Field>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="필요 아이템">
          <select
            className={inputClass}
            value={conditions.item ?? ''}
            onChange={(event) =>
              setItem(event.target.value === '' ? undefined : Number(event.target.value))
            }
          >
            <option value="">없음</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id} · {item.names.ko}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 py-1.5 text-sm text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 accent-sky-500"
              checked={conditions.jogress !== undefined}
              onChange={(event) => toggleJogress(event.target.checked)}
            />
            조그레스 진화
          </label>
        </div>
      </div>

      {conditions.jogress && (
        <div className="space-y-2 rounded-md border border-violet-900/70 bg-violet-950/20 p-3">
          <p className="text-xs text-violet-300">
            상대 두 마리와 각각의 성격이 모두 일치해야 진화합니다. 한쪽은 반드시 이
            진화의 출발 디지몬({source.names.ko})이어야 합니다.
          </p>
          {([0, 1] as const).map((index) => (
            <JogressPartnerRow
              key={index}
              index={index}
              partner={conditions.jogress![index]}
              duplicate={conditions.jogress![0].id === conditions.jogress![1].id}
              digimons={digimons}
              onChange={(patch) => setPartner(index, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JogressPartnerRow({
  index,
  partner,
  duplicate,
  digimons,
  onChange,
}: {
  index: 0 | 1;
  partner: { id: number; personality: number };
  duplicate: boolean;
  digimons: readonly Digimon[];
  onChange: (patch: { id?: number; personality?: number }) => void;
}) {
  const [picking, setPicking] = useState(false);
  const digimon = digimons.find((d) => d.id === partner.id);

  return (
    <div className="grid items-end gap-2 sm:grid-cols-[1fr_14rem]">
      <Field label={`상대 ${index + 1}`}>
        {picking ? (
          <DigimonPicker
            digimons={digimons}
            autoFocus
            onPick={(picked) => {
              onChange({ id: picked.id });
              setPicking(false);
            }}
          />
        ) : (
          <button
            type="button"
            className={`${buttonClass} flex w-full items-center gap-2 text-left ${
              duplicate ? 'border-amber-700 text-amber-300' : ''
            }`}
            onClick={() => setPicking(true)}
          >
            <Icon id={partner.id} size={20} />
            <span className="truncate">
              {digimon ? `${digimon.id} · ${digimon.names.ko}` : `#${partner.id} (없음)`}
            </span>
            <span className="ml-auto shrink-0 text-xs text-slate-500">변경</span>
          </button>
        )}
      </Field>

      <Field label="성격" hint={personalityLabel(partner.personality)}>
        <Select
          value={partner.personality}
          options={PERSONALITY_OPTIONS}
          onChange={(personality) => onChange({ personality })}
        />
      </Field>
    </div>
  );
}
