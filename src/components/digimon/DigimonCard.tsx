'use client';

import { useTranslations } from 'next-intl';
import { Ban, X } from 'lucide-react';
import type { Digimon } from '@/lib/digimon/schema';
import { DigimonIcon } from './DigimonIcon';

interface DigimonCardProps {
  digimon: Digimon;
  name: string;
  onClick?: () => void;
  silhouette?: boolean;
  /** Corner affordance: ban adds to the exclusion list, remove takes it off. */
  action?: { kind: 'ban' | 'remove'; onAction: () => void; label: string };
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
        <span className="line-clamp-2 text-xs leading-tight font-medium text-content">
          {name}
        </span>
        <span className="text-[0.65rem] leading-tight text-content-muted">
          {t(`generation.${digimon.generation}`)} ·{' '}
          {t(`attribute.${digimon.attribute}`)}
        </span>
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
          className={`absolute top-0 right-0 cursor-pointer rounded-full p-1 shadow-sm transition-opacity ${
            action.kind === 'ban'
              ? 'bg-surface-raised text-devolution opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
              : 'bg-devolution text-white'
          }`}
        >
          {action.kind === 'ban' ? <Ban size={13} /> : <X size={13} />}
        </button>
      )}
    </div>
  );
}
