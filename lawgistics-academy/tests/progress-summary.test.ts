import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';

/**
 * The summary at the top of Progress, rendered for real. React refuses
 * react-dom/server under the react-server condition the unit tests run with,
 * so the rendering happens in a child process without it.
 */
function render(props: Record<string, unknown>): string {
  const script = `
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import * as M from './src/components/progress-details.tsx';
    const ProgressSummary = M.ProgressSummary ?? M.default.ProgressSummary;
    const overview = {
      level: { level: 3, name: 'Affidavit Wrangler', progressPercent: 40, xpForNextLevel: 120, nextLevelName: 'Adjournment Survivor', blurb: 'x' },
      currentStreak: 4, longestStreak: 9, weeklyXp: 80, totalXp: 940, dueCount: 0,
    };
    process.stdout.write(renderToStaticMarkup(createElement(ProgressSummary, { overview, ...${JSON.stringify(props)} })));
  `;
  return execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
    cwd: `${__dirname}/..`,
    env: { ...process.env, NODE_OPTIONS: '' },
  }).toString();
}

test('answers that could not be read are said, never shown as none', () => {
  const html = render({ overall: null, answered: 0, unreadable: true });
  assert.match(html, /could not be read just now/);
  assert.doesNotMatch(html, /none yet/);
});

test('somebody with no answers is told none yet; somebody with answers sees the share', () => {
  assert.match(render({ overall: null, answered: 0 }), /none yet/);
  const html = render({ overall: 85, answered: 49 });
  assert.match(html, /85%/);
  assert.match(html, /of 49 answered/);
});
