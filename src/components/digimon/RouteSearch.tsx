'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { findRoutes, DEFAULT_FILTERS } from '@/lib/pathfinder';
import { digimonName } from '@/lib/digimon/display';
import type { Digimon } from '@/lib/digimon/schema';
import type { Locale } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { DigimonCard } from './DigimonCard';
import { DigimonPicker } from './DigimonPicker';
import { RouteView } from './RouteView';

const AGENT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MAX_ROUTES = 3;

export function RouteSearch() {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const [start, setStart] = useState<Digimon | null>(null);
  const [end, setEnd] = useState<Digimon | null>(null);
  const [agentLevel, setAgentLevel] = useState(10);
  const [includeJogress, setIncludeJogress] = useState(true);
  const [includeDlc, setIncludeDlc] = useState(true);
  const [silhouette, setSilhouette] = useState(false);
  const [excluded, setExcluded] = useState<Digimon[]>([]);

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
    setExcluded((prev) =>
      prev.some((d) => d.id === digimon.id) ? prev : [...prev, digimon],
    );
  };

  // With DLC switched off, offering DLC Digimon in the picker would only lead
  // to an unanswerable query.
  const hideDlc = useMemo(
    () => (includeDlc ? undefined : (d: Digimon) => d.dlc),
    [includeDlc],
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-surface-raised p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4">
          <div className="w-32">
            <Select
              label={t('evolution_path.agent_level')}
              value={agentLevel}
              onChange={(v) => setAgentLevel(Number(v))}
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
              onChange={setIncludeJogress}
              label={t('evolution_path.in_jogress')}
            />
            <Toggle
              checked={includeDlc}
              onChange={setIncludeDlc}
              label={t('evolution_path.in_dlc')}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <DigimonPicker
            label={t('evolution_path.now_digimon')}
            selected={start}
            selectedName={start ? name(start) : null}
            onSelect={setStart}
            exclude={hideDlc}
          />
          <ArrowRight size={20} className="mt-4 shrink-0 text-content-muted" />
          <DigimonPicker
            label={t('evolution_path.evolution_from_digimon')}
            selected={end}
            selectedName={end ? name(end) : null}
            onSelect={setEnd}
            exclude={hideDlc}
          />
        </div>
      </section>

      <section
        aria-live="polite"
        className="rounded-2xl bg-surface-raised p-5 shadow-sm"
      >
        {!start || !end ? (
          <p className="py-8 text-center text-sm text-content-muted">
            {t('evolution_path.choice_digimon_message')}
          </p>
        ) : routes.length === 0 ? (
          <p className="py-8 text-center text-sm text-content-muted">
            {t('evolution_path.evolution_path_error')}
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-content">
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
                  className="rounded-xl bg-surface-sunken p-4"
                >
                  <h3 className="mb-3 text-xs font-semibold text-content-muted">
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

      <section className="rounded-2xl bg-surface-raised p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-content">
            {t('evolution_path.exception_digimon_list')}
          </h2>
          {excluded.length > 0 && (
            <Button variant="ghost" onClick={() => setExcluded([])}>
              <RotateCcw size={14} />
              {t('evolution_path.exception_digimon_list_reset')}
            </Button>
          )}
        </div>

        {excluded.length === 0 ? (
          <p className="text-xs text-content-muted">
            {t('evolution_path.exception_digimon_list_message')}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1">
            {excluded.map((digimon) => (
              <li key={digimon.id} className="w-24">
                <DigimonCard
                  digimon={digimon}
                  name={name(digimon)}
                  size={56}
                  action={{
                    kind: 'remove',
                    onAction: () =>
                      setExcluded((prev) =>
                        prev.filter((d) => d.id !== digimon.id),
                      ),
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
