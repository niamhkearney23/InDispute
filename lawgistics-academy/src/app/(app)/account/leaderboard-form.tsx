'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { setLeaderboardOptOut, type LeaderboardState } from './actions';

export function LeaderboardForm({ optedOut }: { optedOut: boolean }) {
  const [state, formAction, pending] = useActionState(setLeaderboardOptOut, {
    error: null,
  } as LeaderboardState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2.5 py-2 text-sm">
        <input type="checkbox" name="optOut" defaultChecked={optedOut} className="size-5" />
        Keep me off the firm&rsquo;s leaderboard
      </label>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
      {state.ok ? <Notice tone="neutral">{state.ok}</Notice> : null}
      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
    </form>
  );
}
