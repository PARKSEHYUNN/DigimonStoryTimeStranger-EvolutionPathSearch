'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { HelpCircle } from 'lucide-react';
import type { Digimon } from '@/lib/digimon/schema';
import { Dialog } from '@/components/ui/Dialog';
import { DigimonIcon } from './DigimonIcon';
import { DigimonBrowser } from './DigimonBrowser';

interface DigimonPickerProps {
  label: string;
  selected: Digimon | null;
  selectedName: string | null;
  onSelect: (digimon: Digimon) => void;
  exclude?: (digimon: Digimon) => boolean;
  /** Stable hook for the layout checks in scripts/check-responsive.mjs. */
  testId: 'start' | 'end';
}

export function DigimonPicker({
  label,
  selected,
  selectedName,
  onSelect,
  exclude,
  testId,
}: DigimonPickerProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-content-muted">{label}</span>

      <button
        type="button"
        data-picker={testId}
        onClick={() => setOpen(true)}
        className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl p-2 transition-colors hover:bg-surface-sunken"
      >
        {selected ? (
          <DigimonIcon
            id={selected.id}
            name={selectedName ?? ''}
            size={72}
            variant="full"
          />
        ) : (
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-xl border border-dashed border-border-subtle text-content-muted">
            <HelpCircle size={26} />
          </span>
        )}
        <span className="max-w-24 text-xs font-medium text-content">
          {selectedName ?? t('evolution_path.choice_digimon')}
        </span>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('digimon_select_modal.title')}
        tall
      >
        <DigimonBrowser
          autoFocusSearch
          exclude={exclude}
          onSelect={(digimon) => {
            onSelect(digimon);
            setOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}
