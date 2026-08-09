'use client';

import { useTranslations } from 'next-intl';
import { Ban, Star, X } from 'lucide-react';
import type { Digimon } from '@/lib/digimon/schema';
import { DigimonIcon } from './DigimonIcon';

type CardAction =
  /** Ban adds to the exclusion list, remove takes it off — both momentary. */
  | { kind: 'ban' | 'remove'; onAction: () => void; label: string }
  /** Favorite reflects current state instead of just performing an action. */
  | { kind: 'favorite'; active: boolean; onAction: () => void; label: string };

interface DigimonCardProps {
  digimon: Digimon;
  name: string;
  onClick?: () => void;
  silhouette?: boolean;
  action?: CardAction;
  size?: number;
}

export function DigimonCard({
  digimon,
  name,
  onClick,
  silhouette,
  action,
  size = 72,
}: DigimonCardProps) {
  const t = useTranslations();
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <div className="group relative flex flex-col items-center">
      <Wrapper
        {...(onClick ? { type: 'button' as const, onClick } : {})}
        className={`flex w-full flex-col items-center gap-1 rounded-xl p-1.5 text-center transition-colors ${
          onClick ? 'cursor-pointer hover:bg-surface-sunken' : ''
        }`}
      >
        <DigimonIcon
          id={digimon.id}
          name={name}
          size={size}
          silhouette={silhouette}
        />
        {/* Fixed-height block, not the individual lines: a short name should
            still sit directly above its info line, with any slack pushed to
            the bottom of the card rather than wedged between the two. Every
            card needs the same total height regardless, or Virtuoso's grid
            keeps revising its estimate of the list's length as it scrolls. */}
        <div className="flex min-h-[2.625rem] w-full flex-col items-center gap-0.5">
          <span className="line-clamp-2 text-xs leading-tight font-medium text-content">
            {name}
          </span>
          <span className="w-full truncate text-[0.65rem] leading-tight text-content-muted">
            {t(`generation.${digimon.generation}`)} ·{' '}
            {t(`attribute.${digimon.attribute}`)}
          </span>
        </div>
      </Wrapper>

      {action && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            action.onAction();
          }}
          aria-label={action.label}
          title={action.label}
          aria-pressed={action.kind === 'favorite' ? action.active : undefined}
          className={`absolute top-0 right-0 cursor-pointer rounded-full p-1 shadow-sm transition-opacity ${
            action.kind === 'ban'
              ? 'bg-surface-raised text-devolution opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
              : action.kind === 'favorite'
                ? action.active
                  ? 'bg-surface-raised text-accent opacity-100'
                  : 'bg-surface-raised text-content-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                : 'bg-devolution text-white'
          }`}
        >
          {action.kind === 'ban' ? (
            <Ban size={13} />
          ) : action.kind === 'favorite' ? (
            <Star size={13} className={action.active ? 'fill-current' : ''} />
          ) : (
            <X size={13} />
          )}
        </button>
      )}
    </div>
  );
}
