import { getMessages } from 'next-intl/server';

/**
 * Namespaces each client subtree actually reads.
 *
 * `NextIntlClientProvider` serializes whatever it is given into every page's
 * flight data. Handing it the whole bundle put all 18 namespaces — including
 * ones only server components use — into all 1,433 prerendered pages.
 */
export const CLIENT_NAMESPACES = {
  /** Navbar, locale switcher, theme toggle: present on every page. */
  chrome: ['nav'],
  /** The route search screen and everything it opens. */
  search: [
    'evolution_path',
    'digimon_search',
    'digimon_select_modal',
    'generation',
    'attribute',
    'personality',
    'stats',
    'agent',
    'conditions',
  ],
  /** The list page's browser grid. */
  browser: [
    'digimon_search',
    'generation',
    'attribute',
    'personality',
  ],
} as const;

type Messages = Awaited<ReturnType<typeof getMessages>>;

export function pickMessages(
  messages: Messages,
  namespaces: readonly string[],
): Messages {
  const picked: Record<string, unknown> = {};
  for (const ns of namespaces) {
    if (ns in messages) picked[ns] = (messages as Record<string, unknown>)[ns];
  }
  return picked as Messages;
}

/** Convenience for pages: fetch and narrow in one step. */
export async function clientMessages(
  namespaces: readonly string[],
): Promise<Messages> {
  return pickMessages(await getMessages(), namespaces);
}
