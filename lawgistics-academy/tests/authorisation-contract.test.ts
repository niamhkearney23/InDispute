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
 * invoke one directly, with any arguments they like — the form on the page is
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
    'answerQuestion',
    'beginSession',
    'completeSetup',
    'createFact',
    'createQuestion',
    'finishSession',
    'publishAllVerified',
    'recordReviewDecision',
    'saveOnboarding',
    'transitionFact',
    'transitionQuestion',
    'updateFact',
    'updateQuestion',
    'withdrawAllUnverified',
  ]);
});

test('every server action establishes who the caller is', () => {
  const unguarded = ACTIONS.filter(
    (action) => !AUTH_CALLS.some((call) => action.body.includes(`${call}(`)),
  ).map((a) => `${a.file}:${a.line} ${a.name}`);

  assert.deepEqual(
    unguarded,
    [],
    'each of these is a public endpoint reachable without the UI',
  );
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
