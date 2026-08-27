'use client';

import { useEffect, useState } from 'react';

/**
 * The moment somebody crosses into a new level.
 *
 * Ten levels existed and nothing marked the crossing. XP went up, the number on
 * the dashboard quietly changed, and the one instant worth making a fuss of
 * went past unremarked. A level nobody notices reaching is not a level, it is a
 * threshold in a config file.
 *
 * It is earned before it is shown: XP comes from answers marked on the server,
 * and this component is told what happened rather than deciding it. Nothing
 * here can be triggered by clicking.
 *
 * The animation is a rise and a settle, not a firework. This is a legal
 * training tool for people at work, and something that looks like a slot
 * machine paying out would cheapen a record a firm is meant to rely on.
 * Anybody who has asked not to be moved gets the same words and no motion.
 */
export function LevelUp({
  level,
  name,
  blurb,
}: {
  level: number;
  name: string;
  blurb: string;
}) {
  const [shown, setShown] = useState(false);

  // Mounted first, then animated, so the transition has a start state to move
  // from. Setting both in one paint means no transition at all.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      aria-live="polite"
      className={`rounded-lg border border-burgundy/25 bg-burgundy-wash px-6 py-7 text-center transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <p className="eyebrow mb-3 text-burgundy">Level up</p>

      <div
        className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-burgundy/30 bg-paper font-serif text-2xl text-burgundy transition-transform duration-700 ease-out motion-reduce:transition-none ${
          shown ? 'scale-100' : 'scale-90'
        }`}
      >
        {level}
      </div>

      <h2 className="text-2xl sm:text-3xl">{name}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate">{blurb}</p>
    </section>
  );
}
