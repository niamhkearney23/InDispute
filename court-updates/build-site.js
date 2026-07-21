#!/usr/bin/env node
// =====================================================================
// build-site.js  --  static export of the Court Update case-lookup site
// =====================================================================
//
// The LIVE site is served by the Apps Script web app (?action=cases),
// reading READY rows straight from the Sheet. This script is the static
// export path: it renders the same page template from the editions
// registered in code (COURT_UPDATE_EDITIONS) into docs/index.html, for
// GitHub Pages or any static host.
//
//   node court-updates/build-site.js
// =====================================================================

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'CourtUpdate.gs'), 'utf8');
(0, eval)(src); // indirect eval: runs in global scope, so the .gs var declarations become globals

const cases = globalThis.cuCasesFromEditions_(globalThis.COURT_UPDATE_EDITIONS);
const html = globalThis.buildCaseLookupHtml_(cases);

const outDir = path.join(root, 'docs');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Wrote docs/index.html with ' + cases.length + ' case(s) from ' +
            globalThis.COURT_UPDATE_EDITIONS.length + ' edition(s).');
