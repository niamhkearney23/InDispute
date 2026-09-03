/**
 * Whose product this is.
 *
 * The name appeared in eight places, which is fine until a firm wants their own
 * on it and then it is eight places to miss one. It is now one object, read
 * from the environment, so a deployment for another firm is three settings and
 * a redeploy rather than a fork.
 *
 * This is white labelling per deployment: one firm, one Vercel project, one
 * Supabase project, their name on it. That is genuinely useful and it is not
 * the same thing as multi-tenancy, where a single deployment serves many firms
 * and decides whose branding to show per request. Multi-tenancy needs a firm
 * model, membership, and data separation that stands up to a firm asking who
 * else can see their people. Per deployment gets separation for free, because
 * there is nothing else in the database.
 *
 * These are NEXT_PUBLIC_ because the browser renders them, so they are baked in
 * at build time and a change needs a redeploy, not a restart. Nothing here is
 * secret: it is the name on the door.
 */

export interface Brand {
  /** The main word in the wordmark. */
  name: string;
  /** The small word beside it. Empty renders nothing rather than a stray gap. */
  suffix: string;
  /** Used in page titles and prose where the full thing is wanted. */
  fullName: string;
  /** One line, under the heading on the landing page. */
  tagline: string;
  /**
   * The accent, as a CSS colour. Burgundy by default. Applied as a variable so
   * a firm's colour reaches everything the accent touches rather than the one
   * button somebody remembered.
   */
  accent: string | null;
  /**
   * One character for the browser tab icon. Derived rather than configured,
   * because it is drawn into an SVG and a configured value would be a string
   * from the environment landing in markup.
   */
  initial: string;
}

const DEFAULT_NAME = 'Litigation';
const DEFAULT_SUFFIX = 'Academy';

/** The burgundy the stylesheet ships with, for anywhere the variable cannot reach. */
export const DEFAULT_ACCENT = '#6b1f2a';

function clean(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

/**
 * A colour is going into a stylesheet, so it is checked rather than trusted.
 * Hex only: enough for a brand colour, and nothing that could carry a closing
 * brace and whatever a person wanted to write after it.
 *
 * The hash is optional because it is a trap in a .env file. dotenv reads
 * `NEXT_PUBLIC_BRAND_ACCENT=#1f3a6b` as an empty string, since an unquoted #
 * starts a comment, so a firm sets their colour, nothing changes, and there is
 * nothing to see. `1f3a6b` works, `#1f3a6b` in quotes works, and Vercel's
 * settings screen does not have the problem at all.
 */
export function safeAccent(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  const match = /^#?([0-9a-fA-F]{6})$/.exec(trimmed);
  return match ? `#${match[1]}` : null;
}

/**
 * The first letter, and only if it is a letter or a digit. Everything else is
 * dropped, so nothing that could close an attribute or open a tag survives the
 * trip into the icon's SVG.
 */
export function safeInitial(value: string): string {
  const match = /[A-Za-z0-9]/.exec(value);
  return match ? match[0].toUpperCase() : 'A';
}

const name = clean(process.env.NEXT_PUBLIC_BRAND_NAME, DEFAULT_NAME);
const suffix = clean(process.env.NEXT_PUBLIC_BRAND_SUFFIX, DEFAULT_SUFFIX);

export const brand: Brand = {
  name,
  suffix,
  fullName: suffix ? `${name} ${suffix}` : name,
  tagline: clean(
    process.env.NEXT_PUBLIC_BRAND_TAGLINE,
    'Australian and Malaysian litigation training.',
  ),
  accent: safeAccent(process.env.NEXT_PUBLIC_BRAND_ACCENT),
  initial: safeInitial(name),
};
