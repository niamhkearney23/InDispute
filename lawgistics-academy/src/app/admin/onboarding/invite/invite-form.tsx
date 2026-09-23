'use client';

import { useActionState, useState } from 'react';
import { Button, Card, Notice } from '@/components/ui';
import { PRACTICE_CHOICES } from '@/lib/types';
import { createAccount, invite, type AccountState, type InviteState } from '../actions';

/**
 * Inviting somebody, two ways.
 *
 * A link, which they open to choose their own password: the default, and the
 * one where nobody but them ever knows it. Or an account made here and now,
 * with a temporary password to hand over, for a firm that would rather do
 * that than send a link; that person is made to choose their own the first
 * time they sign in.
 *
 * Whichever way, what comes back appears once. It is not stored anywhere it
 * could be read back, so this screen says so plainly rather than letting
 * somebody navigate away and come looking for it later.
 */
export function InviteForm() {
  const [linkState, inviteAction, inviting] = useActionState(invite, {
    error: null,
  } as InviteState);
  const [accountState, accountAction, creating] = useActionState(createAccount, {
    error: null,
  } as AccountState);
  const [way, setWay] = useState<'link' | 'password'>('link');
  const [copied, setCopied] = useState(false);

  const copy = (text: string) =>
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );

  if (linkState.link) {
    return (
      <Card>
        <h2 className="text-lg">The link for {linkState.email}</h2>
        <p className="mt-1 text-sm text-slate">
          Send this to them. It works once, expires in fourteen days, and is not shown
          again: only a hash of it is stored, in the same way a password would be. If it
          gets lost, call the invitation back and send a new one.
        </p>

        <div className="mt-4 rounded-[5px] border border-rule-strong bg-paper-sunk p-3">
          <code className="block font-mono text-sm break-all">{linkState.link}</code>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="accent" onClick={() => copy(linkState.link as string)}>
            {copied ? 'Copied' : 'Copy the link'}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Invite somebody else
          </Button>
        </div>
      </Card>
    );
  }

  if (accountState.password) {
    return (
      <Card>
        <h2 className="text-lg">The account for {accountState.email} is ready</h2>
        <p className="mt-1 text-sm text-slate">
          Give them this password along with the sign-in address. It is shown once and not
          stored where it can be read back. The first time they sign in they will be asked
          to choose their own, and this one stops working.
        </p>

        <div className="mt-4 rounded-[5px] border border-rule-strong bg-paper-sunk p-3">
          <code className="block font-mono text-lg tracking-wide">{accountState.password}</code>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="accent"
            onClick={() => copy(accountState.password as string)}
          >
            {copied ? 'Copied' : 'Copy the password'}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Add somebody else
          </Button>
        </div>
      </Card>
    );
  }

  const pending = inviting || creating;
  const error = linkState.error ?? accountState.error;

  return (
    <form action={way === 'link' ? inviteAction : accountAction} className="space-y-5">
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
              hint="The address the account is for. They cannot change it."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="When they begin" name="startsOn" type="date" hint="Can be set later." />
            <div>
              <label htmlFor="choice" className="mb-1.5 block text-sm font-medium">
                Which programme
              </label>
              <select
                id="choice"
                name="choice"
                defaultValue="AU"
                className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3 text-base outline-none focus:border-burgundy sm:h-10"
              >
                {PRACTICE_CHOICES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                Australia, Malaysia, or the Malaysian litigation trainee programme. This
                decides which law they are trained on and what their dashboard shows.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">How they get in</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                [
                  'link',
                  'Send them a link',
                  'They open it and choose their own password. Nobody else ever knows it.',
                ],
                [
                  'password',
                  'Make the account now',
                  'You get a temporary password to hand over. They must change it when they first sign in.',
                ],
              ] as const
            ).map(([value, label, help]) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-2.5 rounded-[5px] border border-rule-strong bg-paper-raised p-3 text-sm has-[:checked]:border-burgundy"
              >
                <input
                  type="radio"
                  name="way"
                  value={value}
                  checked={way === value}
                  onChange={() => setWay(value)}
                  className="mt-0.5 size-4"
                />
                <span>
                  <strong className="font-medium">{label}</strong>
                  <span className="mt-0.5 block text-xs text-slate">{help}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      {error ? <Notice tone="warn">{error}</Notice> : null}

      <Button type="submit" size="lg" variant="accent" disabled={pending}>
        {pending
          ? way === 'link'
            ? 'Creating the link…'
            : 'Making the account…'
          : way === 'link'
            ? 'Create the invitation'
            : 'Make the account'}
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
