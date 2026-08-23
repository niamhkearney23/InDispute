/* Print ready artwork for the pieces that go in the box.

   Everything is laid out in millimetres and rendered straight to PDF, so the
   type stays vector and the faces embed. A printer can quote from these files
   without a design round trip.

   Bleed is 3 mm on every edge. The trim line is where the guillotine lands and
   the safe area is 5 mm inside that: nothing that matters goes closer.

   PROOF mode draws the trim and safe lines. Never send a proof to a printer.

   Usage: npm run print          artwork, PDF
          npm run proof          the same with guides, PNG at 300 dpi */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'artwork');
const PROOF = process.argv.includes('--proof');

const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const THEME_ASSETS = path.resolve(root, '..', 'shopify-theme', 'assets');

/* Same faces as the shop and the social tiles, read from the one place that
   defines them rather than copied. */
const FACES = [
  { file: 'ss-playfair-display-400-latin.woff2', family: 'Playfair Display', style: 'normal', weight: 400 },
  { file: 'ss-cormorant-garamond-300i-latin.woff2', family: 'Cormorant Garamond', style: 'italic', weight: 300 },
  { file: 'ss-inter-300-latin.woff2', family: 'Inter', style: 'normal', weight: 300 },
  { file: 'ss-inter-400-latin.woff2', family: 'Inter', style: 'normal', weight: 400 }
];

const INK = '#3B2318';
const ROSE = '#7A4A52';
const CREAM = '#F2E9DC';
const MUTE = '#8B7A6E';

const BLEED = 3;
const SAFE = 5;

async function embedFaces() {
  const rules = [];
  for (const f of FACES) {
    const file = path.join(THEME_ASSETS, f.file);
    if (!existsSync(file)) {
      throw new Error(
        `${f.family} is missing from the theme assets (${f.file}).\n` +
          'Run `npm run fonts` in shopify-theme first. Artwork sent to a printer ' +
          'in the wrong typeface is 500 wrong cards, not a refresh.'
      );
    }
    const base64 = (await readFile(file)).toString('base64');
    rules.push(
      `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};` +
        `src:url(data:font/woff2;base64,${base64}) format("woff2")}`
    );
  }
  return rules.join('\n');
}

/* ------------------------------------------------------------- the pieces */

/* Copy is DRAFT until Niamh signs it off. It is written to the same rules as
   the site: objects, feel, ritual and the gesture. Never an outcome in the
   recipient's body. Print is the worst place to get that wrong, because a
   printed run cannot be edited the way a page can. tests/print.test.mjs runs
   the same linter over this file that the theme runs over its Liquid. */

const GIFT_CARD = {
  id: 'gift-card',
  label: 'Gift card, personalised',
  w: 148,
  h: 105,
  note: 'Blanks letterpressed in bulk, message digitally overprinted per order',
  body: `
    <div class="rule"></div>
    <div class="mark">Sleep Shop</div>
    <div class="msg">{{ the customer's message, up to 250 characters }}</div>
    <div class="foot">Melbourne</div>`
};

const RITUAL_CARD = {
  id: 'ritual-card',
  label: 'Ritual card',
  w: 105,
  h: 148,
  note: 'One design, printed in bulk. The first thing under the lid.',
  body: `
    <div class="eyebrow">For the first night. Fifteen minutes.</div>
    <ol class="steps">
      <li><b>Phone down, somewhere else.</b> Another room, or a drawer. The distance is the point.</li>
      <li><b>Lights low.</b> One lamp, not the ceiling.</li>
      <li><b>Write down what is still in your head.</b> The PM page. It does not have to read well, it has to be out of your head.</li>
      <li><b>The wrap, if you like weight.</b> Warmed for a minute, or straight from the box.</li>
      <li><b>Put your mask on.</b> It goes on last.</li>
    </ol>
    <div class="close">None of this is a prescription. It is four things that happen to sit well together at the end of a day. Goodnight.</div>
    <div class="foot">Sleep Shop, Melbourne</div>`
};

const CARE_CARD = {
  id: 'care-card',
  label: 'Care card',
  w: 90,
  h: 55,
  note: 'One design, printed in bulk',
  body: `
    <div class="eyebrow">Care</div>
    <div class="care">
      <b>The silk.</b> 22 momme, grade 6A mulberry. Hand wash cold, or machine
      on delicate in a bag. pH neutral detergent, no bleach, no softener. Roll
      in a towel, dry flat, out of the sun. The mask and the pillowcase are cut
      from the same run, so wash them together and they stay the same colour.<br>
      <b>The wrap.</b> The cover unbuttons and washes warm. The inner stays
      out of the machine, and warms for one minute only.
    </div>`
};

const PIECES = [GIFT_CARD, RITUAL_CARD, CARE_CARD];

/* ------------------------------------------------------------------ layout */

function page(piece, faceCss) {
  const W = piece.w + BLEED * 2;
  const H = piece.h + BLEED * 2;

  const guides = PROOF
    ? `<div class="guide trim"></div><div class="guide safe"></div>
       <div class="stamp">PROOF ${piece.w} &times; ${piece.h} mm, ${BLEED} mm bleed. Not for print.</div>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
${faceCss}
  @page { size: ${W}mm ${H}mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    width: ${W}mm; height: ${H}mm;
    background: ${CREAM};
    position: relative;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .art {
    position: absolute;
    left: ${BLEED + SAFE}mm; top: ${BLEED + SAFE}mm;
    width: ${piece.w - SAFE * 2}mm; height: ${piece.h - SAFE * 2}mm;
    display: flex; flex-direction: column;
  }
  .guide { position: absolute; pointer-events: none; }
  .trim { left: ${BLEED}mm; top: ${BLEED}mm; width: ${piece.w}mm; height: ${piece.h}mm; outline: 0.2mm dashed #C0392B; }
  .safe { left: ${BLEED + SAFE}mm; top: ${BLEED + SAFE}mm; width: ${piece.w - SAFE * 2}mm; height: ${piece.h - SAFE * 2}mm; outline: 0.2mm dashed #2980B9; }
  .stamp { position: absolute; left: 0; bottom: 0.4mm; width: 100%; text-align: center;
           font: 400 2mm Inter, sans-serif; color: #C0392B; letter-spacing: 0.3mm; }

  .eyebrow { font: 400 2.1mm/1 Inter, sans-serif; letter-spacing: 0.7mm;
             text-transform: uppercase; color: ${MUTE}; }
  .mark { font: 400 6mm/1 "Playfair Display", serif; color: ${INK}; }
  .foot { font: 400 1.9mm/1 Inter, sans-serif; letter-spacing: 0.6mm;
          text-transform: uppercase; color: ${MUTE}; margin-top: auto; }
  .rule { width: 12mm; height: 0.35mm; background: ${ROSE}; margin-bottom: 3.5mm; }

  .msg { font: italic 300 5.4mm/1.35 "Cormorant Garamond", serif; color: ${INK};
         margin-top: 6mm; max-width: 105mm; }

  .steps { list-style: none; counter-reset: s; margin: 5mm 0 0; padding: 0; }
  .steps li { counter-increment: s; position: relative; padding-left: 7mm; margin-bottom: 3.4mm;
              font: 300 2.9mm/1.45 Inter, sans-serif; color: #5A463A; }
  .steps li::before { content: counter(s); position: absolute; left: 0; top: 0.2mm;
                      font: 400 3.4mm/1 "Playfair Display", serif; color: ${ROSE}; }
  .steps b { font-weight: 400; color: ${INK}; }
  .close { font: italic 300 3.4mm/1.4 "Cormorant Garamond", serif; color: ${ROSE};
           margin-top: 1mm; padding-top: 3mm; border-top: 0.2mm solid #DCCDBB; }

  .care { font: 300 2.5mm/1.5 Inter, sans-serif; color: #5A463A; margin-top: 2.5mm; }
  .care b { font-weight: 400; color: ${INK}; }
</style></head><body>${guides}<div class="art">${piece.body}</div></body></html>`;
}

async function main() {
  await mkdir(out, { recursive: true });
  const faceCss = await embedFaces();

  if (!existsSync(CHROMIUM)) throw new Error('Chromium not found, cannot render print artwork');
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] });

  for (const piece of PIECES) {
    const p = await browser.newPage();
    await p.setContent(page(piece, faceCss), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);

    const loaded = await p.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length);
    if (loaded < 1) {
      await browser.close();
      throw new Error(`${piece.id}: no face loaded, the artwork would be in the wrong typeface`);
    }

    const W = piece.w + BLEED * 2;
    const H = piece.h + BLEED * 2;

    if (PROOF) {
      /* 300 dpi from a 96 dpi page is a scale factor of 25/8. */
      await p.setViewportSize({
        width: Math.round(W * 96 / 25.4),
        height: Math.round(H * 96 / 25.4)
      });
      await p.screenshot({ path: path.join(out, `${piece.id}-proof.png`), scale: 'css' });
    } else {
      await p.pdf({
        path: path.join(out, `${piece.id}.pdf`),
        width: `${W}mm`,
        height: `${H}mm`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });
    }
    await p.close();
    console.log(
      `  ${piece.id.padEnd(12)} ${String(piece.w).padStart(3)} x ${String(piece.h).padStart(3)} mm` +
        ` + ${BLEED} bleed   ${piece.note}`
    );
  }

  await browser.close();
  console.log(`\n${PIECES.length} pieces written to artwork/ as ${PROOF ? 'proof PNGs' : 'print PDFs'}`);
  if (!PROOF) console.log('Copy is DRAFT. Do not send to a printer until it is signed off.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
