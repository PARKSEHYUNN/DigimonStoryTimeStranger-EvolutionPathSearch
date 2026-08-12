import { getTranslations } from 'next-intl/server';
import { digimons } from '@/lib/digimon/data';
import { digimonName } from '@/lib/digimon/display';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { DigimonIcon } from './DigimonIcon';

/** Rows enough to cover a first screen at every breakpoint (3/4/6 columns). */
const PREVIEW_COUNT = 30;

/**
 * Server-rendered first screen of the Digimon list.
 *
 * DigimonBrowser's VirtuosoGrid needs a browser to measure anything, so
 * without this the exported HTML for /digimon has no list in it at all — just
 * the search box and a count, same problem EvolutionLinkList exists to avoid
 * on the detail pages. This gives a crawler, or anyone without JS, the first
 * Digimon as real, followable links. DigimonListView removes it the moment
 * the interactive grid mounts, so a JS-enabled visitor never sees both.
 */
export async function DigimonPreviewGrid({ locale }: { locale: Locale }) {
  const t = await getTranslations();
  const preview = digimons.slice(0, PREVIEW_COUNT);

  return (
    <div
      id="digimon-preview-grid"
      className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6"
    >
      {preview.map((digimon) => {
        const name = digimonName(digimon, locale);
        return (
          <Link
            key={digimon.id}
            href={`/digimon/${digimon.slug}`}
            className="flex w-full flex-col items-center gap-1 rounded-xl p-1.5 text-center transition-colors hover:bg-surface-sunken"
          >
            <DigimonIcon id={digimon.id} name={name} size={64} />
            <div className="flex min-h-[2.625rem] w-full flex-col items-center gap-0.5">
              <span className="line-clamp-2 text-xs leading-tight font-medium text-content">
                {name}
              </span>
              <span className="w-full truncate text-[0.65rem] leading-tight text-content-muted">
                {t(`generation.${digimon.generation}`)} ·{' '}
                {t(`attribute.${digimon.attribute}`)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
