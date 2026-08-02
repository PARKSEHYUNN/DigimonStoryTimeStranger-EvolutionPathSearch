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
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 text-content transition-opacity hover:opacity-80"
        >
          <GitBranch size={20} className="text-accent" />
          <span className="text-base font-semibold">{t('brand')}</span>
        </Link>

        <NavLinks
          labels={{
            search: t('evolution_path'),
            list: t('digimon_list'),
          }}
        />

        <div className="flex items-center gap-0.5">
          <LocaleSwitcher label={t('change_language')} />
          <ThemeToggle label={t('toggle_theme')} />
        </div>
      </nav>
    </header>
  );
}
