import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import { erasedByCheck, signInRefused } from '@/lib/auth/refused';
import { brand, safeLogo } from '@/lib/brand';
import { buildCsp, makeNonce } from '@/lib/security/csp';
import { maintenanceHtml, pathDecision, siteAccess, type SiteAccess } from '@/lib/security/site-access';
import {
  codePathFor,
  needsCodeNow,
  REQUEST_PATH_HEADER,
  TWO_STEP_CODE_PATH,
  twoStepEnforced,
  verifiedFactors,
} from '@/lib/auth/two-step';

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
// /goodbye is where somebody lands after deleting their account, signed out.
// /api/cron/erasure-retry and /api/cron/content-review are called by
// Vercel's scheduler, which has no session; each route refuses anything
// without the CRON_SECRET bearer token.
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/forgot-password',
  '/signup',
  '/trainee',
  '/auth',
  '/setup',
  '/join',
  '/goodbye',
  '/api/digest',
  '/api/inbound/work',
  '/api/stripe/webhook',
  '/api/cron/erasure-retry',
  '/api/cron/content-review',
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

/**
 * The maintenance page, status 503, for a request the site access switch
 * refuses (src/lib/security/site-access.ts). Not cached, so the page goes
 * away the moment the switch is put back.
 */
function maintenanceResponse(mode: SiteAccess, csp: string): NextResponse {
  return new NextResponse(maintenanceHtml(mode, brand.fullName), {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': '3600',
      'Content-Security-Policy': csp,
    },
  });
}

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

  // The site access switch, before anything else: a refused request reads no
  // session and reaches no page, route or action. It can only refuse; a
  // request it lets through meets every check below exactly as when it is
  // open. A server action can be posted to any page's address, which is why
  // the staff guards and getCurrentUser ask the switch as well.
  const access = siteAccess();
  if (
    pathDecision(access, request.nextUrl.pathname, {
      serverAction: request.headers.has('next-action'),
    }) === 'maintenance'
  ) {
    return maintenanceResponse(access, csp);
  }

  // Set before the response is made, so the pages see it. Always set, so a
  // value the browser sent under the same name never survives.
  request.headers.set(
    REQUEST_PATH_HEADER,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
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
    data: { user: signedIn },
  } = await supabase.auth.getUser();
  // A deleted account counts as signed out, the same as in getCurrentUser:
  // banned at the auth server (0043), or erased in the database even if the
  // ban never happened (0045). Were the two to disagree, /login would send it
  // to /dashboard and /dashboard back to /login, for good. The database is
  // asked only for somebody signed in, and only once.
  const notBanned = signInRefused(signedIn) ? null : signedIn;
  const erased = notBanned ? await supabase.rpc('caller_erased') : null;
  const user = erased && erasedByCheck(erased.data, erased.error) ? null : notBanned;

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Somebody with an authenticator app who has only typed a password is sent
  // to type today's code before any signed-in page, staff or learner. For a
  // learner who chose to add an app, this is what holds them to it. For staff
  // it is the quick path, not the control: the admin guard checks the signed
  // token again, and also catches staff who have no app yet, which needs
  // their profile and so cannot be told here. The devices are the ones
  // getUser just fetched from Supabase; the level is read from the token that
  // getUser has just accepted, without another request.
  if (
    user &&
    !isPublic(pathname) &&
    pathname !== TWO_STEP_CODE_PATH &&
    twoStepEnforced() &&
    verifiedFactors(user.factors).length > 0
  ) {
    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      needsCodeNow({
        verifiedFactorCount: verifiedFactors(user.factors).length,
        aal: level?.currentLevel ?? null,
        enforced: true,
      })
    ) {
      const url = request.nextUrl.clone();
      const target = codePathFor(`${pathname}${request.nextUrl.search}`);
      url.pathname = TWO_STEP_CODE_PATH;
      url.search = target.slice(target.indexOf('?'));
      // Carry over a session getUser has just refreshed, or the code step
      // would start from the old one and its refresh would be spent twice.
      const redirect = NextResponse.redirect(url);
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
      return redirect;
    }
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
