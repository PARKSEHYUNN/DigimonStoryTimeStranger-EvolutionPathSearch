import { getTranslations } from 'next-intl/server';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { digimonById } from '@/lib/digimon/data';
import { digimonName } from '@/lib/digimon/display';
import type { RaisingRoute } from '@/lib/digimon/detail-routes';
import { Link } from '@/lib/i18n/navigation';
import type { Locale } from '@/lib/i18n/routing';
import { evolutionRequirements, jogressPartners } from './requirements';

/**
 * The shortest ways to raise this Digimon, rendered on the server.
 *
 * Server-rendered on purpose. This is the content the page is being added for
 * — arriving through the client bundle would leave it out of the HTML a
 * crawler reads, which is the whole reason it lives here rather than staying
 * in the search screen.
 *
 * The first route is broken down hop by hop with its requirements; the rest
 * are chains only. Three routes at full detail is the same information three
 * times, and length is not substance.
 *
 * Everything is resolved before rendering rather than awaited inside JSX:
 * translations are async here, and `map(async ...)` would hand React an array
 * of promises for no gain in clarity.
 */

interface Hop {
  /** The Digimon this hop arrives at. */
  name: string;
  /** Requirements to perform it, or null when the hop is a de-evolution. */
  requirements: string[] | null;
}

interface PreparedRoute {
  key: string;
  heading: string;
  searchHref: string;
  chain: { slug: string; name: string; reversed: boolean | null }[];
  hops: Hop[];
}

export async function RaisingRoutes({
  routes,
  target,
  locale,
}: {
  routes: RaisingRoute[];
  target: string;
  locale: Locale;
}) {
  const t = await getTranslations({ locale });
  const info = await getTranslations({ locale, namespace: 'digimon_info' });

  if (routes.length === 0) {
    return <p className="text-content-muted text-sm">{info('raising_none')}</p>;
  }

  const prepared: PreparedRoute[] = routes.map((entry) => {
    const nodes = entry.route.nodes
      .map((id) => digimonById.get(id))
      .filter((d): d is NonNullable<typeof d> => d !== undefined);
    const last = nodes.at(-1);

    return {
      key: entry.route.nodes.join('-'),
      heading: info('raising_from', {
        name: digimonName(entry.from, locale),
        hops: entry.hops,
      }),
      searchHref: last ? `/?from=${entry.from.slug}&to=${last.slug}` : '/',
      chain: nodes.map((digimon, index) => ({
        slug: digimon.slug,
        name: digimonName(digimon, locale),
        reversed: entry.route.steps[index]?.reversed ?? null,
      })),
      hops: entry.route.steps.flatMap((step, index) => {
        const to = digimonById.get(entry.route.nodes[index + 1]!);
        if (!step || !to) return [];
        return [
          {
            name: digimonName(to, locale),
            requirements: step.reversed
              ? null
              : [
                  ...evolutionRequirements(step.evolution, locale, t),
                  ...jogressPartners(step.evolution, locale, t),
                ],
          },
        ];
      }),
    };
  });

  const [first, ...rest] = prepared;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-content-muted text-xs leading-relaxed">
        {info('raising_intro', { name: target })}
      </p>

      {first && (
        <div className="flex flex-col gap-2">
          <Heading route={first} label={info('raising_open')} />
          <Chain chain={first.chain} />

          {/* Only the shortest route is broken down. The requirements are the
              substance worth reading, but repeating them for every route pads
              the page rather than deepening it. */}
          <ol className="border-border-subtle flex flex-col gap-1 border-l-2 pl-3">
            {first.hops.map((hop, index) => (
              <li key={index} className="text-content-muted text-xs">
                <span className="text-content font-medium">{hop.name}</span>
                {' — '}
                {hop.requirements
                  ? hop.requirements.join(', ')
                  : info('step_devolution')}
              </li>
            ))}
          </ol>
        </div>
      )}

      {rest.map((route) => (
        <div key={route.key} className="flex flex-col gap-1.5">
          <Heading route={route} label={info('raising_open')} />
          <Chain chain={route.chain} />
        </div>
      ))}
    </div>
  );
}

function Heading({ route, label }: { route: PreparedRoute; label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <h3 className="text-content-muted text-xs font-semibold">
        {route.heading}
      </h3>
      {/* Straight into the live search with this pair loaded. The query string
          the search reads is what makes a route linkable at all. */}
      <Link
        href={route.searchHref}
        className="text-accent inline-flex items-center gap-1 px-1 py-1.5 text-xs hover:underline"
      >
        <Search size={12} aria-hidden />
        {label}
      </Link>
    </div>
  );
}

function Chain({ chain }: { chain: PreparedRoute['chain'] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-0.5 gap-y-0.5 text-sm">
      {chain.map((node, index) => (
        <li key={`${node.slug}-${index}`} className="flex items-center gap-1.5">
          {/* Padding, not just text: a bare inline link measured 24x20 here,
              under the 24x24 minimum WCAG 2.2 asks for. The list gap shrinks
              to match so the chain reads at the same density. */}
          <Link
            href={`/digimon/${node.slug}`}
            className="text-content hover:bg-surface-sunken hover:text-accent rounded px-1.5 py-1 font-medium"
          >
            {node.name}
          </Link>
          {node.reversed === true && (
            <ArrowLeft size={13} aria-hidden className="text-devolution" />
          )}
          {node.reversed === false && (
            <ArrowRight size={13} aria-hidden className="text-evolution" />
          )}
        </li>
      ))}
    </ol>
  );
}
