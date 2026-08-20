'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { invite, type InviteState } from '../actions';

/**
 * Inviting somebody, and handing back the link.
 *
 * The link appears once. It is not stored anywhere it could be read back,
 * because only its hash is kept, so this screen says so plainly rather than
 * letting somebody navigate away and come looking for it later.
 */
export function InviteForm() {
  const [state, formAction, pending] = useActionState(invite, { error: null } as InviteState);
  const [copied, setCopied] = useState(false);

  if (state.link) {
    return (
      <Card>
        <h2 className="text-lg">The link for {state.email}</h2>
        <p className="mt-1 text-sm text-slate">
          Send this to them. It works once, expires in fourteen days, and is not shown
          again: only a hash of it is stored, in the same way a password would be. If it
          gets lost, call the invitation back and send a new one.
        </p>

        <div className="mt-4 rounded-[5px] border border-rule-strong bg-paper-sunk p-3">
          <code className="block font-mono text-sm break-all">{state.link}</code>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="accent"
            onClick={() => {
              navigator.clipboard?.writeText(state.link as string).then(
                () => setCopied(true),
                () => setCopied(false),
              );
            }}
          >
            {copied ? 'Copied' : 'Copy the link'}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Invite somebody else
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Card>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Their name" name="displayName" placeholder="Aisyah Rahman" />
            <Field
              label="Their email"
              name="email"
              type="email"
              required
              placeholder="aisyah@example.com"
              hint="The address the invitation is for. They cannot change it."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="When they begin" name="startsOn" type="date" hint="Can be set later." />
            <div>
              <label htmlFor="country" className="mb-1.5 block text-sm font-medium">
                Which law they train in
              </label>
              <select
                id="country"
                name="country"
                defaultValue="AU"
                className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
              >
                <option value="AU">Australian</option>
                <option value="MY">Malaysian</option>
              </select>
              <p className="mt-1 text-xs text-muted">
                The firm&rsquo;s own checklist reaches them either way. This decides which
                law they are trained on, and they can change it later.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}

      <Button type="submit" size="lg" variant="accent" disabled={pending}>
        {pending ? 'Creating the link…' : 'Create the invitation'}
      </Button>
    </form>
  );
}

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.ComponentProps<'input'>) {
  return (
    <div>
      <label htmlFor={props.name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={props.name}
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
        {...props}
      />
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
