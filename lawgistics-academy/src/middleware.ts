import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import { safeLogo } from '@/lib/brand';
import { buildCsp, makeNonce } from '@/lib/security/csp';

type CookiesToSet = Array<{ name: string; value: string; options: CookieOptions }>;

// /setup is public so the first-run checklist is visible before you have an
// account. The action behind it still requires a signed-in user, and closes
// permanently once an administrator exists.
//
// /join is public because the entire point of it is somebody who does not have
// an account yet. It is not unprotected: the invitation token in the link is
// the credential, and the page shows nothing at all without a valid one.
//
// /api/digest is listed rather than /api, so this stays a decision made one
// route at a time. It carries its own bearer token and returns 404 unless one
// is configured; putting the whole of /api here would make every future route
// public by default, which is the wrong way round.
// /api/inbound/work likewise: the inbound email service has no session, and
// the route checks its own token before reading anything.
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/forgot-password',
  '/signup',
  '/trainee',
  '/auth',
  '/setup',
  '/join',
  '/api/digest',
  '/api/inbound/work',
  '/api/stripe/webhook',
];

// Pages for somebody who is not signed in yet. A signed-in person asking for
// one is sent to /dashboard instead. That is why no learner page may send a
// signed-in person here: a page that does, for a reason /dashboard shares
// (no profile row, say), makes a loop the browser gives up on. A test reads
// this list and holds every learner page to it.
const SIGNED_OUT_ONLY = ['/login', '/signup', '/trainee', '/trainee/signup'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Route handlers that send a file. Their own, stricter policy is set in
// next.config.ts, and a header set here would replace it, so the page policy
// is left off these. A test holds every route that sends a download to this
// list and to next.config.ts.
const OWN_POLICY = ['/admin/reports/export', '/certificate/pdf'];

export async function middleware(request: NextRequest) {
  // A fresh nonce for every request. Next reads it back out of the request's
  // own Content-Security-Policy header while it renders and puts it on every
  // script it writes, so the header has to be on the request before any
  // NextResponse.next() below copies the request across.
  const csp = buildCsp({
    nonce: makeNonce(),
    dev: process.env.NODE_ENV === 'development',
    supabaseUrl: publicEnv.supabaseUrl,
    logo: safeLogo(process.env.NEXT_PUBLIC_BRAND_LOGO),
    // Behind a host's proxy the request may arrive as http with the original
    // scheme in x-forwarded-proto; either says the visitor is on HTTPS.
    upgradeInsecure:
      request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https',
  });
  request.headers.set('Content-Security-Policy', csp);

  const ownPolicy = OWN_POLICY.some(
    (p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`),
  );
  const respond = (res: NextResponse) => {
    if (!ownPolicy) res.headers.set('Content-Security-Policy', csp);
    return res;
  };

  let response = NextResponse.next({ request });

  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    return respond(response);
  }

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refreshes the auth token cookie. Do not remove: Server Components cannot
  // write cookies, so without this the session silently expires mid-use.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && SIGNED_OUT_ONLY.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return respond(response);
}

// `icon$` is the tab icon. It used to be a checked-in file at /icon.svg and was
// covered by the extension rule below; it is now generated from the brand and
// served at /icon with no extension, so without this line a signed-out visitor
// gets a redirect to /login where the browser expected an image. `mp4` is the
// front page's video, which is for people who have not signed in yet.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
};
