#!/usr/bin/env node
// =====================================================================
// build-site.js  --  generate the Court Update case-lookup site
// =====================================================================
//
// Reads every edition registered in COURT_UPDATE_EDITIONS (CourtUpdate.gs
// is plain JS, so it evaluates cleanly under Node) and writes a single
// self-contained page to docs/index.html: no dependencies, no network,
// client-side search and filters over every case ever published.
//
//   node court-updates/build-site.js
//
// Re-run after adding an edition, commit docs/index.html, done. Serve
// the docs/ folder from GitHub Pages or any static host.
// =====================================================================

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'CourtUpdate.gs'), 'utf8');
(0, eval)(src); // indirect eval: runs in global scope, so the .gs var declarations become globals
const COURT_UPDATE_EDITIONS = globalThis.COURT_UPDATE_EDITIONS;

// Newest edition first, cases in published order within an edition.
const cases = [];
[...COURT_UPDATE_EDITIONS].reverse().forEach((ed) => {
  ed.cases.forEach((c) => {
    cases.push({
      hook: c.hook,
      area: c.area || 'Other',
      tags: c.tags || [],
      name: c.name,
      citation: c.citation,
      story: c.story,
      courtSaid: c.courtSaid,
      whyYouCare: c.whyYouCare,
      outcome: c.outcome,
      edition: ed.date,
      court: /court of appeal/i.test(c.citation) ? 'Court of Appeal' : 'High Court'
    });
  });
});

const areas = [...new Set(cases.map((c) => c.area))].sort();
const editions = [...new Set(cases.map((c) => c.edition))];

const DATA = JSON.stringify({ cases, areas, editions }).replace(/</g, '\\u003c');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Court Update · Case Lookup — Thomas Philip</title>
<style>
  :root {
    --navy: #0F1720; --gold: #B89554; --cream: #F5F3EF; --ink: #2c3440;
    --paper: #ffffff; --line: #EAE5D9; --muted: #8a8578;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--cream); color: var(--ink); font-family: Georgia, 'Times New Roman', serif; }
  .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

  header { background: var(--navy); text-align: center; padding: 40px 20px 34px; }
  header .firm { color: var(--gold); font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px; }
  header h1 { color: #fff; font-size: 30px; font-weight: normal; letter-spacing: 1px; }
  header .rule { width: 40px; height: 2px; background: var(--gold); margin: 16px auto; }
  header .sub { color: #C8C2B4; font-style: italic; font-size: 15px; }

  .controls { position: sticky; top: 0; z-index: 5; background: var(--paper);
    border-bottom: 1px solid var(--line); padding: 16px 20px; box-shadow: 0 2px 10px rgba(15,23,32,.05); }
  .controls-inner { max-width: 860px; margin: 0 auto; }
  .search { width: 100%; font-size: 16px; padding: 12px 16px; border: 1px solid #d8d2c4;
    border-radius: 8px; background: #FBFAF7; color: var(--ink); font-family: inherit; }
  .search:focus { outline: 2px solid var(--gold); border-color: var(--gold); }
  .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }
  .chip { font-size: 13px; padding: 5px 14px; border-radius: 16px; border: 1px solid #ddd6c6;
    background: #F7F4EC; color: #6B5B33; cursor: pointer; }
  .chip.on { background: var(--navy); color: #fff; border-color: var(--navy); }
  .chip:hover:not(.on) { border-color: var(--gold); }
  select { font-size: 13px; padding: 5px 10px; border-radius: 8px; border: 1px solid #ddd6c6;
    background: #F7F4EC; color: #6B5B33; }
  .count { font-size: 13px; color: var(--muted); margin-left: auto; }

  main { max-width: 860px; margin: 0 auto; padding: 24px 20px 60px; }
  .card { background: var(--paper); border: 1px solid var(--line); border-radius: 10px;
    margin-bottom: 16px; overflow: hidden; }
  .card summary { list-style: none; cursor: pointer; padding: 22px 24px; }
  .card summary::-webkit-details-marker { display: none; }
  .card summary:hover { background: #FDFCF9; }
  .meta { display: flex; align-items: baseline; gap: 10px; font-size: 12px; color: var(--muted); margin-bottom: 8px; }
  .outcome { font-weight: 700; letter-spacing: 1px; margin-left: auto; }
  .hook { font-size: 20px; font-weight: 700; color: var(--navy); line-height: 1.3; margin-bottom: 8px; }
  .case-name { font-style: italic; font-size: 14px; color: #777; }
  .citation { font-size: 12px; color: #999; line-height: 1.5; margin-top: 2px; }
  .tagrow { margin-top: 10px; }
  .tag { display: inline-block; background: #F0EBDF; color: #6B5B33; border: 1px solid #E0D6C0;
    border-radius: 12px; padding: 2px 10px; font-size: 11px; margin: 0 6px 4px 0; letter-spacing: .3px; }
  .body { padding: 0 24px 24px; border-top: 1px solid var(--line); }
  .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin: 18px 0 4px; }
  .text { font-size: 15px; line-height: 1.7; }
  .open-hint { font-size: 12px; color: var(--gold); margin-top: 10px; }
  details[open] .open-hint { display: none; }

  .empty { text-align: center; color: var(--muted); padding: 60px 0; font-style: italic; }
  footer { text-align: center; font-size: 11px; color: #999; padding: 30px 20px 50px; line-height: 1.6; }
  footer .firmline { letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  mark { background: #F3E5C3; color: inherit; padding: 0 1px; }
  @media (max-width: 600px) { .hook { font-size: 18px; } header h1 { font-size: 24px; } }
</style>
</head>
<body>

<header>
  <div class="firm sans">Thomas Philip</div>
  <h1>COURT UPDATE · CASE LOOKUP</h1>
  <div class="rule"></div>
  <div class="sub">Every case we&rsquo;ve covered, searchable</div>
</header>

<div class="controls sans">
  <div class="controls-inner">
    <input id="q" class="search" type="search"
      placeholder="Search cases — try &ldquo;security for costs&rdquo;, &ldquo;nominee&rdquo;, &ldquo;winding-up&rdquo;, a party name&hellip;"
      autocomplete="off">
    <div class="filters">
      <div id="areaChips"></div>
      <select id="court">
        <option value="">All courts</option>
        <option>Court of Appeal</option>
        <option>High Court</option>
      </select>
      <select id="edition"><option value="">All editions</option></select>
      <span class="count" id="count"></span>
    </div>
  </div>
</div>

<main id="results"></main>

<footer class="sans">
  <div class="firmline">Thomas Philip &middot; Advocates &amp; Solicitors</div>
  Summaries prepared from our reading of the judgments; verify figures and citations against the sealed
  judgments before relying on them. General information, not legal advice.
</footer>

<script>
const DB = ${DATA};

const q = document.getElementById('q');
const courtSel = document.getElementById('court');
const editionSel = document.getElementById('edition');
const areaChips = document.getElementById('areaChips');
const results = document.getElementById('results');
const count = document.getElementById('count');
let activeArea = '';

DB.editions.forEach(e => {
  const o = document.createElement('option');
  o.textContent = e;
  editionSel.appendChild(o);
});

['All areas', ...DB.areas].forEach((a, i) => {
  const b = document.createElement('button');
  b.className = 'chip' + (i === 0 ? ' on' : '');
  b.textContent = a;
  b.onclick = () => {
    activeArea = i === 0 ? '' : a;
    [...areaChips.children].forEach(c => c.classList.toggle('on', c === b));
    render();
  };
  areaChips.appendChild(b);
});

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function hi(s, terms) {
  let out = esc(s);
  terms.forEach(t => {
    if (t.length < 2) return;
    out = out.replace(new RegExp('(' + t.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + ')', 'gi'), '<mark>$1</mark>');
  });
  return out;
}

function outcomeColor(o) {
  o = (o || '').toUpperCase();
  if (o.includes('DISMISS') || o.includes('STRUCK')) return '#8A3B3B';
  if (o.includes('PART')) return '#8A6D3B';
  return '#3B6E4F';
}

function render() {
  const terms = q.value.toLowerCase().split(/\\s+/).filter(Boolean);
  const rows = DB.cases.filter(c => {
    if (activeArea && c.area !== activeArea) return false;
    if (courtSel.value && c.court !== courtSel.value) return false;
    if (editionSel.value && c.edition !== editionSel.value) return false;
    if (!terms.length) return true;
    const hay = [c.hook, c.name, c.citation, c.story, c.courtSaid, c.whyYouCare,
                 c.area, c.outcome, c.tags.join(' ')].join(' ').toLowerCase();
    return terms.every(t => hay.includes(t));
  });

  count.textContent = rows.length + ' case' + (rows.length === 1 ? '' : 's');
  if (!rows.length) {
    results.innerHTML = '<div class="empty sans">No cases match — try fewer words, or clear a filter.</div>';
    return;
  }

  results.innerHTML = rows.map(c => \`
    <details class="card">
      <summary>
        <div class="meta sans">
          <span>\${esc(c.edition)}</span><span>·</span><span>\${esc(c.court)}</span><span>·</span><span>\${esc(c.area)}</span>
          <span class="outcome" style="color:\${outcomeColor(c.outcome)}">\${esc(c.outcome)}</span>
        </div>
        <div class="hook">\${hi(c.hook, terms)}</div>
        <div class="case-name">\${hi(c.name, terms)}</div>
        <div class="citation sans">\${hi(c.citation, terms)}</div>
        <div class="tagrow">\${c.tags.map(t => '<span class="tag sans">' + esc(t) + '</span>').join('')}</div>
        <div class="open-hint sans">Read the case &darr;</div>
      </summary>
      <div class="body">
        <div class="label sans">The story</div><div class="text">\${hi(c.story, terms)}</div>
        <div class="label sans">The court said</div><div class="text">\${hi(c.courtSaid, terms)}</div>
        <div class="label sans">Why you care</div><div class="text">\${hi(c.whyYouCare, terms)}</div>
      </div>
    </details>\`).join('');
}

q.addEventListener('input', render);
courtSel.addEventListener('change', render);
editionSel.addEventListener('change', render);
render();
</script>
</body>
</html>
`;

const outDir = path.join(root, 'docs');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Wrote docs/index.html with ' + cases.length + ' case(s) from ' + COURT_UPDATE_EDITIONS.length + ' edition(s).');
