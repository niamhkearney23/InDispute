import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Turns an email confirmation link into a session cookie.
 *
 * Supabase can send that link back in three different shapes depending on how
 * the project is configured, and a route that understands only one of them
 * leaves the user staring at a dead link with no idea why:
 *
 *   ?code=…                     PKCE flow — exchange it for a session.
 *   ?token_hash=…&type=signup   the newer link format — verify it directly.
 *   #access_token=…             implicit flow — the fragment never reaches the
 *                               server, so the browser has to finish the job.
 *                               `AuthFragmentHandler` on /login does that.
 *
 * Anything we cannot complete redirects to /login with a reason, so the failure
 * is legible rather than silent.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const nextParam = searchParams.get('next');
  const next =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/onboarding';

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);

  // Supabase reports its own failures (expired link, already used) this way.
  const supabaseError = searchParams.get('error_description') ?? searchParams.get('error');
  if (supabaseError) return fail(supabaseError);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      // 'signup' is the confirmation we send; anything else Supabase names for us.
      type: (type as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink') ?? 'signup',
    });
    if (error) return fail(error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No query parameters at all usually means the implicit flow put the tokens in
  // the fragment. Send the browser to /login, which reads it and finishes there.
  return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}`);
}
