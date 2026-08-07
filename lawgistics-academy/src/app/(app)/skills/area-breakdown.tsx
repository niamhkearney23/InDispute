'use client';

import { useState } from 'react';
import { ScoreBar, cn } from '@/components/ui';
import { masteryBand } from '@/lib/learning/mastery';

export interface AreaConcept {
  slug: string;
  name: string;
  score: number;
  attempts: number;
  confidentAndWrong: number;
}

export interface Area {
  slug: string;
  name: string;
  score: number;
  attempts: number;
  concepts: AreaConcept[];
}

/**
 * The skill map, opened one area at a time.
 *
 * Seven bars followed by ten bars followed by five more is a report, and a
 * report is read once. An area you open shows only the concepts under it, which
 * is both less to take in and the level at which you can actually do something:
 * "Evidence 61" tells you nothing to act on, "hearsay 34, privilege 71" does.
 */
export function AreaBreakdown({ areas }: { areas: Area[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <div className="space-y-2.5">
      {areas.map((area) => {
        const open = openSlug === area.slug;
        const measured = area.concepts.filter((c) => c.attempts > 0);

        return (
          <div
              key={area.slug}
              className={cn(
                'overflow-hidden rounded-lg border bg-paper-raised',
                open ? 'border-rule-strong' : 'border-rule',
              )}
            >
            <button
              type="button"
              onClick={() => setOpenSlug(open ? null : area.slug)}
              aria-expanded={open}
              className="w-full px-5 py-4 text-left"
            >
              <ScoreBar
                label={area.name}
                score={area.score}
                band={masteryBand(area.score)}
                sublabel={
                  area.attempts === 0
                    ? 'Not yet assessed'
                    : open
                      ? 'Tap to close'
                      : `${measured.length} concept${measured.length === 1 ? '' : 's'} measured`
                }
              />
            </button>

            {open ? (
              <div className="rise-in border-t border-rule px-5 py-4">
                {measured.length === 0 ? (
                  <p className="text-sm text-slate">
                    Nothing measured in here yet. It will fill in as these concepts come up
                    in training.
                  </p>
                ) : (
                  <div className="divide-y divide-rule">
                    {[...measured]
                      .sort((a, b) => a.score - b.score)
                      .map((concept) => (
                        <ScoreBar
                          key={concept.slug}
                          label={concept.name}
                          score={concept.score}
                          band={masteryBand(concept.score)}
                          sublabel={
                            concept.confidentAndWrong > 0
                              ? `Sure and wrong ${concept.confidentAndWrong} time${concept.confidentAndWrong === 1 ? '' : 's'}`
                              : `${concept.attempts} answer${concept.attempts === 1 ? '' : 's'}`
                          }
                        />
                      ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
