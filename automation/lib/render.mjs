// House-style slide rendering, ported from tools/carousel/house-style.py so
// the daily automation produces pixel-identical output to hand-built decks.
// Adds a `.learn` pull-quote class implementing the standing "every case
// slide carries a learning line" rule (CLAUDE.md), which the original
// house-style.py never actually implemented.
import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const F = join(__dirname, "..", "node_modules", "@fontsource");

function pf(weight, style = "normal") {
  const it = style === "italic" ? "italic" : "normal";
  return `@font-face{font-family:'Playfair';font-weight:${weight};font-style:${style};` +
    `src:url('file://${F}/playfair-display/files/playfair-display-latin-${weight}-${it}.woff2') format('woff2');}`;
}
function ts(weight) {
  return `@font-face{font-family:'TikTok Sans';font-weight:${weight};` +
    `src:url('file://${F}/tiktok-sans/files/tiktok-sans-latin-${weight}-normal.woff2') format('woff2');}`;
}

export const CSS = [400, 500, 600, 700].map((w) => pf(w)).join("\n") + "\n" +
  [400, 500, 600, 700].map((w) => pf(w, "italic")).join("\n") + "\n" +
  [400, 500, 600].map((w) => ts(w)).join("\n") + `
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;}
body{background:#EDE7DC;color:#171D2B;}
body.dark{background:#141A28;color:#EDE7DC;}
.page{position:absolute;inset:0;padding:88px 84px 76px;display:flex;flex-direction:column;}

.kicker{font-family:'TikTok Sans',sans-serif;font-size:19px;font-weight:500;
  letter-spacing:.28em;text-transform:uppercase;color:#8C8577;}
.dark .kicker{color:#8892A6;}

.statement{font-family:'Playfair',serif;font-weight:600;color:inherit;}
.lg{margin-top:120px;font-size:78px;line-height:1.14;letter-spacing:-.005em;max-width:900px;}
.md{margin-top:110px;font-size:60px;line-height:1.2;max-width:900px;}
.statement em{font-style:italic;font-weight:500;}
.statement p+p{margin-top:38px;}

.sub{margin-top:44px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:36px;line-height:1.45;color:#6E6858;max-width:820px;}
.dark .sub{color:#A3ACC0;}

.body{margin-top:44px;font-family:'TikTok Sans',sans-serif;font-size:33px;
  line-height:1.55;font-weight:400;color:#4E4A3F;max-width:860px;}
.dark .body{color:#A9B0C2;}
.body p+p{margin-top:26px;}
.body b{font-weight:600;color:#171D2B;}
.dark .body b{color:#EDE7DC;}

.learn{margin-top:40px;padding-left:28px;border-left:2px solid #3A5697;
  font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:32px;line-height:1.4;color:#171D2B;max-width:800px;}
.dark .learn{border-left-color:#6E86C9;color:#EDE7DC;}
.learn b{font-style:normal;font-weight:600;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;}
.cite{font-family:'TikTok Sans',sans-serif;font-size:19px;line-height:1.55;
  font-weight:500;color:#9A9384;max-width:680px;}
.cite b{color:#5E5A4F;font-weight:600;}
.dark .cite{color:#7C8598;}
.dark .cite b{color:#C4CBDA;}
.mark{font-family:'TikTok Sans',sans-serif;font-size:18px;font-weight:600;
  letter-spacing:.34em;color:#9A9384;white-space:nowrap;}
.dark .mark{color:#7C8598;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:26px;color:#8C8577;}
.dark .swipe{color:#8892A6;}
`;

export function slideHtml({ kicker, inner, cite, dark = false, swipe = false }) {
  const sw = swipe ? '<div class="swipe">swipe &rarr;</div>' : '<div class="mark">LAWGISTICS</div>';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body class="${dark ? "dark" : ""}"><div class="page">
  <div class="kicker">${kicker}</div>
  ${inner}
  <div class="foot"><div class="cite">${cite}</div>${sw}</div>
</div></body></html>`;
}

// slides: array of { slug, kicker, inner, cite, dark, swipe }
export async function renderSlides(slides, outDir) {
  await mkdir(outDir, { recursive: true });
  // CI installs its own matching browser via `npx playwright install`. Local
  // dev/testing can point at a pre-installed system Chromium instead of
  // downloading one, by setting this env var (see automation/README.md).
  const launchOpts = { args: ["--no-sandbox"] };
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const paths = [];
  for (const s of slides) {
    const html = slideHtml(s);
    const htmlPath = join(outDir, `${s.slug}.html`);
    await writeFile(htmlPath, html);
    await page.goto("file://" + htmlPath);
    await page.evaluate(() => document.fonts.ready);
    const pngPath = join(outDir, `${s.slug}.png`);
    await page.screenshot({ path: pngPath });
    paths.push(pngPath);
  }
  await browser.close();
  return paths;
}
