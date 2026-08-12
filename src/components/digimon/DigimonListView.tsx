'use client';

import { useEffect } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { DigimonBrowser } from './DigimonBrowser';

/**
 * Selecting from the list navigates to that Digimon's own page rather than
 * opening a modal, so every entry is a real, linkable, indexable URL.
 */
export function DigimonListView() {
  const router = useRouter();

  // The server-rendered DigimonPreviewGrid exists for crawlers and the
  // pre-hydration paint; once the real, interactive grid below has mounted,
  // showing both would just be duplicate Digimon.
  useEffect(() => {
    document.getElementById('digimon-preview-grid')?.remove();
  }, []);

  return (
    <div className="flex h-[calc(100dvh-20rem)] min-h-[26rem] flex-col rounded-2xl bg-surface-raised p-3 shadow-sm sm:p-5">
      <DigimonBrowser
        onSelect={(digimon) => router.push(`/digimon/${digimon.slug}`)}
      />
    </div>
  );
}
