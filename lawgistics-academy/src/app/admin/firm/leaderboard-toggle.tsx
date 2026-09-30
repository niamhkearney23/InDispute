'use client';

import { useActionState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import type { AdminState } from '../actions';
import { setLeaderboardEnabled } from './actions';

export function LeaderboardToggle({ enabled }: { enabled: boolean }) {
  const [state, formAction, pending] = useActionState(setLeaderboardEnabled, {
    error: null,
  } as AdminState);

  return (
    <Card>
      <p className="eyebrow mb-2">Leaderboard</p>
      <p className="text-sm text-slate">
        A table of XP earned in the last seven days, shown on every learner&rsquo;s dashboard. First
        names only, staff never on it, and any learner can take themselves off. It is off
        until you turn it on: some firms want the race and some trainees do not.
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2.5 py-2 text-sm">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={enabled}
            className="size-5"
          />
          Show the leaderboard to learners
        </label>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </form>
      {state.ok ? (
        <div className="mt-3">
          <Notice tone="neutral">{state.ok}</Notice>
        </div>
      ) : null}
      {state.error ? (
        <div className="mt-3">
          <Notice tone="warn">{state.error}</Notice>
        </div>
      ) : null}
    </Card>
  );
}
