import { getTranslations } from 'next-intl/server';
import { GitBranch } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { ThemeToggle } from './ThemeToggle';
import { LocaleSwitcher } from './LocaleSwitcher';
import { NavLinks } from './NavLinks';

export async function Navbar() {
  const t = await getTranslations('nav');

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/85 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-3 sm:gap-2 sm:px-4">
        <Link
          href="/"
          // Negative margin keeps the visual position while the padding gives
          // the icon-only mobile state a 24px+ tap target.
          className="-m-1.5 flex shrink-0 items-center gap-2 p-1.5 text-content transition-opacity hover:opacity-80"
        >
          <GitBranch size={20} className="shrink-0 text-accent" />
          {/* The wordmark is the first thing to go: on a 320px screen the two
              nav links matter more than repeating the site name. */}
          <span className="hidden text-base font-semibold sm:inline">
            {t('brand')}
          </span>
        </Link>

        <div className="mx-auto min-w-0">
          <NavLinks
            labels={{ search: t('evolution_path'), list: t('digimon_list') }}
          />
        </div>

        <div className="flex shrink-0 items-center">
          <LocaleSwitcher label={t('change_language')} />
          <ThemeToggle label={t('toggle_theme')} />
        </div>
      </nav>
    </header>
  );
}
