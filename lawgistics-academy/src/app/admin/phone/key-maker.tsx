'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

/**
 * Makes the settings notifications need, in this browser, for pasting into
 * Vercel. Nothing here is sent anywhere: the keys are made by the browser's
 * own cryptography and shown on the screen, so the private key and the
 * scheduler's secret exist only on this screen until they are pasted.
 *
 * The key pair is the standard one for web push (VAPID): a P-256 key, the
 * public half as its 65-byte uncompressed point and the private half as its
 * 32-byte scalar, both base64url without padding, which is what the server
 * library reads.
 */

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const b of array) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

type Made = { publicKey: string; privateKey: string; cronSecret: string; origin: string };

function Row({ name, value }: { name: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(`Copy ${name}`, value);
    }
  }
  return (
    <div className="space-y-1">
      <p className="font-code text-xs tracking-wide">{name}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={value}
          aria-label={name}
          className="min-w-0 flex-1 rounded border border-rule bg-transparent px-2 py-2 font-code text-base sm:text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

export function KeyMaker() {
  const [made, setMade] = useState<Made | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function make() {
    setProblem(null);
    try {
      const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
      const publicRaw = await crypto.subtle.exportKey('raw', pair.publicKey);
      const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
      const secret = crypto.getRandomValues(new Uint8Array(32));
      if (!privateJwk.d) throw new Error('no private key');
      setMade({
        publicKey: base64url(publicRaw),
        privateKey: privateJwk.d,
        cronSecret: base64url(secret),
        // This academy's own address, for the scheduler to call.
        origin: window.location.origin,
      });
    } catch {
      setProblem('This browser could not make the keys. Try again in a current Chrome, Safari or Edge.');
    }
  }

  const schedule = `select cron.schedule(
  'academy-round-reminders',
  '*/5 * * * *',
  $$ select net.http_get(
       url := '${made?.origin ?? 'https://THIS-ACADEMY-ADDRESS'}/api/push/rounds',
       headers := jsonb_build_object('Authorization', 'Bearer PASTE_CRON_SECRET_HERE'),
       timeout_milliseconds := 20000
     ) $$
);`;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm font-semibold">1. Make the keys</p>
        <p className="text-sm text-slate">
          Made in this browser and sent nowhere. Copy each one into Vercel straight away: they are not kept, and
          pressing the button again makes a different set.
        </p>
        <Button type="button" size="sm" onClick={make}>
          {made ? 'Make a new set' : 'Make the keys'}
        </Button>
        {problem ? <p className="text-sm text-warn">{problem}</p> : null}
        {made ? (
          <div className="space-y-3">
            <Row name="VAPID_PUBLIC_KEY" value={made.publicKey} />
            <Row name="VAPID_PRIVATE_KEY" value={made.privateKey} />
            <Row name="CRON_SECRET" value={made.cronSecret} />
          </div>
        ) : null}
      </section>

      <section className="space-y-2">
        <p className="text-sm font-semibold">2. Put them in Vercel</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate">
          <li>In Vercel, open this project, then Settings, then Environment Variables.</li>
          <li>Add the three above, each with its name exactly as shown.</li>
          <li>
            Add a fourth, <span className="font-code">VAPID_SUBJECT</span>, set to{' '}
            <span className="font-code">mailto:</span> and the address Apple and Google should write to if
            something is wrong, for example <span className="font-code">mailto:tech@yourfirm.com</span>.
          </li>
          <li>Go to Deployments, open the menu on the newest one, and choose Redeploy.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-semibold">3. Start the round reminders</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate">
          <li>In Supabase, open Database, then Extensions, and switch on pg_cron and pg_net.</li>
          <li>Open SQL Editor, New query, and paste the text below.</li>
          <li>
            Replace <span className="font-code">PASTE_CRON_SECRET_HERE</span> with the CRON_SECRET from step 1,
            and press Run. It checks every five minutes for a round about to open.
          </li>
        </ol>
        <pre className="overflow-x-auto rounded border border-rule p-3 font-code text-xs leading-relaxed">{schedule}</pre>
        <p className="text-sm text-slate">
          Marked work and new work need no step 3: they are sent the moment a coach saves.
        </p>
      </section>
    </div>
  );
}
