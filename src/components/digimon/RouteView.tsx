'use client';

import { Fragment } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Ban } from 'lucide-react';
import { digimonById } from '@/lib/digimon/data';
import { digimonName } from '@/lib/digimon/display';
import type { Route } from '@/lib/pathfinder';
import type { Digimon, Evolution } from '@/lib/digimon/schema';
import type { Locale } from '@/lib/i18n/routing';
import { DigimonIcon } from './DigimonIcon';
import { EvolutionConditions } from './EvolutionConditions';

interface RouteViewProps {
  route: Route;
  silhouette: boolean;
  onExclude: (digimon: Digimon) => void;
}

/**
 * A route reads left-to-right on a wide screen, but at phone width the cards
 * wrap and the arrows end up dangling at the end of a line. Below `md` the
 * whole thing becomes a vertical timeline instead, which is legible at any
 * hop count.
 */
export function RouteView({ route, silhouette, onExclude }: RouteViewProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  return (
    <ol className="flex flex-col items-stretch md:flex-row md:flex-wrap md:items-start md:justify-center">
      {route.nodes.map((id, index) => {
        const digimon = digimonById.get(id);
        if (!digimon) return null;

        const step = route.steps[index];
        const name = digimonName(digimon, locale);
        const isEndpoint = index === 0 || index === route.nodes.length - 1;

        return (
          <Fragment key={`${id}-${index}`}>
            <li className="w-full md:w-24">
              <RouteNode
                digimon={digimon}
                name={name}
                silhouette={silhouette}
                // Endpoints are the user's own picks; banning one would make
                // the query unanswerable.
                onExclude={isEndpoint ? undefined : () => onExclude(digimon)}
                excludeLabel={t('evolution_path.exclude_digimon', { name })}
              />
            </li>

            {step && (
              <li className="w-full md:w-28 md:pt-5">
                <RouteStep
                  evolution={step.evolution}
                  reversed={step.reversed}
                />
              </li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}

function RouteNode({
  digimon,
  name,
  silhouette,
  onExclude,
  excludeLabel,
}: {
  digimon: Digimon;
  name: string;
  silhouette: boolean;
  onExclude?: () => void;
  excludeLabel: string;
}) {
  const t = useTranslations();

  return (
    <div className="group relative flex items-center gap-3 rounded-xl p-1.5 md:flex-col md:gap-1 md:text-center">
      <DigimonIcon
        id={digimon.id}
        name={name}
        size={56}
        silhouette={silhouette}
      />

      <div className="min-w-0 flex-1 md:flex-none">
        <p className="truncate text-sm font-medium text-content md:text-xs md:leading-tight md:whitespace-normal">
          {name}
        </p>
        <p className="text-xs text-content-muted md:text-[0.65rem] md:leading-tight">
          {t(`generation.${digimon.generation}`)} ·{' '}
          {t(`attribute.${digimon.attribute}`)}
        </p>
      </div>

      {onExclude && (
        <button
          type="button"
          onClick={onExclude}
          aria-label={excludeLabel}
          title={excludeLabel}
          // Always reachable on touch, where there is no hover to reveal it.
          className="shrink-0 cursor-pointer rounded-full p-1.5 text-devolution transition-opacity hover:bg-surface-raised md:absolute md:top-0 md:right-0 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        >
          <Ban size={14} />
        </button>
      )}
    </div>
  );
}

function RouteStep({
  evolution,
  reversed,
}: {
  evolution: Evolution;
  reversed: boolean;
}) {
  const t = useTranslations();

  const tone = evolution.conditions.jogress
    ? 'text-jogress'
    : reversed
      ? 'text-devolution'
      : 'text-evolution';

  const label = evolution.conditions.jogress
    ? t('evolution_path.jogress')
    : reversed
      ? t('evolution_path.devolution')
      : t('evolution_path.evolution');

  return (
    <div className="flex items-start gap-2 border-l-2 border-border-subtle py-1 pl-[1.65rem] md:flex-col md:items-center md:gap-1 md:border-l-0 md:py-0 md:pl-0">
      <div className="flex shrink-0 items-center gap-1">
        <ArrowRight
          size={15}
          aria-hidden
          className={`rotate-90 md:rotate-0 ${tone}`}
        />
        <span className={`text-[0.7rem] font-semibold md:text-[0.65rem] ${tone}`}>
          {label}
        </span>
      </div>
      <EvolutionConditions
        conditions={evolution.conditions}
        reversed={reversed}
      />
    </div>
  );
}
