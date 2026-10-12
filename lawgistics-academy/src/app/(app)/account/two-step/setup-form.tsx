'use client';

import { useActionState } from 'react';
import { Button, Notice } from '@/components/ui';
import { groupSecret } from '@/lib/auth/two-step';
import { CODE_INPUT } from '@/app/two-step/code-form';
import {
  confirmTwoStepSetup,
  removeTwoStepDevice,
  startTwoStepSetup,
  type StartState,
} from './actions';

const NOT_STARTED: StartState = { error: null, enrolment: null };

/**
 * Adding an authenticator app, in two presses: one to make the secret and
 * show it, one to confirm the first code from it.
 */
export function AddDevice({ next, second }: { next: string | null; second: boolean }) {
  const [started, startAction, starting] = useActionState(startTwoStepSetup, NOT_STARTED);
  const [confirmed, confirmAction, confirming] = useActionState(confirmTwoStepSetup, {
    error: null,
  });

  if (!started.enrolment) {
    return (
      <form action={startAction} className="space-y-4">
        <p className="text-sm text-slate">
          You need a phone with an authenticator app on it. Google Authenticator, Microsoft
          Authenticator and 1Password all work, and the first two are free. Install one before you
          press the button.
        </p>
        {started.error ? <Notice tone="warn">{started.error}</Notice> : null}
        <Button type="submit" disabled={starting} className="w-full sm:w-auto">
          {starting ? 'Getting it ready…' : second ? 'Add a second device' : 'Set up an authenticator app'}
        </Button>
      </form>
    );
  }

  const { factorId, qr, secret } = started.enrolment;

  return (
    <div className="space-y-5">
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate">
        <li>Open the authenticator app and choose to add an account (often a plus sign).</li>
        <li>Point the phone at the square below. If you cannot, type the key under it instead.</li>
        <li>Type the six numbers the app then shows, and press Confirm.</li>
      </ol>

      {qr ? (
        // White whatever the theme: a QR code is read as dark squares on a
        // light ground, and some phones will not read it the other way round.
        // A plain img because the picture is a data address made on the
        // server, which next/image has nothing to optimise in.
        <div className="mx-auto w-fit rounded-md bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="A QR code for your authenticator app to scan"
            width={200}
            height={200}
            className="block size-[200px]"
          />
        </div>
      ) : (
        <Notice tone="neutral">The picture could not be drawn. Type the key below instead.</Notice>
      )}

      <div>
        <p className="mb-1.5 text-sm font-medium">The key, to type instead of scanning</p>
        <p className="rounded-[5px] border border-rule bg-paper-sunk px-3 py-2.5 font-mono text-sm break-words select-all">
          {groupSecret(secret)}
        </p>
        <p className="mt-1 text-xs text-muted">
          The spaces are only there to help you keep your place. If the app asks, choose
          &ldquo;time based&rdquo;. Keep this key private: anybody with it can make your codes.
        </p>
      </div>

      <form action={confirmAction} className="space-y-4">
        <input type="hidden" name="factorId" value={factorId} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div>
          <label htmlFor="setup-code" className="mb-1.5 block text-sm font-medium">
            The six-digit code from the app
          </label>
          <input
            id="setup-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 \-]*"
            maxLength={9}
            required
            className={CODE_INPUT}
          />
        </div>
        {confirmed.error ? <Notice tone="warn">{confirmed.error}</Notice> : null}
        <Button type="submit" disabled={confirming} className="w-full sm:w-auto">
          {confirming ? 'Checking…' : 'Confirm'}
        </Button>
      </form>
    </div>
  );
}

/** One device's remove button, with its own error beside it. */
export function RemoveDevice({ factorId, name }: { factorId: string; name: string }) {
  const [state, formAction, pending] = useActionState(removeTwoStepDevice, { error: null });

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="factorId" value={factorId} />
      <Button
        type="submit"
        variant="outline"
        disabled={pending}
        aria-label={`Remove ${name}`}
        className="w-full sm:w-auto"
      >
        {pending ? 'Removing…' : 'Remove'}
      </Button>
      {state.error ? <Notice tone="warn">{state.error}</Notice> : null}
    </form>
  );
}
