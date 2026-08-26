/**
 * Today's goal, as a ring.
 *
 * The dashboard could say how many questions today's session holds, and nothing
 * said how many of them had been done. Somebody who trained this morning opened
 * the app to the same sentence they saw before they started, which is the one
 * reliable way to make a daily habit feel like it is not counting.
 *
 * A ring rather than a bar because it reads at a glance from across a desk, and
 * because a closed ring is a better full stop than a bar that has run out of
 * room. It fills and it stops. It does not pulse, glow, or ask anybody to come
 * back tomorrow.
 *
 * Server-rendered from answers already recorded, so there is nothing here to
 * animate on a timer and nothing that can be nudged by clicking.
 */
export function GoalRing({
  done,
  goal,
  size = 92,
}: {
  done: number;
  goal: number;
  size?: number;
}) {
  const target = Math.max(goal, 1);
  const fraction = Math.min(done / target, 1);
  const complete = done >= target;

  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // Rounded caps stick out past the arc, so a fraction of zero still paints a
  // dot on the ring and reads as "one done" when nothing has been.
  const dash = fraction === 0 ? 0 : circumference * fraction;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        complete
          ? `Daily goal complete: ${done} of ${target} questions`
          : `${done} of ${target} questions answered today`
      }
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-paper-sunk"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap={dash > 0 ? 'round' : 'butt'}
          strokeDasharray={`${dash} ${circumference}`}
          className={complete ? 'stroke-verdict-correct' : 'stroke-burgundy'}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-xl leading-none tabular-nums">{done}</span>
        <span className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-muted">
          of {target}
        </span>
      </div>
    </div>
  );
}
