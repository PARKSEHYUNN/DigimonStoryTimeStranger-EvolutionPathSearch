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
    <ul className="flex items-center gap-1">
      {LINKS.map(({ href, key }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              className={`block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
