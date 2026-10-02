import { tiersOf, type Court, type CourtHierarchy } from '@/content/seed/court-hierarchies';
import { cn } from '@/components/ui';

/**
 * The scaffolding both court diagrams are drawn on: rows from the apex down,
 * a label beside each row saying what kind of court sits there, and the
 * appeal routes drawn as lines between the rows, each line running from a
 * court up to the court its appeals go to.
 *
 * The lines are the point. A column of boxes with a tick between each pair
 * says "these are stacked", which is wrong twice over in Australia (two
 * ladders) and once in Malaysia (two High Courts). A line from the Sessions
 * Court that bends across to the High Court in Malaya, and none to Sabah and
 * Sarawak, is the diagram saying the true thing without a footnote.
 *
 * Rows rather than a left-to-right tree, still: rows survive a 360px phone
 * and a tree does not. The label sits beside the row from tablet width up
 * and above it on a phone.
 *
 * `lit` is the set of courts on a traced route. A line is lit when both of
 * its ends are, so the route reads as one continuous line through the
 * picture rather than boxes lighting up on their own.
 */
export function CourtTiers({
  hierarchy,
  lit,
  renderCourt,
  label,
}: {
  hierarchy: CourtHierarchy;
  lit: ReadonlySet<string>;
  renderCourt: (court: Court) => React.ReactNode;
  /** What the group is for, read out by a screen reader. */
  label: string;
}) {
  const tiers = tiersOf(hierarchy);

  return (
    <div role="group" aria-label={label} className="court-tiers">
      {tiers.map((row, tierIndex) => {
        const tier = row[0]?.tier ?? tierIndex;
        const below = tiers[tierIndex + 1];
        return (
          <div key={tier} className="grid gap-x-4 sm:grid-cols-[7.5rem_1fr]">
            <p className="eyebrow mb-1.5 self-center text-slate sm:mb-0 sm:text-right">
              {hierarchy.tierLabels[tier] ?? ''}
            </p>
            <div className={cn('grid gap-2', row.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
              {row.map((court) => (
                <div key={court.slug}>{renderCourt(court)}</div>
              ))}
            </div>
            {below ? (
              <div className="sm:col-start-2">
                <Routes upper={row} lower={below} lit={lit} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

const GAP = 30;

/**
 * The appeal routes between one row and the next.
 *
 * Drawn in an SVG that is stretched to the row's width (a viewBox 100 wide,
 * `preserveAspectRatio="none"`), so a court's horizontal position is just a
 * percentage and nothing has to be measured. The strokes keep their width
 * under the stretch through `vector-effect`, which is the one thing that
 * makes this trick look drawn rather than smeared. The arrowhead is an
 * ordinary element placed at the same percentage, because a triangle inside
 * the stretched SVG would stretch with it.
 */
function Routes({
  upper,
  lower,
  lit,
}: {
  upper: Court[];
  lower: Court[];
  lit: ReadonlySet<string>;
}) {
  const centre = (row: Court[], slug: string) => {
    const index = row.findIndex((c) => c.slug === slug);
    return index < 0 ? null : ((index + 0.5) * 100) / row.length;
  };

  const routes = lower.flatMap((court) => {
    const from = centre(lower, court.slug);
    if (from === null) return [];
    return [court.appealsTo, court.alsoAppealsTo].flatMap((parent) => {
      const to = parent ? centre(upper, parent) : null;
      if (to === null) return [];
      return [{ from, to, isLit: lit.has(court.slug) && lit.has(parent!) }];
    });
  });

  // One arrowhead per court that receives appeals, lit if any route into it is.
  const heads = new Map<number, boolean>();
  for (const route of routes) heads.set(route.to, (heads.get(route.to) ?? false) || route.isLit);

  const mid = GAP / 2;
  const path = (from: number, to: number) => {
    if (Math.abs(from - to) < 0.5) return `M ${from} ${GAP} V 0`;
    const dir = to > from ? 1 : -1;
    const r = 2.5;
    return [
      `M ${from} ${GAP}`,
      `V ${mid + r}`,
      `Q ${from} ${mid} ${from + dir * r} ${mid}`,
      `H ${to - dir * r}`,
      `Q ${to} ${mid} ${to} ${mid - r}`,
      `V 0`,
    ].join(' ');
  };

  return (
    <div aria-hidden className="pointer-events-none relative" style={{ height: GAP }}>
      <svg
        viewBox={`0 0 100 ${GAP}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
      >
        {/* Unlit routes first, lit ones on top, so a lit line is never crossed
            out by a grey one sharing its parent. */}
        {[...routes.filter((r) => !r.isLit), ...routes.filter((r) => r.isLit)].map((route, i) => (
          <path
            key={`${route.from}-${route.to}-${i}`}
            d={path(route.from, route.to)}
            fill="none"
            vectorEffect="non-scaling-stroke"
            className={cn(
              'court-route',
              route.isLit ? 'stroke-burgundy' : 'stroke-rule-strong',
            )}
            strokeWidth={route.isLit ? 2 : 1.5}
            strokeLinecap="round"
          />
        ))}
      </svg>
      {[...heads.entries()].map(([x, isLit]) => (
        <span
          key={x}
          className={cn(
            'absolute top-0 block size-2 -translate-x-1/2 -translate-y-[1px] rotate-45 border-l-2 border-t-2 transition-colors',
            isLit ? 'border-burgundy' : 'border-rule-strong',
          )}
          style={{ left: `${x}%` }}
        />
      ))}
    </div>
  );
}
