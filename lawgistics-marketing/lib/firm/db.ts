import { Pool, type PoolClient } from "pg";

// The firm layer is the only part of this app that stores anything. It needs a
// Postgres database (Neon, Supabase and Vercel Postgres all hand out a plain
// connection string) and a session secret. If either is missing the whole layer
// reports itself as not configured and the solo studio carries on exactly as it
// always did, so adding this can never break a working install.

export type FirmStatus = { ok: true } | { ok: false; reason: string };

export function firmStatus(): FirmStatus {
  if (!process.env.DATABASE_URL) {
    return { ok: false, reason: "DATABASE_URL is not set, so firm workspaces are off." };
  }
  const secret = process.env.SESSION_SECRET || "";
  if (secret.length < 32) {
    return {
      ok: false,
      reason: "SESSION_SECRET is missing or shorter than 32 characters, so firm sign in is off.",
    };
  }
  return { ok: true };
}

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // serverless instances are many and short lived, so keep each one small
      max: Number(process.env.DB_POOL_MAX) || 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
    // an idle client erroring must not take the process down
    pool.on("error", () => {});
  }
  return pool;
}

export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const res = await getPool().query(text, params as never[]);
  return res.rows as T[];
}

export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const c = await getPool().connect();
  try {
    await c.query("begin");
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

const SCHEMA = `
create table if not exists firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand jsonb not null default '{}',
  require_approval boolean not null default true,
  monthly_quota int not null default 4,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin','lawyer')),
  profile jsonb not null default '{}',
  invite_hash text,
  invite_expires timestamptz,
  active boolean not null default true,
  session_gen int not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists members_invite_hash on members(invite_hash) where invite_hash is not null;
create index if not exists members_firm on members(firm_id);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  topic text not null default '',
  slides jsonb not null default '[]',
  caption text not null default '',
  rev int not null default 1,
  status text not null default 'draft'
    check (status in ('draft','submitted','approved','changes_requested')),
  reviewer_note text not null default '',
  reviewed_by uuid references members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);
create index if not exists posts_firm_status on posts(firm_id, status, updated_at desc);
create index if not exists posts_member on posts(member_id, updated_at desc);

create table if not exists usage (
  id bigserial primary key,
  firm_id uuid not null references firms(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
create index if not exists usage_member_month on usage(member_id, created_at);
`;

let ready: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const c = await getPool().connect();
      try {
        // Several cold instances can start together and "create table if not
        // exists" is not safe to run concurrently, so take a lock around it.
        await c.query("select pg_advisory_lock(727274)");
        try {
          await c.query(SCHEMA);
        } finally {
          await c.query("select pg_advisory_unlock(727274)");
        }
      } finally {
        c.release();
      }
    })().catch((e) => {
      ready = null; // let the next request try again rather than stay broken
      throw e;
    });
  }
  return ready;
}

/** Start of the current month in Sydney, which is the month a firm thinks in. */
export const MONTH_START_SQL = "date_trunc('month', now() at time zone 'Australia/Sydney') at time zone 'Australia/Sydney'";
