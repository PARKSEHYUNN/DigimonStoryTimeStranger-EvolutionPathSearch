import { useMemo } from 'react';
import type { Item } from '@/lib/digimon/schema';
import type { Dataset } from '@/lib/digimon/validate';
import { Section, buttonClass, inputClass, primaryButtonClass } from './ui';

export function ItemsPane({
  dataset,
  onDataset,
}: {
  dataset: Dataset;
  onDataset: (next: Dataset) => void;
}) {
  const { items, evolutions } = dataset;

  /** How many evolutions require each item — a delete guard and a sanity check. */
  const usage = useMemo(() => {
    const counts = new Map<number, number>();
    for (const e of evolutions) {
      if (e.conditions.item !== undefined) {
        counts.set(e.conditions.item, (counts.get(e.conditions.item) ?? 0) + 1);
      }
    }
    return counts;
  }, [evolutions]);

  const setItems = (next: Item[]) => onDataset({ ...dataset, items: next });

  const patch = (id: number, changes: Partial<Item>) =>
    setItems(items.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const nextId = useMemo(() => {
    const taken = new Set(items.map((i) => i.id));
    let candidate = 1;
    while (taken.has(candidate)) candidate++;
    return candidate;
  }, [items]);

  const remove = (item: Item) => {
    const used = usage.get(item.id) ?? 0;
    if (used) {
      window.alert(`진화 ${used}건이 이 아이템을 요구하고 있어 삭제할 수 없습니다.`);
      return;
    }
    if (window.confirm(`${item.id} ${item.names.ko}을(를) 삭제합니다.`)) {
      setItems(items.filter((i) => i.id !== item.id));
    }
  };

  return (
    <Section
      title={`아이템 — ${items.length}종`}
      action={
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() =>
            setItems([...items, { id: nextId, names: { en: '', ko: '', ja: '' } }])
          }
        >
          + {nextId}
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="w-12 pb-2 font-medium">ID</th>
              <th className="pb-2 font-medium">en</th>
              <th className="pb-2 font-medium">ko</th>
              <th className="pb-2 font-medium">ja</th>
              <th className="w-20 pb-2 text-center font-medium">사용</th>
              <th className="w-16 pb-2" />
            </tr>
          </thead>
          <tbody>
            {[...items]
              .sort((a, b) => a.id - b.id)
              .map((item) => (
                <tr key={item.id}>
                  <td className="py-1 pr-2 font-mono text-xs text-slate-500">
                    {item.id}
                  </td>
                  {(['en', 'ko', 'ja'] as const).map((locale) => (
                    <td key={locale} className="py-1 pr-2">
                      <input
                        className={inputClass}
                        value={item.names[locale]}
                        onChange={(event) =>
                          patch(item.id, {
                            names: { ...item.names, [locale]: event.target.value },
                          })
                        }
                      />
                    </td>
                  ))}
                  <td className="py-1 text-center text-xs text-slate-500">
                    {usage.get(item.id) ?? 0}
                  </td>
                  <td className="py-1 text-right">
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => remove(item)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
