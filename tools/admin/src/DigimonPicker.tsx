import { useEffect, useMemo, useRef, useState } from 'react';
import type { Digimon } from '@/lib/digimon/schema';
import { Icon, inputClass } from './ui';

/** Matches on id or on any of the three names, so either works while typing. */
export function searchDigimons(
  digimons: readonly Digimon[],
  query: string,
  limit = 12,
  exclude?: ReadonlySet<number>,
): Digimon[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: Digimon[] = [];
  for (const d of digimons) {
    if (exclude?.has(d.id)) continue;
    if (
      String(d.id) === q ||
      d.slug.includes(q) ||
      d.names.en.toLowerCase().includes(q) ||
      d.names.ko.toLowerCase().includes(q) ||
      d.names.ja.toLowerCase().includes(q)
    ) {
      hits.push(d);
      if (hits.length >= limit) break;
    }
  }
  return hits;
}

/**
 * Type-to-search selector for a single Digimon.
 *
 * Used for evolution targets and Jogress partners alike — every reference in
 * the data is an id, and this is the only way one gets typed in, so ids that
 * do not exist cannot be entered by hand.
 */
export function DigimonPicker({
  digimons,
  onPick,
  exclude,
  placeholder = '이름 또는 ID로 검색',
  autoFocus = false,
}: {
  digimons: readonly Digimon[];
  onPick: (digimon: Digimon) => void;
  exclude?: ReadonlySet<number>;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => searchDigimons(digimons, query, 12, exclude),
    [digimons, query, exclude],
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const choose = (digimon: Digimon) => {
    onPick(digimon);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapper} className="relative">
      <input
        type="text"
        className={inputClass}
        placeholder={placeholder}
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          // Enter picks the single obvious match rather than doing nothing.
          if (event.key === 'Enter' && results.length) {
            event.preventDefault();
            choose(results[0]!);
          }
        }}
      />

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-700 bg-slate-900 shadow-xl">
          {results.map((digimon) => (
            <li key={digimon.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-slate-800"
                onClick={() => choose(digimon)}
              >
                <span className="w-9 shrink-0 text-right font-mono text-xs text-slate-500">
                  {digimon.id}
                </span>
                <Icon id={digimon.id} size={20} />
                <span className="truncate text-slate-100">{digimon.names.ko}</span>
                <span className="ml-auto truncate pl-2 text-xs text-slate-500">
                  {digimon.names.en}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
