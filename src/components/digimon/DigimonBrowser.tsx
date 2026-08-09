'use client';

import { useDeferredValue, useMemo, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { VirtuosoGrid } from 'react-virtuoso';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { digimonById, digimons } from '@/lib/digimon/data';
import { digimonName } from '@/lib/digimon/display';
import type { Digimon } from '@/lib/digimon/schema';
import type { Locale } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { DigimonCard } from './DigimonCard';

const GENERATIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const ATTRIBUTES = [0, 1, 2, 3, 4, 5, 6];
const PERSONALITIES = Array.from({ length: 16 }, (_, i) => i);

/**
 * Favorited Digimon ids, read from localStorage the same way the silhouette
 * toggle is: as an external store, cached rather than rebuilt on every read.
 * useSyncExternalStore compares snapshots with Object.is, and a Set rebuilt
 * from scratch each call would never be equal to its predecessor — every
 * render would look like a change and React would warn (or loop).
 */
const favoritesListeners = new Set<() => void>();
const EMPTY_FAVORITES: ReadonlySet<number> = new Set();
let favoritesCache: ReadonlySet<number> | null = null;

const subscribeFavorites = (onChange: () => void) => {
  favoritesListeners.add(onChange);
  return () => favoritesListeners.delete(onChange);
};

function readFavorites(): ReadonlySet<number> {
  if (favoritesCache) return favoritesCache;
  try {
    const raw = localStorage.getItem('favorites');
    favoritesCache = new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    favoritesCache = EMPTY_FAVORITES;
  }
  return favoritesCache;
}

const readServerFavorites = () => EMPTY_FAVORITES;

function toggleFavorite(id: number) {
  const next = new Set(readFavorites());
  if (next.has(id)) next.delete(id);
  else next.add(id);
  favoritesCache = next;
  try {
    localStorage.setItem('favorites', JSON.stringify([...next]));
  } catch {
    // Storage unavailable or full — the toggle still holds for this session.
  }
  for (const listener of favoritesListeners) listener();
}

type FilterKey = 'generation' | 'attribute' | 'personality';

interface DigimonBrowserProps {
  onSelect: (digimon: Digimon) => void;
  /** Hidden entirely — used to keep DLC out when the user has it switched off. */
  exclude?: (digimon: Digimon) => boolean;
  /**
   * Only for the picker dialog: focus search on open so the user can type
   * straight away. Off on the list page, where it would yank the scroll.
   */
  autoFocusSearch?: boolean;
}

export function DigimonBrowser({
  onSelect,
  exclude,
  autoFocusSearch,
}: DigimonBrowserProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const favorites = useSyncExternalStore(
    subscribeFavorites,
    readFavorites,
    readServerFavorites,
  );

  // Always on top regardless of the search box or filters below — a
  // favorite is "what I reach for often", not "what currently matches".
  // Still respects `exclude`: a DLC favorite has no business appearing
  // while DLC is switched off, since picking it would go nowhere.
  const favoriteDigimons = useMemo(
    () =>
      [...favorites]
        .map((id) => digimonById.get(id))
        .filter((d): d is Digimon => d !== undefined && !exclude?.(d)),
    [favorites, exclude],
  );

  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<FilterKey, number[]>>({
    generation: [],
    attribute: [],
    personality: [],
  });

  // Typing stays responsive while the 475-item list re-filters behind it.
  const deferredQuery = useDeferredValue(query);

  const toggleFilter = (key: FilterKey, value: number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const activeFilterCount = Object.values(filters).flat().length;

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();

    return digimons.filter((d) => {
      if (exclude?.(d)) return false;
      if (filters.generation.length && !filters.generation.includes(d.generation))
        return false;
      if (filters.attribute.length && !filters.attribute.includes(d.attribute))
        return false;
      if (
        filters.personality.length &&
        !filters.personality.includes(d.personality)
      )
        return false;

      if (!needle) return true;
      // Match on any language so a Korean player can paste an English name.
      return (
        d.names.en.toLowerCase().includes(needle) ||
        d.names.ko.toLowerCase().includes(needle) ||
        d.names.ja.toLowerCase().includes(needle)
      );
    });
  }, [deferredQuery, filters, exclude]);

  const reset = () => {
    setQuery('');
    setFilters({ generation: [], attribute: [], personality: [] });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-content-muted"
          />
          <input
            autoFocus={autoFocusSearch}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('digimon_search.input_placeholder')}
            aria-label={t('digimon_search.input_placeholder')}
            className="w-full rounded-lg border border-border-subtle bg-surface-raised py-2 pr-3 pl-9 text-sm text-content placeholder:text-content-muted focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none"
          />
        </div>
        <Button
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className={activeFilterCount ? 'border-accent text-accent' : ''}
        >
          <SlidersHorizontal size={15} />
          {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
        </Button>
        {(query || activeFilterCount > 0) && (
          <Button onClick={reset} aria-label={t('digimon_search.reset')}>
            <X size={15} />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="max-h-52 shrink-0 space-y-3 overflow-y-auto rounded-lg bg-surface-sunken p-3">
          <FilterGroup
            title={t('digimon_search.generation')}
            options={GENERATIONS}
            selected={filters.generation}
            onToggle={(v) => toggleFilter('generation', v)}
            renderLabel={(v) => t(`generation.${v}`)}
          />
          <FilterGroup
            title={t('digimon_search.attribute')}
            options={ATTRIBUTES}
            selected={filters.attribute}
            onToggle={(v) => toggleFilter('attribute', v)}
            renderLabel={(v) => t(`attribute.${v}`)}
          />
          <FilterGroup
            title={t('digimon_search.personality')}
            options={PERSONALITIES}
            selected={filters.personality}
            onToggle={(v) => toggleFilter('personality', v)}
            renderLabel={(v) => t(`personality.${v}`)}
          />
        </div>
      )}

      {favoriteDigimons.length > 0 && (
        <div className="shrink-0">
          <p className="mb-1 text-xs font-semibold text-content-muted">
            {t('digimon_search.favorites')}
          </p>
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6">
            {favoriteDigimons.map((digimon) => (
              <DigimonCard
                key={`fav-${digimon.id}`}
                digimon={digimon}
                name={digimonName(digimon, locale)}
                onClick={() => onSelect(digimon)}
                action={{
                  kind: 'favorite',
                  active: true,
                  onAction: () => toggleFavorite(digimon.id),
                  label: t('digimon_search.remove_favorite', {
                    name: digimonName(digimon, locale),
                  }),
                }}
                size={64}
              />
            ))}
          </div>
        </div>
      )}

      <p className="shrink-0 text-xs text-content-muted" aria-live="polite">
        {t('digimon_search.result_count', { count: results.length })}
      </p>

      <div className="min-h-0 flex-1">
        {results.length === 0 ? (
          <p className="py-8 text-center text-sm text-content-muted">
            {t('digimon_search.no_results')}
          </p>
        ) : (
          <VirtuosoGrid
            data={results}
            className="h-full"
            listClassName="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6"
            itemContent={(_, digimon) => {
              const isFavorite = favorites.has(digimon.id);
              return (
                <DigimonCard
                  digimon={digimon}
                  name={digimonName(digimon, locale)}
                  onClick={() => onSelect(digimon)}
                  action={{
                    kind: 'favorite',
                    active: isFavorite,
                    onAction: () => toggleFavorite(digimon.id),
                    label: t(
                      isFavorite
                        ? 'digimon_search.remove_favorite'
                        : 'digimon_search.add_favorite',
                      { name: digimonName(digimon, locale) },
                    ),
                  }}
                  size={64}
                />
              );
            }}
          />
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
  renderLabel,
}: {
  title: string;
  options: number[];
  selected: number[];
  onToggle: (value: number) => void;
  renderLabel: (value: number) => string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-content-muted">
        {title}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-accent text-accent-content'
                  : 'bg-surface-raised text-content-muted hover:text-content'
              }`}
            >
              {renderLabel(option)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
