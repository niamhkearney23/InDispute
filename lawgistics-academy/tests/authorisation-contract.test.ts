import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import { GOAL_TO_DOMAIN_SLUGS, IMPROVEMENT_GOALS } from '../src/lib/types';
import { DOMAINS } from '../src/content/seed/taxonomy';

/**
 * Authorisation, checked structurally.
 *
 * A server action is a public HTTP endpoint. Anyone who can reach the app can
 * invoke one directly, with any arguments they like; the form on the page is
 * not the boundary. Several of these actions use the service-role client, which
 * bypasses Row Level Security entirely, so a missing check is not a degraded
 * experience but an open door.
 *
 * Rather than trust a reviewer to notice a new action added without a check,
 * assert it: every exported function in a `'use server'` module must establish
 * who the caller is before doing anything else.
 */

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const AUTH_CALLS = ['checkAdmin', 'requireAdmin', 'getCurrentUser'];

/**
 * Actions whose caller is identified by a capability rather than a session.
 *
 * There is exactly one, and it has to exist: somebody taking up an invitation
 * does not have an account yet, so there is no session to check. What stands in
 * its place is the invitation token, which is 32 bytes of CSPRNG output stored
 * only as a SHA-256 hash, single use, and expiring. The entry below names the
 * function that must verify it, and the test asserts the action actually calls
 * that function rather than merely being on the list.
 *
 * This is a list, not a flag, so adding to it is a visible act in a diff.
 */
const CAPABILITY_AUTHENTICATED: Record<string, string> = {
  join: 'acceptInvitation(',
};

/** Source with block and line comments removed. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function findFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findFiles(full));
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

interface Action {
  file: string;
  name: string;
  line: number;
  body: string;
}

function serverActions(): Action[] {
  const actions: Action[] = [];

  for (const file of findFiles(SRC)) {
    const text = fs.readFileSync(file, 'utf8');
    // Only modules whose first statement is the directive.
    if (!/^\s*['"]use server['"]/.test(text)) continue;

    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

    for (const statement of sourceFile.statements) {
      if (!ts.isFunctionDeclaration(statement)) continue;
      const isExported = statement.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword,
      );
      if (!isExported || !statement.name) continue;

      actions.push({
        file: path.relative(ROOT, file),
        name: statement.name.text,
        line: sourceFile.getLineAndCharacterOfPosition(statement.getStart()).line + 1,
        body: statement.body?.getText() ?? '',
      });
    }
  }

  return actions;
}

const ACTIONS = serverActions();

test('the server actions were actually found', () => {
  const names = ACTIONS.map((a) => a.name).sort();

  // If this list stops matching, the walker has broken and every check below
  // would pass on an empty set.
  assert.deepEqual(names, [
    'acknowledge',
    'answerQuestion',
    'beginModule',
    'beginSession',
    'completeSetup',
    'confirm',
    'createFact',
    'createQuestion',
    'decide',
    'declare',
    'finishSession',
    'invite',
    'join',
    'loadNewContent',
    'publishAllVerified',
    'recordReviewDecision',
    'restoreAllWithdrawn',
    'revoke',
    'saveFirmModule',
    'saveOnboarding',
    'saveStep',
    'setStartDate',
    'transitionFact',
    'transitionQuestion',
    'updateFact',
    'updateQuestion',
    'withdrawAllUnverified',
  ]);
});

test('every server action establishes who the caller is', () => {
  const unguarded = ACTIONS.filter((action) => {
    if (AUTH_CALLS.some((call) => action.body.includes(`${call}(`))) return false;
    // A capability-authenticated action counts as guarded only if it actually
    // calls the verifier named for it. Being on the list is not enough.
    const verifier = CAPABILITY_AUTHENTICATED[action.name];
    return !(verifier && action.body.includes(verifier));
  }).map((a) => `${a.file}:${a.line} ${a.name}`);

  assert.deepEqual(
    unguarded,
    [],
    'each of these is a public endpoint reachable without the UI',
  );
});

test('the invitation action cannot hand out anything but an ordinary account', () => {
  // The joining path is the only way into this app without an existing session,
  // so it is the one place where a stray write would be reachable by anybody
  // holding a link. It must not touch privileges, and it must not take the
  // identity of the new account from the form: both come from the invitation.
  const joining = ACTIONS.find((a) => a.name === 'join');
  assert.ok(joining, 'the join action should exist');

  const source = fs.readFileSync(
    path.join(ROOT, 'src/lib/onboarding/invitations.ts'),
    'utf8',
  );

  // Comments stripped, for the same reason as in the firm tests: this file's
  // prose explains that it never grants rights, so a scan of the raw text finds
  // the word in the sentence promising it is absent and fails for the wrong
  // reason. Asserting about the code means reading the code.
  const code = stripComments(source);
  const actionCode = stripComments(joining.body);

  for (const forbidden of ['is_admin', 'isAdmin']) {
    assert.ok(
      !actionCode.includes(forbidden),
      `the join action mentions ${forbidden}`,
    );
    assert.ok(
      !code.includes(forbidden),
      `the invitation service mentions ${forbidden}: joining must not be able to grant rights`,
    );
  }

  // The email is the firm's, not the form's. If this ever read an address from
  // the request, whoever held a link could join as somebody else.
  assert.ok(
    !/formData\.get\(['"]email['"]\)/.test(joining.body),
    'the join action must take the email from the invitation, never from the form',
  );
  assert.match(
    source,
    /email: invitation\.email/,
    'the account is created for the address the firm invited',
  );
});

test('an invitation token is stored hashed and never in the clear', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'src/lib/onboarding/invitations.ts'),
    'utf8',
  );

  assert.match(source, /createHash\('sha256'\)/, 'tokens are hashed with SHA-256');
  assert.match(
    source,
    /token_hash: hashToken\(token\)/,
    'the row stores the hash, not the token',
  );
  assert.ok(
    !/token: token[,\s}]/.test(source.replace(/return \{ token, error: null \};/, '')),
    'the token is not written to any row',
  );
  assert.match(
    source,
    /randomBytes\(TOKEN_BYTES\)/,
    'the token comes from the system CSPRNG rather than from Math.random or a uuid',
  );
  // The lookup must be by hash. Selecting on a plain token column would mean
  // the token had been stored somewhere in the first place.
  assert.match(source, /\.eq\('token_hash', hashToken\(token\)\)/);
});

test('every admin server action requires admin specifically, not merely a session', () => {
  const adminActions = ACTIONS.filter((a) => a.file.includes('app/admin'));
  assert.ok(adminActions.length >= 6, `only found ${adminActions.length} admin actions`);

  const weak = adminActions
    .filter((a) => !a.body.includes('checkAdmin(') && !a.body.includes('requireAdmin('))
    .map((a) => `${a.file}:${a.line} ${a.name}`);

  assert.deepEqual(weak, [], 'a signed-in learner is not an administrator');
});

test('the admin authorisation check is the first thing an admin action does', () => {
  // A check that runs after the write has already happened is not a check.
  const late = ACTIONS.filter((a) => a.file.includes('app/admin'))
    .filter((action) => {
      const guardAt = action.body.search(/(checkAdmin|requireAdmin)\(/);
      const writeAt = action.body.search(/createServiceClient\(/);
      return writeAt !== -1 && guardAt > writeAt;
    })
    .map((a) => `${a.file}:${a.line} ${a.name}`);

  assert.deepEqual(late, []);
});

test('the first-run setup action cannot be used to seize admin on a live install', () => {
  // completeSetup is the only action in the app that grants administrator
  // rights, and it deliberately sits outside /admin because it is the bootstrap.
  // That makes its own guards the whole of its security, so assert them.
  const setup = ACTIONS.find((a) => a.name === 'completeSetup');
  assert.ok(setup, 'completeSetup not found');

  assert.ok(
    setup.body.includes('getCurrentUser('),
    'must require a signed-in account, so there is a named user to grant rights to',
  );
  assert.ok(
    setup.body.includes('status.adminExists'),
    'must close permanently once an administrator exists',
  );
  assert.ok(
    setup.body.includes('SETUP_TOKEN'),
    'must honour SETUP_TOKEN so a public deployment can be locked down',
  );
  assert.ok(
    setup.body.indexOf('getCurrentUser(') < setup.body.indexOf('createServiceClient('),
    'must establish the caller before reaching for the service-role client',
  );
});

test('the service-role client is never imported into a client component', () => {
  const offenders: string[] = [];

  for (const file of findFiles(SRC)) {
    const text = fs.readFileSync(file, 'utf8');
    if (!/^\s*['"]use client['"]/.test(text)) continue;
    if (/supabase\/service|createServiceClient/.test(text)) {
      offenders.push(path.relative(ROOT, file));
    }
  }

  assert.deepEqual(offenders, []);
});

test('the service-role key is never exposed under a NEXT_PUBLIC_ name', () => {
  const offenders: string[] = [];

  for (const file of [...findFiles(SRC), ...findFiles(path.join(ROOT, 'scripts'))]) {
    const text = fs.readFileSync(file, 'utf8');
    if (/NEXT_PUBLIC_[A-Z_]*SERVICE/.test(text) || /NEXT_PUBLIC_[A-Z_]*SECRET/.test(text)) {
      offenders.push(path.relative(ROOT, file));
    }
  }

  assert.deepEqual(offenders, []);

  const example = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
  assert.ok(
    !/NEXT_PUBLIC_SUPABASE_SERVICE/.test(example),
    '.env.example must not suggest publishing the service role key',
  );
});

test('privileged modules are marked server-only', () => {
  const mustBeServerOnly = [
    'src/lib/supabase/service.ts',
    'src/lib/supabase/server.ts',
    'src/lib/training/service.ts',
    'src/lib/learning/selection.ts',
    'src/lib/admin/guard.ts',
    'src/lib/facts/service.ts',
    'src/lib/ai/provider.ts',
    'src/lib/ai/legal-coach.ts',
  ];

  for (const relative of mustBeServerOnly) {
    const text = fs.readFileSync(path.join(ROOT, relative), 'utf8');
    assert.ok(
      text.includes("import 'server-only'"),
      `${relative} must import 'server-only' so it can never be bundled for the browser`,
    );
  }
});

test('every onboarding goal maps to domains that actually exist', () => {
  const domainSlugs = new Set(DOMAINS.map((d) => d.slug));

  for (const goal of IMPROVEMENT_GOALS) {
    const mapped = GOAL_TO_DOMAIN_SLUGS[goal.slug];
    assert.ok(mapped, `goal "${goal.slug}" has no domain mapping`);
    assert.ok(mapped.length > 0, `goal "${goal.slug}" maps to nothing`);

    for (const slug of mapped) {
      assert.ok(domainSlugs.has(slug), `goal "${goal.slug}" maps to unknown domain "${slug}"`);
    }
  }
});
