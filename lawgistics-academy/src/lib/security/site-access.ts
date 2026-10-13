/**
 * The site access switch: a fail-secure way to restrict the website while
 * something is wrong, set by the owner in Vercel as `SITE_ACCESS`.
 *
 *   open          Normal. The default when the setting is not there at all.
 *   staff-closed  Everything staff-only is unavailable: every page and file
 *                 under /admin, every staff action, the inbound email route,
 *                 the joining digest and first-run setup. Learners carry on.
 *   closed        The whole website shows the maintenance page. Nobody signs
 *                 in and no action runs. Only the nightly deletion job runs.
 *
 * Any other value, an empty one included, counts as `closed`: a typo must
 * never open the site. Case and surrounding spaces are ignored.
 *
 * The switch only ever takes access away. No value of it turns two-step
 * sign-in off, skips a sign-in check or opens anything `open` keeps shut; it
 * adds a refusal in front of the usual checks and changes nothing behind
 * them. docs/ROLLBACK.md is the owner's guide to using it.
 *
 * Pure functions with no Next imports, so the middleware, the admin guard,
 * the server and the tests all read the same decisions.
 */

export type SiteAccess = 'open' | 'staff-closed' | 'closed';

/** The values the owner may set, from least to most restrictive. */
export const SITE_ACCESS_VALUES: readonly SiteAccess[] = ['open', 'staff-closed', 'closed'];

/** Where the maintenance page is served. A guard sends staff here when the staff area is closed. */
export const MAINTENANCE_PATH = '/maintenance';

/**
 * Server-to-server routes that keep running whatever the switch says. Only
 * the nightly deletion job: it has its own secret (CRON_SECRET), and a
 * deletion somebody asked for must keep finishing while the site is shut.
 */
export const ALWAYS_RUNNING_PATHS: readonly string[] = ['/api/cron/erasure-retry'];

/**
 * Paths that are for staff only, closed by `staff-closed` and `closed`.
 * /admin covers every staff page and the report downloads under it. The
 * inbound email route makes drafts under a lawyer's name; the digest lists
 * everybody joining the firm; /setup makes the first administrator.
 */
export const STAFF_ONLY_PATHS: readonly string[] = ['/admin', '/api/inbound/work', '/api/digest', '/setup'];

/**
 * The switch as set. Unset is `open`; the three names, in any case and with
 * any surrounding spaces, are themselves; anything else is `closed`.
 */
export function siteAccess(raw: string | undefined = process.env.SITE_ACCESS): SiteAccess {
  if (raw === undefined) return 'open';
  const value = raw.trim().toLowerCase();
  if (value === 'open') return 'open';
  if (value === 'staff-closed') return 'staff-closed';
  return 'closed';
}

/** Whether staff pages, staff actions and staff routes may run. Only when `open`. */
export function staffAreaOpen(mode: SiteAccess): boolean {
  return mode === 'open';
}

/**
 * Whether anybody may be signed in and act at all. False only when `closed`;
 * `getCurrentUser`, which every server action starts from, then answers
 * nobody, and the invitation action refuses on its own.
 */
export function signedInUseOpen(mode: SiteAccess): boolean {
  return mode !== 'closed';
}

/** A path, lower case, decoded once, with repeated and trailing slashes removed. */
export function normalisePath(pathname: string): string {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // A path that does not decode is compared as it came.
  }
  path = path.toLowerCase().replace(/\/{2,}/g, '/');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path.startsWith('/') ? path : `/${path}`;
}

function under(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * What the middleware does with a request before any of its usual checks.
 *
 * - `maintenance`: answer with the maintenance page, status 503, and nothing
 *   else runs (no session is read, no page or action runs).
 * - `continue`: carry on to the usual checks (sign-in, two-step, and so on),
 *   exactly as when the switch is `open`. There is no third answer: the
 *   switch can only refuse, never wave a request past a check.
 *
 * `serverAction` is whether the request carries a `Next-Action` header. A
 * server action can be posted to any page's address, so the staff guards
 * refuse staff actions themselves; here it only stops one being posted to
 * the address of the job that keeps running.
 */
export type PathDecision = 'continue' | 'maintenance';

export function pathDecision(
  mode: SiteAccess,
  pathname: string,
  request: { serverAction: boolean } = { serverAction: false },
): PathDecision {
  const path = normalisePath(pathname);
  if (mode === 'open') return 'continue';
  if (path === MAINTENANCE_PATH) return 'maintenance';
  if (under(path, ALWAYS_RUNNING_PATHS)) return request.serverAction ? 'maintenance' : 'continue';
  if (mode === 'closed') return 'maintenance';
  return under(path, STAFF_ONLY_PATHS) ? 'maintenance' : 'continue';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** The words on the maintenance page, for the switch as set. */
export function maintenanceWords(mode: SiteAccess): { title: string; lines: string[] } {
  if (mode === 'staff-closed') {
    return {
      title: 'The staff area is closed for maintenance',
      lines: [
        'The staff pages are closed for a short while so that something can be checked.',
        'Learners can carry on as normal. Please try the staff pages again later.',
      ],
    };
  }
  return {
    title: 'The academy is closed for maintenance',
    lines: [
      'The website is closed for a short while so that something can be checked.',
      'Nobody can sign in until it opens again. Please try again later.',
    ],
  };
}

/**
 * The maintenance page: one plain HTML page with no scripts, no images and
 * nothing fetched, so it shows under the site's content security policy
 * (which allows inline styles and no inline script) and needs no database.
 */
export function maintenanceHtml(mode: SiteAccess, siteName: string): string {
  const { title, lines } = maintenanceWords(mode);
  const name = escapeHtml(siteName);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} | ${name}</title>
<style>
body{margin:0;background:#f7f3ec;color:#1b1b1b;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.55}
main{box-sizing:border-box;max-width:36rem;margin:0 auto;padding:4rem 1.25rem}
p.name{margin:0 0 2rem;font-weight:600;letter-spacing:.02em}
h1{margin:0 0 1rem;font-size:1.6rem;line-height:1.25}
p{margin:0 0 .9rem;font-size:1.05rem}
</style>
</head>
<body>
<main>
<p class="name">${name}</p>
<h1>${escapeHtml(title)}</h1>
${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('\n')}
</main>
</body>
</html>
`;
}
