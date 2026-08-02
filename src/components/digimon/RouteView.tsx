'use client';

import { Fragment } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { digimonById } from '@/lib/digimon/data';
import { digimonName } from '@/lib/digimon/display';
import type { Route } from '@/lib/pathfinder';
import type { Digimon } from '@/lib/digimon/schema';
import type { Locale } from '@/lib/i18n/routing';
import { DigimonCard } from './DigimonCard';
import { EvolutionConditions } from './EvolutionConditions';

interface RouteViewProps {
  route: Route;
  silhouette: boolean;
  onExclude: (digimon: Digimon) => void;
  onInspect?: (digimon: Digimon) => void;
}

export function RouteView({
  route,
  silhouette,
  onExclude,
  onInspect,
}: RouteViewProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  return (
    <ol className="flex flex-wrap items-start justify-center gap-y-2">
      {route.nodes.map((id, index) => {
        const digimon = digimonById.get(id);
        if (!digimon) return null;

        const step = route.steps[index];
        const name = digimonName(digimon, locale);
        const isEndpoint = index === 0 || index === route.nodes.length - 1;

        return (
          <Fragment key={`${id}-${index}`}>
            <li className="w-24">
              <DigimonCard
                digimon={digimon}
                name={name}
                silhouette={silhouette}
                onClick={onInspect ? () => onInspect(digimon) : undefined}
                size={64}
                // Endpoints are the user's own choices; banning them would
                // make the query unanswerable.
                action={
                  isEndpoint
                    ? undefined
                    : {
                        kind: 'ban',
                        onAction: () => onExclude(digimon),
                        label: t('evolution_path.exclude_digimon', { name }),
                      }
                }
              />
            </li>

            {step && (
              <li className="flex w-28 flex-col items-center gap-1 pt-5">
                <div className="flex items-center gap-1">
                  <ArrowRight
                    size={16}
                    aria-hidden
                    className={
                      step.evolution.conditions.jogress
                        ? 'text-jogress'
                        : step.reversed
                          ? 'text-devolution'
                          : 'text-evolution'
                    }
                  />
                  <span
                    className={`text-[0.65rem] font-semibold ${
                      step.evolution.conditions.jogress
                        ? 'text-jogress'
                        : step.reversed
                          ? 'text-devolution'
                          : 'text-evolution'
                    }`}
                  >
                    {step.evolution.conditions.jogress
                      ? t('evolution_path.jogress')
                      : step.reversed
                        ? t('evolution_path.devolution')
                        : t('evolution_path.evolution')}
                  </span>
                </div>
                <EvolutionConditions
                  conditions={step.evolution.conditions}
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
