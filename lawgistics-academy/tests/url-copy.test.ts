import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import {
  asLinkFailure,
  classifyLinkFailure,
  LINK_FAILURES,
} from '../src/lib/auth/link-failures';

/**
 * The app never says words the URL chose.
 *
 * A page that renders `searchParams.error` puts a stranger in charge of what
 * the app appears to be telling its user, on the app's own domain, in the app's
 * own typeface. React escapes the markup, so this is not script injection; it
 * is worse in one specific way, because the text looks entirely legitimate.
 * "Your account is suspended, contact ..." is a working phishing page that
 * needs no compromise at all, only a link.
 *
 * So the URL may select a message, never supply one.
 */

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'src/app');

function pageFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...pageFiles(full));
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

/** Identifiers destructured out of an awaited `searchParams`. */
function searchParamNames(text: string, file: string): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const names: string[] = [];

  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isAwaitExpression(node.initializer) &&
      node.initializer.expression.getText().includes('searchParams') &&
      ts.isObjectBindingPattern(node.name)
    ) {
      for (const element of node.name.elements) {
        names.push((element.propertyName ?? element.name).getText());
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return names;
}

test('no page renders a value taken straight from searchParams', () => {
  const offenders: string[] = [];

  for (const file of pageFiles(APP)) {
    const text = fs.readFileSync(file, 'utf8');
    const names = searchParamNames(text, file);
    if (names.length === 0) continue;

    // Everything after the component's `return (` is what reaches the screen.
    const returnAt = text.indexOf('return (');
    if (returnAt === -1) continue;
    const markup = text.slice(returnAt);

    for (const name of names) {
      // Interpolating the value is the problem. Using it as a condition, as in
      // `{created ? <Notice>Draft created.</Notice> : null}`, is exactly right:
      // the URL selects, the copy is ours.
      //
      // So flag the three shapes that put the value itself on the screen, and
      // deliberately not `{name ? …}`. A branch that renders it has to write
      // `{name}` somewhere inside, which the first pattern already catches.
      const interpolated = new RegExp(`\\{\\s*${name}\\s*(\\}|\\?\\?|\\|\\|)`);
      const templated = new RegExp(`\\$\\{\\s*${name}\\s*\\}`);

      if (interpolated.test(markup) || templated.test(markup)) {
        offenders.push(`${path.relative(ROOT, file)} renders "${name}" from the URL`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    'map the parameter to fixed copy instead, as src/lib/auth/link-failures.ts does',
  );
});

test('the walker actually finds pages that read searchParams', () => {
  // Otherwise the check above passes because it examined nothing.
  const reading = pageFiles(APP).filter(
    (file) => searchParamNames(fs.readFileSync(file, 'utf8'), file).length > 0,
  );
  assert.ok(reading.length >= 2, `only ${reading.length} pages read searchParams`);
});

test('only known codes are accepted from a URL', () => {
  assert.equal(asLinkFailure('expired'), 'expired');
  assert.equal(asLinkFailure('used'), 'used');

  // Anything else, including an attempt to smuggle text through, is discarded.
  assert.equal(asLinkFailure('Your account is suspended, call 1800 555 555'), null);
  assert.equal(asLinkFailure('constructor'), null);
  assert.equal(asLinkFailure('__proto__'), null);
  assert.equal(asLinkFailure('toString'), null);
  assert.equal(asLinkFailure(''), null);
  assert.equal(asLinkFailure(undefined), null);
});

test('Supabase messages are classified into copy we wrote', () => {
  assert.equal(classifyLinkFailure('Email link is invalid or has expired'), 'expired');
  assert.equal(classifyLinkFailure('Token has already been used'), 'used');
  assert.equal(classifyLinkFailure('invalid request: both auth code and code verifier should be non-empty'), 'mismatch');
  assert.equal(classifyLinkFailure('Invalid token'), 'invalid');
  assert.equal(classifyLinkFailure('something nobody anticipated'), 'unknown');

  // Every code resolves to real copy, and none of it is empty.
  for (const [code, copy] of Object.entries(LINK_FAILURES)) {
    assert.ok(copy.length > 30, `copy for "${code}" is too short to be useful`);
    assert.ok(copy.trim().endsWith('.'), `copy for "${code}" should be a sentence`);
  }
});
