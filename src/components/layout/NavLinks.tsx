'use client';

import { Link, usePathname } from '@/lib/i18n/navigation';

const LINKS = [
  { href: '/', key: 'search' },
  { href: '/digimon', key: 'list' },
] as const;

export function NavLinks({
  labels,
}: {
  labels: Record<'search' | 'list', string>;
}) {
  // Locale-stripped, so comparing against the unprefixed hrefs is enough.
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-0.5 sm:gap-1">
      {LINKS.map(({ href, key }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              className={`block rounded-lg px-2 py-1.5 text-[0.8rem] font-medium whitespace-nowrap transition-colors sm:px-3 sm:text-sm ${
                active
                  ? 'bg-surface-sunken text-content'
                  : 'text-content-muted hover:bg-surface-sunken hover:text-content'
              }`}
            >
              {labels[key]}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
