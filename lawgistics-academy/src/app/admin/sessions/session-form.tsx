'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { isEmbeddable } from '@/lib/lessons/embed';
import type { AdminState } from '../actions';

export interface SessionFormValues {
  id?: string;
  title: string;
  summary: string;
  url: string;
  country: 'ALL' | 'AU' | 'MY';
  airsOn: string;
  published: boolean;
}

/**
 * Putting a session up.
 *
 * The link is the part people get wrong, so it is checked as it is typed rather
 * than after pressing the button. Pasting the address from the browser bar of a
 * YouTube page gives you a watch link, which cannot be framed; what is wanted is
 * the embed link from the share menu. Being told that while the paste is still
 * on screen is the difference between a fix and a shrug.
 *
 * The preview is the same iframe the learner gets. If it plays here it plays
 * for them, and if it does not the coach finds out now rather than at seven in
 * the morning in front of the cohort.
 */
export function SessionForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: AdminState, formData: FormData) => Promise<AdminState>;
  initial: SessionFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [url, setUrl] = useState(initial.url);

  const trimmed = url.trim();
  const playable = trimmed ? isEmbeddable(trimmed) : null;

  return (
    <form action={formAction} className="space-y-5">
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Card>
        <h2 className="mb-1 text-lg">The session</h2>
        <p className="mb-4 text-sm text-slate">
          Record it wherever you normally do, put it on YouTube or Vimeo, and paste the
          link here. On YouTube you can set it to Unlisted, which means it is not
          searchable and only somebody with the link can watch it.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              name="title"
              defaultValue={initial.title}
              required
              maxLength={200}
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
            />
          </div>

          <div>
            <label htmlFor="summary" className="mb-1.5 block text-sm font-medium">
              What it covers
            </label>
            <textarea
              id="summary"
              name="summary"
              defaultValue={initial.summary}
              rows={3}
              maxLength={2000}
              className="w-full rounded-[5px] border border-rule-strong bg-paper px-3 py-2.5 text-base outline-none focus:border-burgundy"
            />
            <p className="mt-1 text-xs text-muted">
              One or two sentences, so somebody deciding whether to watch at seven in the
              morning can decide before pressing play.
            </p>
          </div>

          <div>
            <label htmlFor="url" className="mb-1.5 block text-sm font-medium">
              Link
            </label>
            <input
              id="url"
              name="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://www.youtube-nocookie.com/embed/..."
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
            />
            {playable === false ? (
              <p className="mt-1.5 text-xs text-verdict-wrong">
                That link will not play here. On YouTube, press Share, then Embed, and copy
                the address inside <code>src=&quot;...&quot;</code>. It should start{' '}
                <code>https://www.youtube-nocookie.com/embed/</code> or{' '}
                <code>https://player.vimeo.com/video/</code>. A normal watch link with{' '}
                <code>?v=</code> in it cannot be played inside another page.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted">
                The embed address from the Share menu, not the address in the browser bar.
              </p>
            )}
          </div>

          {playable ? (
            <figure className="m-0">
              <figcaption className="mb-1.5 text-sm font-medium">
                What they will see
              </figcaption>
              <div className="aspect-video w-full overflow-hidden rounded-md border border-rule bg-paper-sunk">
                <iframe
                  src={trimmed}
                  title="Preview"
                  allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="size-full"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                If it plays here it plays for them. If it asks you to sign in, or says the
                video is unavailable, so will it for them.
              </p>
            </figure>
          ) : null}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg">Who and when</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="country" className="mb-1.5 block text-sm font-medium">
              Who it is for
            </label>
            <select
              id="country"
              name="country"
              defaultValue={initial.country}
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
            >
              <option value="ALL">Everybody</option>
              <option value="MY">Malaysia only</option>
              <option value="AU">Australia only</option>
            </select>
            <p className="mt-1 text-xs text-muted">
              Everybody, unless it turns on the law of one place. Craft usually travels.
            </p>
          </div>

          <div>
            <label htmlFor="airsOn" className="mb-1.5 block text-sm font-medium">
              The morning it is for (optional)
            </label>
            <input
              id="airsOn"
              name="airsOn"
              type="date"
              defaultValue={initial.airsOn}
              className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
            />
            <p className="mt-1 text-xs text-muted">
              Leads the dashboard on that day. A date in the future stays hidden until it
              arrives, so you can put next week up now. Leave it blank for something that
              belongs in the library rather than to one morning.
            </p>
          </div>

          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial.published}
              className="mt-0.5 size-4"
            />
            <span>
              <strong className="font-medium">Publish it.</strong>{' '}
              <span className="text-slate">
                Unticked, it is a draft only you can see. Your name goes on anything
                published.
              </span>
            </span>
          </label>
        </div>
      </Card>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">{state.ok}</Notice> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
