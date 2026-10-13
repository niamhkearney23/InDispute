/**
 * Shared pieces for the integration tests, which run against a throwaway
 * Supabase (Auth, the REST API, Storage and Supabase's Postgres) started by
 * `tools/integration/stack.sh up`. Nothing here can reach a real project: the
 * address and keys come from the file that script writes, and the tests
 * refuse to run against anything that is not on this machine.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ErasureDeps } from '../src/lib/account/erasure';

const ENV_FILE = path.join(__dirname, '..', 'tools', 'integration', '.env.it');

/**
 * Where the tests run.
 *
 * `local` (the default): the throwaway Supabase from stack.sh, which the
 * tests may stop and start to make Auth or Storage fail for real.
 *
 * `staging` (IT_TARGET=staging): a hosted Supabase project restored from a
 * backup and prepared with supabase/staging/prepare-staging.sql. Its address
 * and keys come from STAGING_SUPABASE_URL, STAGING_SUPABASE_ANON_KEY and
 * STAGING_SUPABASE_SERVICE_ROLE_KEY, set in the environment, never in a file
 * here. Before anything runs, `ensureTarget` asks the database whether it has
 * been marked as staging and refuses to go on unless it says yes, so the
 * tests cannot be pointed at the live project by mistake. Outages there are
 * made by failing one call in the app's own code, since a hosted service
 * cannot be stopped.
 */
export const TARGET: 'local' | 'staging' = process.env.IT_TARGET === 'staging' ? 'staging' : 'local';

function readLocalEnv(): Record<string, string> {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error('Start the integration Supabase first: tools/integration/stack.sh up');
  }
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const at = line.indexOf('=');
    if (at > 0) env[line.slice(0, at)] = line.slice(at + 1);
  }
  return env;
}

function stagingEnv(): Record<string, string> {
  const need = ['STAGING_SUPABASE_URL', 'STAGING_SUPABASE_ANON_KEY', 'STAGING_SUPABASE_SERVICE_ROLE_KEY'];
  const missing = need.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`IT_TARGET=staging needs ${missing.join(', ')} in the environment`);
  const url = process.env.STAGING_SUPABASE_URL!.replace(/\/+$/, '');
  if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url)) {
    throw new Error('STAGING_SUPABASE_URL must be a hosted project address, https://<ref>.supabase.co');
  }
  const live = process.env.PRODUCTION_SUPABASE_URL?.replace(/\/+$/, '');
  if (live && live === url) throw new Error('STAGING_SUPABASE_URL is the live project. Refusing.');
  return {
    SUPABASE_IT_URL: url,
    SUPABASE_IT_ANON_KEY: process.env.STAGING_SUPABASE_ANON_KEY!,
    SUPABASE_IT_SERVICE_KEY: process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY!,
  };
}

export const IT = TARGET === 'staging' ? stagingEnv() : readLocalEnv();
if (TARGET === 'local' && !/^http:\/\/127\.0\.0\.1:/.test(IT.SUPABASE_IT_URL ?? '')) {
  throw new Error('Local integration tests only run against a Supabase on this machine.');
}
export const URL = IT.SUPABASE_IT_URL;
export const ANON_KEY = IT.SUPABASE_IT_ANON_KEY;
export const SERVICE_KEY = IT.SUPABASE_IT_SERVICE_KEY;

let checked: Promise<void> | null = null;
/** Refuses to run unless the database says it is staging (or is the local stack). */
export function ensureTarget(): Promise<void> {
  if (TARGET === 'local') return Promise.resolve();
  checked ??= (async () => {
    const { data, error } = await service().rpc('is_staging');
    if (error || data !== true) {
      throw new Error(
        'This database has not been marked as staging (supabase/staging/prepare-staging.sql). Refusing to run.',
      );
    }
  })();
  return checked;
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

export function service(): SupabaseClient {
  return createClient(URL, SERVICE_KEY, noSession);
}

export function anon(): SupabaseClient {
  return createClient(URL, ANON_KEY, noSession);
}

/** A client that sends the given access token, as a browser holding it would. */
export function asToken(accessToken: string): SupabaseClient {
  return createClient(URL, ANON_KEY, {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** SQL as the postgres user, which is what the Supabase SQL editor runs as. Local only. */
export function sql(query: string): string {
  if (TARGET !== 'local') throw new Error('sql() is only for the local stack');
  return execFileSync(
    'psql',
    [IT.SUPABASE_IT_DB_URL, '-v', 'ON_ERROR_STOP=1', '-At', '-c', query],
    { encoding: 'utf8', env: { ...process.env, PGOPTIONS: '-c client_min_messages=warning' } },
  ).trim();
}

/** Stop or start one of the Supabase services, to see what happens when it fails. */
export function service_container(name: 'auth' | 'storage' | 'rest', action: 'stop' | 'start') {
  if (TARGET !== 'local') throw new Error('Services can only be stopped on the local stack');
  execFileSync('docker', [action, `lawg-it-${name}`], { stdio: 'ignore' });
}

export async function waitUntilUp(name: 'auth' | 'storage' | 'rest') {
  if (TARGET !== 'local') return;
  const probe = { auth: '/auth/v1/health', storage: '/storage/v1/status', rest: '/rest/v1/' }[name];
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${URL}${probe}`, { headers: { apikey: ANON_KEY } });
      if (res.ok) return;
    } catch {
      // not yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${name} did not come back`);
}

export const PASSWORD = 'It-password-1234567';

export interface Person {
  id: string;
  email: string;
  client: SupabaseClient;
  accessToken: string;
  refreshToken: string;
}

let counter = 0;

/**
 * A real account: created through Auth, signed in with a password, and given
 * a role the way an administrator grants one (the service role writes the
 * profile flag, as the Staff page's server action does).
 */
export async function person(
  role: 'learner' | 'coach' | 'admin' | 'firm_admin' = 'learner',
  country: 'AU' | 'MY' = 'AU',
): Promise<Person> {
  counter += 1;
  const email = `${role}-${Date.now()}-${counter}@example.test`;
  const svc = service();
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: `${role} ${counter}`, country },
  });
  if (error) throw error;
  const id = data.user.id;
  if (role !== 'learner') {
    const flags =
      role === 'admin' ? { is_admin: true } : role === 'coach' ? { is_coach: true } : { is_firm_admin: true };
    const { error: roleError } = await svc.from('profiles').update(flags).eq('id', id);
    if (roleError) throw roleError;
  }
  return signIn(email, id);
}

export async function signIn(email: string, id: string): Promise<Person> {
  const client = anon();
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return {
    id,
    email,
    client,
    accessToken: data.session!.access_token,
    refreshToken: data.session!.refresh_token,
  };
}

/** The six-digit code an authenticator app shows for a base32 secret (RFC 6238). */
export function totp(secretBase32: string, at = Date.now()): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of secretBase32.replace(/=+$/, '').toUpperCase()) {
    const v = alphabet.indexOf(ch);
    if (v < 0) continue;
    bits += v.toString(2).padStart(5, '0');
  }
  const bytes = Buffer.alloc(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const hmac = crypto.createHmac('sha1', bytes).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, '0');
}

/**
 * How to start Chromium for the browser tests. Against hosted staging the
 * browser reaches Supabase through this machine's outbound proxy, and the
 * app on 127.0.0.1 directly.
 */
export function browserOptions() {
  const proxy = process.env.HTTPS_PROXY;
  return {
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    ...(TARGET === 'staging' && proxy ? { proxy: { server: proxy, bypass: '127.0.0.1,localhost' } } : {}),
  };
}

/**
 * Auth or Storage failing part way through a deletion. On the local stack the
 * service is really stopped. On hosted staging, which cannot be stopped, the
 * one call the app makes to that service fails instead, with everything else
 * real; the returned deps are what the deletion runs with during the outage.
 */
export function outage(kind: 'auth' | 'storage', real: ErasureDeps): { deps: ErasureDeps; end: () => Promise<void> } {
  if (TARGET === 'local') {
    service_container(kind, 'stop');
    return {
      deps: real,
      end: async () => {
        service_container(kind, 'start');
        await waitUntilUp(kind);
      },
    };
  }
  const down = async () => {
    throw new Error(`${kind} is not answering (injected for the staging run)`);
  };
  const deps: ErasureDeps =
    kind === 'auth'
      ? { ...real, closeSignIn: down }
      : { ...real, listFolder: down, removeFiles: down };
  return { deps, end: async () => {} };
}
