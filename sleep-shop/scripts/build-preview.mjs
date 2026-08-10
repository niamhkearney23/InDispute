/* Builds a single self-contained HTML file containing the whole site, for
   sharing as a link — no server, no download, no separate asset files.

   It is assembled from the real pages rather than hand-maintained, so the
   preview cannot drift from the site. Every page's <main> becomes a section,
   and a small router swaps between them on the hash.

   Usage:  node scripts/build-preview.mjs [outfile]
           --no-fonts   skip embedding webfonts (offline, or a smaller file)   */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.resolve(process.argv[2] && !process.argv[2].startsWith('--')
  ? process.argv[2]
  : path.join(root, 'dist/preview.html'));
const withFonts = !process.argv.includes('--no-fonts');

/* Route order drives the preview's own navigation. */
const ROUTES = [
  { id: 'home', file: 'index.html', label: 'Home' },
  { id: 'box', file: 'box.html', label: 'The box' },
  { id: 'inside', file: 'inside.html', label: 'What is inside' },
  { id: 'gifting', file: 'gifting.html', label: 'Gifting' },
  { id: 'about', file: 'about.html', label: 'About' },
  { id: 'contact', file: 'contact.html', label: 'Contact' },
  { id: 'cart', file: 'cart.html', label: 'Cart' },
  { id: '404', file: '404.html', label: 'Not found' }
];

const read = (rel) => readFile(path.join(root, rel), 'utf8');

/* ------------------------------------------------------------------ fonts */

const FONT_CSS = 'https://fonts.googleapis.com/css2' +
  '?family=Playfair+Display:ital,wght@0,400;0,500;1,400' +
  '&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300' +
  '&family=Inter:wght@300;400;500&display=swap';

/* A CSP-restricted page cannot reach fonts.gstatic.com, so the faces are
   inlined as data URIs at build time. Latin subsets only — the rest would
   triple the file for characters this shop will never set. */
async function embedFonts() {
  if (!withFonts) return '';
  try {
    const res = await fetch(FONT_CSS, {
      headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36' }
    });
    if (!res.ok) throw new Error('font css ' + res.status);
    const css = await res.text();

    const blocks = css.split('/*').filter((b) => /^\s*latin(-ext)?\s*\*\//.test(b));
    const faces = [];
    for (const block of blocks) {
      const url = block.match(/url\((https:\/\/[^)]+\.woff2)\)/);
      if (!url) continue;
      const font = await fetch(url[1]);
      if (!font.ok) continue;
      const base64 = Buffer.from(await font.arrayBuffer()).toString('base64');
      faces.push(
        '@font-face{' +
        block.slice(block.indexOf('{') + 1, block.lastIndexOf('}'))
          .replace(/url\(https:\/\/[^)]+\.woff2\)/, `url(data:font/woff2;base64,${base64})`)
          .replace(/\s+/g, ' ')
          .trim() +
        '}'
      );
    }
    console.log(`embedded ${faces.length} font faces`);
    return faces.join('\n');
  } catch (err) {
    console.warn('fonts not embedded (' + err.message + ') — falling back to Didot/Georgia');
    return '';
  }
}

/* ------------------------------------------------------------------ pages */

function mainOf(html, file) {
  const open = html.indexOf('<main id="main">');
  const close = html.lastIndexOf('</main>');
  if (open === -1 || close === -1) throw new Error(`${file}: no <main>`);
  return html.slice(open + '<main id="main">'.length, close);
}

/* Page-level inline scripts (about and 404 fill their own art this way). */
function inlineScriptsOf(html) {
  const out = [];
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const body = m[1];
    if (body.includes('localStorage.getItem(\'sleepshop.theme\')')) continue; /* theme bootstrap */
    out.push(body);
  }
  return out;
}

function scriptSrcsOf(html) {
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
}

/* --------------------------------------------------------------- assembly */

const PREVIEW_CSS = `
/* Preview shell only — not part of the site. */
.preview-bar{position:sticky;top:0;z-index:50;display:flex;flex-wrap:wrap;gap:.4rem;
  align-items:center;padding:.55rem clamp(.8rem,3vw,1.6rem);background:#2a1810;color:#f2e9dc;
  font-family:var(--util);font-size:10px;letter-spacing:.16em;text-transform:uppercase}
.preview-bar b{font-family:var(--display);font-size:13px;letter-spacing:.02em;
  text-transform:none;margin-right:.6rem;font-weight:400}
.preview-bar button{border:1px solid rgba(242,233,220,.28);background:none;color:inherit;
  border-radius:999px;padding:.3rem .8rem;font:inherit;cursor:pointer}
.preview-bar button:hover{border-color:#f2e9dc}
.preview-bar button[aria-current="true"]{background:#f2e9dc;color:#2a1810;border-color:#f2e9dc}
.preview-bar span{opacity:.6;margin-left:auto;text-transform:none;letter-spacing:.04em}
.preview-bar button:focus-visible{outline:2px solid #f2e9dc;outline-offset:2px}
.preview-page[hidden]{display:none}
@media(max-width:700px){.preview-bar span{display:none}}
`;

const ROUTER = `
/* Preview router: swaps the page sections and keeps the real nav working. */
(function () {
  var routes = __ROUTES__;
  var bar = document.querySelector('[data-preview-bar]');

  function show(id, hash) {
    if (!routes.some(function (r) { return r.id === id; })) id = '404';
    document.querySelectorAll('.preview-page').forEach(function (page) {
      page.hidden = page.getAttribute('data-route') !== id;
    });
    document.body.dataset.page = id;

    /* Keep the site's own nav highlight honest. */
    document.querySelectorAll('.nav__link').forEach(function (link) {
      var file = (link.getAttribute('href') || '').split('#')[0];
      var match = routes.filter(function (r) { return r.file === file; })[0];
      if (match && match.id === id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    bar.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-current', String(b.dataset.go === id));
    });

    if (hash) {
      var target = document.getElementById(hash);
      if (target) return target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.scrollTo({ top: 0 });
  }

  function routeFor(href) {
    var file = href.split('#')[0].split('?')[0];
    var match = routes.filter(function (r) { return r.file === file; })[0];
    return match ? match.id : null;
  }

  function go(id, hash) {
    var next = '#' + id + (hash ? '/' + hash : '');
    if (location.hash === next) show(id, hash);
    else location.hash = next;
  }

  /* Internal links become route changes; everything else behaves normally. */
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
    var href = link.getAttribute('href');
    if (!href || /^(https?:|mailto:|tel:)/.test(href)) return;

    if (href.charAt(0) === '#') return; /* in-page anchor, leave it */
    var id = routeFor(href);
    if (!id) return;
    event.preventDefault();
    var hash = href.indexOf('#') > -1 ? href.split('#')[1] : '';
    go(id, hash);
  });

  function fromHash() {
    var raw = location.hash.replace(/^#/, '');
    var parts = raw.split('/');
    show(parts[0] || 'home', parts[1] || '');
  }

  bar.addEventListener('click', function (event) {
    var b = event.target.closest('button[data-go]');
    if (b) go(b.dataset.go, '');
  });

  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
`;

async function build() {
  const [styles, fonts] = await Promise.all([read('assets/css/styles.css'), embedFonts()]);

  const pages = [];
  const scriptOrder = [];
  const inlineScripts = [];

  for (const route of ROUTES) {
    const html = await read(route.file);
    pages.push(
      `<div class="preview-page" data-route="${route.id}"${route.id === 'home' ? '' : ' hidden'}>` +
      mainOf(html, route.file) +
      '</div>'
    );
    for (const src of scriptSrcsOf(html)) {
      if (!scriptOrder.includes(src)) scriptOrder.push(src);
    }
    for (const body of inlineScriptsOf(html)) inlineScripts.push(body);
  }

  const scripts = [];
  for (const src of scriptOrder) {
    scripts.push(`/* ${src} */\n` + await read(src));
  }

  const bar = ROUTES.map((r) =>
    `<button type="button" data-go="${r.id}">${r.label}</button>`).join('');

  const out = [
    '<title>Sleep Shop — full site preview</title>',
    '<style>',
    fonts,
    styles,
    PREVIEW_CSS,
    '</style>',
    '<script>',
    "(function(){var r=document.documentElement;" +
      "if(r.hasAttribute('data-theme'))return;/* the host already chose */" +
      "try{var s=localStorage.getItem('sleepshop.theme');" +
      "if(s==='dark'||s==='light')r.setAttribute('data-theme',s);}catch(e){}})();",
    '</script>',
    '<a class="skip-link" href="#main">Skip to content</a>',
    `<nav class="preview-bar" data-preview-bar aria-label="Preview pages"><b>Preview</b>${bar}` +
      '<span>The real site is eight separate pages — this is all of them in one file.</span></nav>',
    '<div data-site-header></div>',
    '<main id="main">',
    pages.join('\n'),
    '</main>',
    '<div data-site-footer></div>',
    ...scripts.map((s) => `<script>\n${s}\n</script>`),
    ...inlineScripts.map((s) => `<script>\n${s}\n</script>`),
    `<script>\n${ROUTER.replace('__ROUTES__', JSON.stringify(ROUTES))}\n</script>`
  ].join('\n');

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, out);
  console.log(`${outPath} — ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
