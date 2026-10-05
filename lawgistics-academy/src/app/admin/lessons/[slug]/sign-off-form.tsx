'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { signOffLesson, type LessonSignOffState } from '../actions';

export function SignOffForm({ slug, hash }: { slug: string; hash: string }) {
  const [state, action, pending] = useActionState<LessonSignOffState, FormData>(signOffLesson, {
    error: null,
  });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="hash" value={hash} />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="confirm" value="yes" required className="mt-1 accent-accent" />
        <span>
          I have read every screen above, including each guess and which answer it marks right, and
          the law in it is correct.
        </span>
      </label>
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? 'Saving…' : 'Sign it off'}
      </Button>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}
    </form>
  );
}
