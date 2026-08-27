/* The two marked exercises, driven end to end against a stubbed marker.

   Written after the drafting exercise came back "Something went wrong (504)"
   on a letter that was perfectly good. Nothing was wrong with the letter and
   nothing was wrong with the rubric. The request was sent buffered, so no
   bytes came back until the model had finished writing, the serverless
   function hit its sixty second ceiling first, and the learner was handed a
   status code and left to guess whether they had done something wrong.

   That failure was invisible to every check we had. The device sweep renders
   the page and the accessibility sweep audits it, but neither one presses the
   button, so the entire marking path, the part the exercise exists for, was
   covered by nothing at all.

   This stubs /claude and drives the real pages through four shapes:

     1. a normal streamed answer,
     2. a stream that stops part way, which is what running out of time looks
        like from the browser, and which must produce a mark rather than an
        error,
     3. a marker that fails both times, which must say something a person can
        act on rather than repeating a status code,
     4. a deployment still running the old buffered function, which must keep
        working rather than breaking on the way past.

   It also plants a thinking block in the stream carrying text that is not
   valid JSON. Adaptive thinking emits those, they are the model working
   rather than the model's answer, and if they ever reach the parser every
   submission comes back garbled.

   Serve the site first, then point this at the port:

     python3 -m http.server 8466 --directory ../lawgistics-site
     node tools/site-qa/marker-check.mjs 8466

   Exits non-zero when anything is wrong. */

import { chromium } from 'playwright';

const PORT = process.argv[2] || '8466';
const SITE = `http://localhost:${PORT}`;

/* A complete answer for each page, matching that page's schema. If a rubric
   changes and this is not changed with it, the page fails to render and this
   check says so, which is the point. */
const ANSWERS = {
  drafting: {
    scores: {
      who_and_what: { score: 8, evidence: 'e', improvement: 'i' },
      basis_of_claim: { score: 16, evidence: 'e', improvement: 'i' },
      the_demand: { score: 15, evidence: 'e', improvement: 'i' },
      consequences: { score: 11, evidence: 'e', improvement: 'i' },
      tone: { score: 12, evidence: 'e', improvement: 'i' },
      structure: { score: 8, evidence: 'e', improvement: 'i' },
      accuracy: { score: 9, evidence: 'e', improvement: 'i' },
    },
    total: 79,
    band: 'Solid',
    one_line_verdict: 'A workmanlike letter.',
    states_the_basis: true,
    deadline_is_workable: true,
    would_a_partner_sign: false,
    strengths: ['Clear demand'],
    development: ['Give a date'],
    feedback_to_learner: 'Good start.',
  },
};

/* Anthropic's wire format, close enough that a page which copes with this
   copes with the real thing. The thinking delta is deliberately not JSON. */
function sse(text, { finish = true } = {}) {
  const out = [
    'data: {"type":"message_start","message":{"id":"m"}}\n\n',
    'data: {"type":"content_block_delta","index":0,' +
      '"delta":{"type":"thinking_delta","thinking":"this is not json and must never be parsed"}}\n\n',
  ];
  for (let i = 0; i < text.length; i += 90) {
    out.push(
      'data: ' +
        JSON.stringify({
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: text.slice(i, i + 90) },
        }) +
        '\n\n',
    );
  }
  if (finish) {
    out.push('data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n');
    out.push('data: {"type":"message_stop"}\n\n');
  }
  return out.join('');
}

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);

const failures = [];

async function drive({ page: path, input, answer, handler }) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  const requests = [];
  await page.route('**/claude', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    requests.push({
      stream: body.stream,
      effort: body.output_config && body.output_config.effort,
      model: body.model,
    });
    await handler(route, requests.length, answer);
  });

  await page.goto(`${SITE}${path}`, { waitUntil: 'networkidle' });
  await page.fill(input.selector, input.text);
  await page.click('#submitBtn');

  // Long enough for a retry to be attempted and rendered. Everything here is
  // stubbed, so nothing is actually waiting on a model.
  await page.waitForTimeout(3000);

  const shown = await page.evaluate(() => {
    const score = document.querySelector('.score-big');
    const err = document.querySelector('#subMsg');
    return {
      score: score && score.offsetParent ? score.textContent.replace(/\s+/g, ' ').trim() : null,
      error: err && err.classList.contains('show') ? err.textContent.trim() : null,
    };
  });

  await page.close();
  return { requests, ...shown, pageErrors };
}

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    console.log(`  FAIL  ${label}: ${detail}`);
    failures.push(`${label}: ${detail}`);
  }
}

const DRAFT = { selector: '#draft', text: 'word '.repeat(120) };
const ANSWER = JSON.stringify(ANSWERS.drafting);

console.log('drafting.html');

{
  const r = await drive({
    page: '/drafting.html',
    input: DRAFT,
    answer: ANSWER,
    handler: (route) =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: sse(ANSWER),
      }),
  });
  check('a streamed answer is marked', r.score === '79/100', `saw ${r.score}, error ${r.error}`);
  check('the request asked for a stream', r.requests[0] && r.requests[0].stream === true,
    JSON.stringify(r.requests[0]));
  check('it marks on the model that reasons best',
    r.requests[0] && r.requests[0].model === 'claude-opus-5', JSON.stringify(r.requests[0]));
  check('thinking never reaches the parser', r.error === null, String(r.error));
  check('no page errors', r.pageErrors.length === 0, r.pageErrors.join('; '));
}

{
  const r = await drive({
    page: '/drafting.html',
    input: DRAFT,
    answer: ANSWER,
    handler: (route, n) =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: n === 1 ? sse(ANSWER.slice(0, 200), { finish: false }) : sse(ANSWER),
      }),
  });
  check('a cut-off stream still produces a mark', r.score === '79/100',
    `saw ${r.score}, error ${r.error}`);
  check('it was marked twice', r.requests.length === 2, `${r.requests.length} requests`);
  check('the second attempt stepped the effort down',
    r.requests[1] && r.requests[1].effort === 'medium', JSON.stringify(r.requests[1]));
}

{
  const r = await drive({
    page: '/drafting.html',
    input: DRAFT,
    answer: ANSWER,
    handler: (route) => route.fulfill({ status: 504, contentType: 'application/json', body: '{}' }),
  });
  check('two failures say something actionable',
    r.error !== null && /shorter/i.test(r.error) && !/504/.test(r.error),
    String(r.error));
  check('nothing is scored when nothing was marked', r.score === null, String(r.score));
}

{
  const r = await drive({
    page: '/drafting.html',
    input: DRAFT,
    answer: ANSWER,
    handler: (route, n, answer) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: answer }] }),
      }),
  });
  check('an older buffered function still works', r.score === '79/100',
    `saw ${r.score}, error ${r.error}`);
}

await browser.close();

console.log('');
if (failures.length) {
  console.log(`${failures.length} problem${failures.length === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('the marking path works in all four shapes');
