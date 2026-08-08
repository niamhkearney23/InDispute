import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import { buildCombinedSql } from '../scripts/build-combined-sql';

/**
 * The database contract.
 *
 * Every query in this app goes over PostgREST, which resolves table, column and
 * relationship names at runtime. A typo in a `.select()` string or an `.insert()`
 * key is invisible to TypeScript and to the compiler; it surfaces as a failed
 * request in production, on a code path that may only run for one user.
 *
 * This test closes that gap without a live database. It parses the SQL
 * migrations into a schema, walks the TypeScript AST for every Supabase query
 * chain, and checks each table, column, filter and embedded relation against it.
 */

const ROOT = path.join(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT, 'supabase/migrations');
const SOURCE_DIRS = [path.join(ROOT, 'src'), path.join(ROOT, 'scripts')];

/* -------------------------------------------------------------------------- */
/* Parse the migrations                                                       */
/* -------------------------------------------------------------------------- */

interface Schema {
  tables: Map<string, Set<string>>;
  /** table -> relation name -> target table. Covers both FK directions. */
  relations: Map<string, Map<string, string>>;
}

/** Line prefixes inside a CREATE TABLE body that are constraints, not columns. */
const NOT_A_COLUMN = /^(primary|foreign|unique|check|constraint|exclude)\b/i;

function parseMigrations(): Schema {
  const sql = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8'))
    .join('\n');

  // Strip line comments so they cannot be mistaken for columns.
  const clean = sql.replace(/^\s*--.*$/gm, '');

  const tables = new Map<string, Set<string>>();
  const relations = new Map<string, Map<string, string>>();
  const foreignKeys: Array<{ from: string; column: string; to: string }> = [];

  // `if not exists` is optional: later migrations guard their creates so the
  // whole set can be re-run, and a parser that missed those tables would go
  // quiet on exactly the queries it exists to check.
  const tableRe = /create table (?:if not exists )?public\.(\w+)\s*\(([\s\S]*?)\n\);/g;
  for (const match of clean.matchAll(tableRe)) {
    const table = match[1];
    const columns = new Set<string>();

    for (const rawLine of match[2].split('\n')) {
      const line = rawLine.trim();
      if (!line || NOT_A_COLUMN.test(line)) continue;

      const name = line.match(/^(\w+)\s/)?.[1];
      if (!name) continue;
      columns.add(name);

      const ref = line.match(/references public\.(\w+)/);
      if (ref) foreignKeys.push({ from: table, column: name, to: ref[1] });
    }

    tables.set(table, columns);
  }

  // Later migrations add columns rather than recreating the table, so the
  // CREATE TABLE statements alone are an incomplete picture of the schema.
  const alterRe = /alter table public\.(\w+)\s*([\s\S]*?);/g;
  for (const match of clean.matchAll(alterRe)) {
    const columns = tables.get(match[1]);
    if (!columns) continue;

    for (const add of match[2].matchAll(/add column (?:if not exists )?(\w+)([^,]*)/gi)) {
      columns.add(add[1]);
      const ref = add[2].match(/references public\.(\w+)/);
      if (ref) foreignKeys.push({ from: match[1], column: add[1], to: ref[1] });
    }
    for (const drop of match[2].matchAll(/drop column (?:if exists )?(\w+)/gi)) {
      columns.delete(drop[1]);
    }
  }

  // Views: take the select list and use each item's output name.
  const viewRe = /create view public\.(\w+)[\s\S]*?\sas\s*\n([\s\S]*?)\nfrom /g;
  for (const match of clean.matchAll(viewRe)) {
    const columns = new Set<string>();
    for (const item of splitTopLevel(match[2].replace(/^\s*select\s*/i, ''))) {
      const alias = item.match(/\bas\s+(\w+)\s*$/i)?.[1];
      const name = alias ?? item.trim().split('.').pop()?.replace(/\W/g, '');
      if (name) columns.add(name);
    }
    tables.set(match[1], columns);
  }

  // PostgREST exposes an embedded relation in both directions: from the table
  // holding the foreign key (named after the target table) and from the target
  // (named after the referencing table).
  for (const fk of foreignKeys) {
    if (!tables.has(fk.to)) continue;
    addRelation(relations, fk.from, fk.to, fk.to);
    addRelation(relations, fk.to, fk.from, fk.from);
  }

  return { tables, relations };
}

function addRelation(
  relations: Map<string, Map<string, string>>,
  from: string,
  name: string,
  to: string,
) {
  const entry = relations.get(from) ?? new Map<string, string>();
  entry.set(name, to);
  relations.set(from, entry);
}

/** Splits on commas that are not inside brackets. */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of input) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts.filter((p) => p.trim());
}

/* -------------------------------------------------------------------------- */
/* Walk the TypeScript for query chains                                       */
/* -------------------------------------------------------------------------- */

interface Usage {
  file: string;
  line: number;
  table: string;
  /** method -> string arguments / object keys */
  selects: string[];
  writeKeys: string[];
  filterColumns: string[];
}

const FILTER_METHODS = new Set([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'like',
  'ilike',
  'is',
  'in',
  'contains',
  'order',
]);

const WRITE_METHODS = new Set(['insert', 'update', 'upsert']);

/** Every object literal pushed into an array of this name, anywhere in the file. */
function keysPushedInto(arrayName: string, sourceFile: ts.SourceFile): string[] {
  const keys: string[] = [];

  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'push' &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === arrayName
    ) {
      for (const argument of node.arguments) {
        if (ts.isObjectLiteralExpression(argument)) keys.push(...objectKeys(argument));
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return keys;
}

function sourceFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) files.push(full);
    }
  };
  for (const dir of SOURCE_DIRS) walk(dir);
  return files;
}

function collectUsages(): Usage[] {
  const usages: Usage[] = [];

  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'from' &&
        node.arguments.length >= 1 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        const table = node.arguments[0].text;
        const usage: Usage = {
          file: path.relative(ROOT, file),
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          table,
          selects: [],
          writeKeys: [],
          filterColumns: [],
        };

        // Walk up the fluent chain collecting the methods applied to this query.
        let cursor: ts.Node = node;
        while (
          cursor.parent &&
          ts.isPropertyAccessExpression(cursor.parent) &&
          cursor.parent.parent &&
          ts.isCallExpression(cursor.parent.parent)
        ) {
          const method = cursor.parent.name.text;
          const call = cursor.parent.parent;
          const [first] = call.arguments;

          if (method === 'select' && first && ts.isStringLiteral(first)) {
            usage.selects.push(first.text);
          } else if (WRITE_METHODS.has(method) && first) {
            usage.writeKeys.push(...objectKeys(first, sourceFile));
          } else if (FILTER_METHODS.has(method) && first && ts.isStringLiteral(first)) {
            usage.filterColumns.push(first.text);
          }

          cursor = call;
        }

        usages.push(usage);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return usages;
}

/** Keys of an object literal, or of every element of an array literal / map. */
/**
 * Column names written by a query.
 *
 * The rows being written are not always an object literal sitting inside the
 * call. Batching several writes into one round trip means building an array
 * first and passing its name, so an identifier has to be followed back to the
 * `push` calls that filled it. Without that, moving a write into a batch would
 * silently drop it out of this check, which is the opposite of what a schema
 * contract is for.
 */
function objectKeys(node: ts.Node, sourceFile?: ts.SourceFile): string[] {
  if (ts.isIdentifier(node) && sourceFile) {
    return keysPushedInto(node.text, sourceFile);
  }

  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((prop) => {
      if (ts.isSpreadAssignment(prop)) return [];
      const name = prop.name;
      if (!name) return [];
      if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return [name.text];
      return [];
    });
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.flatMap((e) => objectKeys(e, sourceFile));
  }

  // `rows.map(row => ({ ... }))`, reach into the callback body.
  if (ts.isCallExpression(node)) {
    return node.arguments.flatMap((a) => objectKeys(a, sourceFile));
  }
  if (ts.isArrowFunction(node)) {
    return objectKeys(node.body, sourceFile);
  }
  if (ts.isParenthesizedExpression(node)) {
    return objectKeys(node.expression);
  }

  return [];
}

/* -------------------------------------------------------------------------- */
/* Checks                                                                     */
/* -------------------------------------------------------------------------- */

const schema = parseMigrations();
const usages = collectUsages();

function checkSelect(
  table: string,
  selectString: string,
  where: string,
  errors: string[],
) {
  for (const rawItem of splitTopLevel(selectString)) {
    const item = rawItem.trim();
    if (!item || item === '*') continue;

    const embedMatch = item.match(/^([\w:]+)(![\w.]+)?\s*\(([\s\S]*)\)$/);
    if (embedMatch) {
      // `alias:relation!inner(cols)`, the relation is after any alias colon.
      const relationName = embedMatch[1].split(':').pop()!;
      const target = schema.relations.get(table)?.get(relationName);

      if (!target) {
        errors.push(
          `${where}: "${table}" has no relation "${relationName}" (no foreign key connects them)`,
        );
        continue;
      }

      checkSelect(target, embedMatch[3], where, errors);
      continue;
    }

    const column = item.split(':').pop()!.split('->')[0].trim();
    if (!column) continue;

    if (!schema.tables.get(table)?.has(column)) {
      errors.push(`${where}: "${table}" has no column "${column}"`);
    }
  }
}

/* -------------------------------------------------------------------------- */

test('the migrations parse into a usable schema', () => {
  assert.ok(schema.tables.size >= 18, `only found ${schema.tables.size} tables`);

  // Spot-check the parser itself, so a silently-empty schema cannot make every
  // other check in this file pass vacuously.
  assert.ok(schema.tables.has('profiles'));
  assert.ok(schema.tables.get('profiles')?.has('daily_goal_minutes'));
  assert.ok(schema.tables.has('v_question_delivery'));
  assert.ok(schema.tables.get('v_question_delivery')?.has('question_version_id'));
  assert.ok(schema.tables.get('v_question_delivery')?.has('domain_name'));
  assert.ok(schema.tables.has('daily_facts'));
  assert.ok(schema.tables.get('daily_facts')?.has('why_it_matters'));

  // Columns introduced by a later migration's ALTER TABLE, not by CREATE TABLE.
  assert.ok(schema.tables.get('daily_facts')?.has('review_flagged'));
  assert.ok(schema.tables.get('question_versions')?.has('review_note'));
  assert.ok(schema.tables.get('question_versions')?.has('reviewed_by'));

  // And that constraint lines were not mistaken for columns.
  assert.ok(!schema.tables.get('question_versions')?.has('constraint'));
  assert.ok(!schema.tables.get('user_concept_mastery')?.has('primary'));

  // Relations, in both directions.
  assert.equal(schema.relations.get('questions')?.get('domains'), 'domains');
  assert.equal(
    schema.relations.get('questions')?.get('question_versions'),
    'question_versions',
  );
  assert.equal(schema.relations.get('user_concept_mastery')?.get('concepts'), 'concepts');
});

test('the AST walker actually found the query chains', () => {
  assert.ok(usages.length >= 40, `only found ${usages.length} query chains`);
  assert.ok(
    usages.some((u) => u.table === 'user_concept_mastery' && u.writeKeys.length > 5),
    'expected to find the mastery upsert with its column keys',
  );
  assert.ok(
    usages.some((u) => u.table === 'daily_facts' && u.selects.length > 0),
    'expected to find the daily fact query',
  );
});

test('every table queried in the app exists in the schema', () => {
  const errors = usages
    .filter((u) => !schema.tables.has(u.table))
    .map((u) => `${u.file}:${u.line}: unknown table "${u.table}"`);

  assert.deepEqual([...new Set(errors)], []);
});

test('every column selected in the app exists on its table', () => {
  const errors: string[] = [];

  for (const usage of usages) {
    if (!schema.tables.has(usage.table)) continue;
    for (const select of usage.selects) {
      checkSelect(usage.table, select, `${usage.file}:${usage.line}`, errors);
    }
  }

  assert.deepEqual([...new Set(errors)], []);
});

test('every column written by an insert, update or upsert exists on its table', () => {
  const errors: string[] = [];

  for (const usage of usages) {
    const columns = schema.tables.get(usage.table);
    if (!columns) continue;

    for (const key of usage.writeKeys) {
      if (!columns.has(key)) {
        errors.push(`${usage.file}:${usage.line}: "${usage.table}" has no column "${key}"`);
      }
    }
  }

  assert.deepEqual([...new Set(errors)], []);
});

test('every column filtered or ordered on exists on its table', () => {
  const errors: string[] = [];

  for (const usage of usages) {
    const columns = schema.tables.get(usage.table);
    if (!columns) continue;

    for (const raw of usage.filterColumns) {
      // `question_versions.is_current` filters through an embedded relation.
      const [head, ...rest] = raw.split('.');

      if (rest.length === 0) {
        if (!columns.has(head)) {
          errors.push(
            `${usage.file}:${usage.line}: "${usage.table}" has no column "${head}"`,
          );
        }
        continue;
      }

      const target = schema.relations.get(usage.table)?.get(head);
      if (!target) {
        errors.push(
          `${usage.file}:${usage.line}: "${usage.table}" has no relation "${head}"`,
        );
        continue;
      }
      if (!schema.tables.get(target)?.has(rest.join('.'))) {
        errors.push(
          `${usage.file}:${usage.line}: "${target}" has no column "${rest.join('.')}"`,
        );
      }
    }
  }

  assert.deepEqual([...new Set(errors)], []);
});

test('the one-paste SETUP.sql matches the migrations', () => {
  // SETUP.sql is committed rather than generated on demand, because the people
  // who most need it are the ones who will not run a script to produce it. That
  // makes it exactly the kind of file that silently goes stale.
  const committed = fs.readFileSync(path.join(ROOT, 'supabase/SETUP.sql'), 'utf8');

  assert.equal(
    committed,
    buildCombinedSql(),
    'supabase/SETUP.sql is out of date; run `npm run build:sql` and commit the result',
  );
});

test('learner-facing code never reads the tables that hold answer keys', () => {
  // `question_versions` carries correct_option_ids and the explanations. Only
  // server-side grading and the admin area may touch it; if a component under
  // (app)/ ever queries it, the answer key is one serialisation away from the
  // browser.
  const offenders = usages.filter(
    (u) =>
      (u.table === 'question_versions' || u.table === 'questions') &&
      u.file.includes('app/(app)'),
  );

  assert.deepEqual(
    offenders.map((u) => `${u.file}:${u.line}`),
    [],
    'learner-facing pages must go through v_question_delivery or the training service',
  );
});
