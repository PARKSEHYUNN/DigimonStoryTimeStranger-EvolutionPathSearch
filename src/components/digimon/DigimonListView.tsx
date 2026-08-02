'use client';

import { useRouter } from '@/lib/i18n/navigation';
import { DigimonBrowser } from './DigimonBrowser';

/**
 * Selecting from the list navigates to that Digimon's own page rather than
 * opening a modal, so every entry is a real, linkable, indexable URL.
 */
export function DigimonListView() {
  const router = useRouter();

  return (
    <div className="flex h-[calc(100dvh-20rem)] min-h-[26rem] flex-col rounded-2xl bg-surface-raised p-3 shadow-sm sm:p-5">
      <DigimonBrowser
        onSelect={(digimon) => router.push(`/digimon/${digimon.slug}`)}
      />
    </div>
  );
}
