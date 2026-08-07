'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Notice } from '@/components/ui';

/**
 * Finishes an implicit-flow email confirmation.
 *
 * When a Supabase project is not using PKCE, the confirmation link comes back
 * with the tokens in the URL fragment, `#access_token=…&refresh_token=…`. A
 * fragment is never sent to the server, so the route handler cannot see it and
 * the user lands on a page that looks like nothing happened. This reads it in
 * the browser, sets the session, and carries on.
 *
 * It also surfaces the error fragment Supabase uses for expired or already-used
 * links, which is the single most common reason a confirmation link "doesn't
 * work" and otherwise produces no message at all.
 */
export function AuthFragmentHandler({ next }: { next: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const errorDescription = params.get('error_description') ?? params.get('error');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!errorDescription && !(accessToken && refreshToken)) return;

    let cancelled = false;

    // The fragment is consumed exactly once: cleared before anything else, so a
    // refresh cannot replay a spent token, and reported asynchronously so the
    // effect itself only talks to the browser.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    (async () => {
      try {
        if (errorDescription) {
          if (!cancelled) setMessage(errorDescription.replace(/\+/g, ' '));
          return;
        }

        const supabase = createClient();
        const { error } = await supabase.auth.setSession({
          access_token: accessToken!,
          refresh_token: refreshToken!,
        });
        if (cancelled) return;

        if (error) {
          setMessage(error.message);
          return;
        }

        router.replace(next);
        router.refresh();
      } catch (caught) {
        if (!cancelled) {
          setMessage(caught instanceof Error ? caught.message : 'Could not complete sign-in.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [next, router]);

  if (!message) return null;

  return (
    <div className="mx-auto mb-4 w-full max-w-md px-5">
      <Notice tone="warn">
        {message} You can sign in below with the email and password you chose.
      </Notice>
    </div>
  );
}
