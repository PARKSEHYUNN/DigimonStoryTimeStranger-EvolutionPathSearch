import type { ComponentProps } from 'react';
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

const {
  Link: IntlLink,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);

export { redirect, usePathname, useRouter, getPathname };

/**
 * Locale-aware Link with prefetching off.
 *
 * Next 16 writes RSC segment payloads to a nested path
 * (`__next.$d$locale/__PAGE__.txt`) but requests them dot-joined and flat
 * (`__next.$d$locale.__PAGE__.txt`), so under `output: 'export'` every prefetch
 * 404s — browsing three pages fired about 25 failed requests. Navigation
 * itself fetches on click and is unaffected.
 *
 * Revisit on the next Next.js upgrade: if the paths line up, drop the default
 * and let prefetching work again.
 */
export function Link(props: ComponentProps<typeof IntlLink>) {
  return <IntlLink prefetch={false} {...props} />;
}
