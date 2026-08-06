'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { findRoutes, DEFAULT_FILTERS } from '@/lib/pathfinder';
import { digimonName } from '@/lib/digimon/display';
import {
  AGENT_LEVELS,
  parseRouteParams,
  toSearchString,
  type RouteParams,
} from '@/lib/digimon/route-params';
import type { Digimon } from '@/lib/digimon/schema';
import type { Locale } from '@/lib/i18n/routing';
import { AdSlot } from '@/components/ads/AdSlot';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { DigimonCard } from './DigimonCard';
import { DigimonPicker } from './DigimonPicker';
import { RouteView } from './RouteView';

const MAX_ROUTES = 3;

/**
 * The query string, read as an external store rather than mirrored into state.
 *
 * Same reasoning as the announcement banner: the URL is something React cannot
 * see, so reading it through a store keeps the component to a single render
 * and gives the server a defined answer. It also makes the address bar the one
 * source of truth — there is no second copy of the search to drift out of sync
 * with what a reader would get by pasting the link.
 */
const listeners = new Set<() => void>();

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  // Back/forward across entries this page did not write still has to land.
  window.addEventListener('popstate', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('popstate', onChange);
  };
};

const readSearch = () => window.location.search;

/**
 * Nothing is selected in the prerendered HTML, because at build time there is
 * no query string. The first client render then adopts the real one.
 */
const readServerSearch = () => '';

function writeSearch(query: string) {
  // `replaceState`, not push: this fires on every toggle, and a history entry
  // per toggle would turn Back into an undo of settings nobody expects to
  // undo. It also skips Next's router, which has nothing to do here.
  window.history.replaceState(
    null,
    '',
    query ? `?${query}` : window.location.pathname,
  );
  // replaceState raises no event, so the store has to announce its own writes.
  for (const listener of listeners) listener();
}

export function RouteSearch() {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const search = useSyncExternalStore(subscribe, readSearch, readServerSearch);
  const params = useMemo(() => parseRouteParams(search), [search]);
  const { start, end, agentLevel, includeJogress, includeDlc, excluded } =
    params;

  /** Every change goes through the URL; there is nowhere else to put it. */
  const update = (patch: Partial<RouteParams>) =>
    writeSearch(toSearchString({ ...params, ...patch }));

  // Not in the URL: a viewing preference, like dark mode. A shared link should
  // not decide for whoever opens it whether the art is hidden.
  const [silhouette, setSilhouette] = useState(false);

  const name = (d: Digimon) => digimonName(d, locale);

  const routes = useMemo(() => {
    if (!start || !end) return [];
    return findRoutes(start.id, end.id, MAX_ROUTES, {
      ...DEFAULT_FILTERS,
      agentLevel,
      includeDlc,
      includeJogress,
      excludeIds: new Set(excluded.map((d) => d.id)),
    });
  }, [start, end, agentLevel, includeDlc, includeJogress, excluded]);

  const addExclusion = (digimon: Digimon) => {
    if (excluded.some((d) => d.id === digimon.id)) return;
    update({ excluded: [...excluded, digimon] });
  };

  const removeExclusion = (digimon: Digimon) =>
    update({ excluded: excluded.filter((d) => d.id !== digimon.id) });

  // With DLC switched off, offering DLC Digimon in the picker would only lead
  // to an unanswerable query.
  const hideDlc = useMemo(
    () => (includeDlc ? undefined : (d: Digimon) => d.dlc),
    [includeDlc],
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-surface-raised rounded-2xl p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4">
          <div className="w-28 sm:w-32">
            <Select
              label={t('evolution_path.agent_level')}
              value={agentLevel}
              onChange={(v) => update({ agentLevel: Number(v) })}
            >
              {AGENT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2.5">
            <Toggle
              checked={includeJogress}
              onChange={(v) => update({ includeJogress: v })}
              label={t('evolution_path.in_jogress')}
            />
            <Toggle
              checked={includeDlc}
              onChange={(v) => update({ includeDlc: v })}
              label={t('evolution_path.in_dlc')}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 sm:gap-4">
          <DigimonPicker
            testId="start"
            label={t('evolution_path.now_digimon')}
            selected={start}
            selectedName={start ? name(start) : null}
            onSelect={(d) => update({ start: d })}
            exclude={hideDlc}
          />
          <ArrowRight
            size={20}
            aria-hidden
            className="text-content-muted mt-4 shrink-0"
          />
          <DigimonPicker
            testId="end"
            label={t('evolution_path.evolution_from_digimon')}
            selected={end}
            selectedName={end ? name(end) : null}
            onSelect={(d) => update({ end: d })}
            exclude={hideDlc}
          />
        </div>
      </section>

      <section
        aria-live="polite"
        className="bg-surface-raised rounded-2xl p-4 shadow-sm sm:p-5"
      >
        {!start || !end ? (
          <p className="text-content-muted py-8 text-center text-sm">
            {t('evolution_path.choice_digimon_message')}
          </p>
        ) : routes.length === 0 ? (
          <p className="text-content-muted py-8 text-center text-sm">
            {t('evolution_path.evolution_path_error')}
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h2 className="text-content text-sm font-semibold">
                {t('evolution_path.results_heading', { count: routes.length })}
              </h2>
              <Toggle
                checked={silhouette}
                onChange={setSilhouette}
                label={t('evolution_path.silhouette_toggle')}
              />
            </div>

            <div className="flex flex-col gap-4">
              {routes.map((route, index) => (
                <article
                  key={route.nodes.join('-')}
                  className="bg-surface-sunken rounded-xl p-3 sm:p-4"
                >
                  <h3 className="text-content-muted mb-3 text-xs font-semibold">
                    {index === 0
                      ? t('evolution_path.shortest_route', {
                          hops: route.nodes.length - 1,
                        })
                      : t('evolution_path.alternate_route', {
                          index: index + 1,
                          hops: route.nodes.length - 1,
                        })}
                  </h3>
                  <RouteView
                    route={route}
                    silhouette={silhouette}
                    onExclude={addExclusion}
                  />
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <AdSlot placement="in-content" />

      <section className="bg-surface-raised rounded-2xl p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 className="text-content text-sm font-semibold">
            {t('evolution_path.exception_digimon_list')}
          </h2>
          {excluded.length > 0 && (
            <Button variant="ghost" onClick={() => update({ excluded: [] })}>
              <RotateCcw size={14} />
              {t('evolution_path.exception_digimon_list_reset')}
            </Button>
          )}
        </div>

        {excluded.length === 0 ? (
          <p className="text-content-muted text-xs">
            {t('evolution_path.exception_digimon_list_message')}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1">
            {excluded.map((digimon) => (
              <li key={digimon.id} className="w-20 sm:w-24">
                <DigimonCard
                  digimon={digimon}
                  name={name(digimon)}
                  size={56}
                  action={{
                    kind: 'remove',
                    onAction: () => removeExclusion(digimon),
                    label: t('evolution_path.remove_exclusion', {
                      name: name(digimon),
                    }),
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
