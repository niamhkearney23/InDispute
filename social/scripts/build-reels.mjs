/* Builds the type led reels as 1080 by 1920 MP4s, straight from the
   calendar. The same idea as the tiles, in motion: brand type on the five
   grounds, plus the site's own product drawings, so a reel needs no camera.

   Every frame is rendered by Chromium at an exact time and piped to ffmpeg,
   so the output is identical on every run rather than a screen recording.

   Needs ffmpeg with libx264 (set FFMPEG to its path if it is not on PATH).
   Usage: node scripts/build-reels.mjs [reel-id] */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'reels');
const SITE_JS = path.resolve(root, '..', 'sleep-shop', 'assets', 'js');
const THEME_ASSETS = path.resolve(root, '..', 'shopify-theme', 'assets');
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FPS = 30;

/* The same faces as the tiles and the shop, read from the one place that
   defines them. */
const FACES = [
  { file: 'ss-playfair-display-400-latin.woff2', family: 'Playfair Display', style: 'normal', weight: 400 },
  { file: 'ss-cormorant-garamond-300i-latin.woff2', family: 'Cormorant Garamond', style: 'italic', weight: 300 },
  { file: 'ss-inter-400-latin.woff2', family: 'Inter', style: 'normal', weight: 400 }
];

async function embedFaces() {
  const rules = [];
  for (const face of FACES) {
    const file = path.join(THEME_ASSETS, face.file);
    if (!existsSync(file)) {
      throw new Error(`${face.family} is missing (${face.file}). Run \`npm run fonts\` in shopify-theme first.`);
    }
    const base64 = (await readFile(file)).toString('base64');
    rules.push(`@font-face{font-family:"${face.family}";font-style:${face.style};` +
      `font-weight:${face.weight};src:url(data:font/woff2;base64,${base64}) format("woff2")}`);
  }
  return rules.join('\n');
}

function checkFfmpeg() {
  const probe = spawnSync(FFMPEG, ['-hide_banner', '-encoders'], { encoding: 'utf8' });
  if (probe.error || !/libx264/.test(probe.stdout || '')) {
    throw new Error(`No ffmpeg with libx264 at "${FFMPEG}". Install ffmpeg, or set FFMPEG to its path. ` +
      'Instagram wants H.264 MP4; the WebM-only ffmpeg bundled with Playwright will not do.');
  }
}

/* Runs in the page. Everything below the CSS is the timeline: build() lays
   each beat out as a layer, render(t) sets every element for one instant. */
const STAGE = String.raw`
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1080px; height: 1920px; overflow: hidden; background: #000; }
.layer { position: absolute; inset: 0; }
.tag, .foot { position: absolute; left: 96px; font: 400 26px/1 Inter, sans-serif;
  letter-spacing: .24em; text-transform: uppercase; }
.tag { top: 288px; }
.foot { top: 1436px; font-size: 22px; letter-spacing: .22em; }
.text { position: absolute; left: 96px; width: 864px; }
.text.top { top: 372px; }
.text.mid { top: 840px; transform: translateY(-50%); }
.head { font-family: "Playfair Display", serif; font-weight: 400; line-height: 1.08;
  letter-spacing: -.005em; text-wrap: balance; }
.head.script { font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 300;
  line-height: 1.02; letter-spacing: 0; }
.note { font: 400 36px/1.42 Inter, sans-serif; max-width: 800px; text-wrap: pretty; }
.head + .note { margin-top: 40px; }
.reel-art { position: absolute; left: 100px; top: 660px; width: 880px; height: 880px;
  -webkit-mask-image: radial-gradient(closest-side, #000 72%, transparent 100%); }
.reel-art svg { width: 100%; height: 100%; display: block; }
.card { position: absolute; left: 160px; top: 830px; width: 760px; height: 539px;
  background: #FBF7F1; border-radius: 6px; padding: 52px 60px;
  box-shadow: 0 34px 70px rgba(40, 18, 12, .32), 0 4px 10px rgba(40, 18, 12, .16); }
.card .rule { width: 72px; height: 3px; background: #7A4A52; margin-bottom: 22px; }
.card .mark { font: 400 38px/1 "Playfair Display", serif; color: #3B2318; }
.card .msg { margin-top: 34px; font: italic 300 56px/1.22 "Cormorant Garamond", serif;
  color: #3B2318; white-space: pre-line; }
.card .cardfoot { position: absolute; left: 60px; bottom: 44px; font: 400 17px/1 Inter, sans-serif;
  letter-spacing: .24em; color: #8B7A6E; }
`;

const RUNTIME = String.raw`
const G = {
  cocoa:  { bg: '#3B2318', ink: '#F2E9DC', quiet: '#C9B6A6' },
  rose:   { bg: '#7A4A52', ink: '#F6E9E6', quiet: '#D9BDBB' },
  powder: { bg: '#AFC9DF', ink: '#2E4257', quiet: '#5A748C' },
  cream:  { bg: '#F2E9DC', ink: '#3B2318', quiet: '#8B7A6E' }
};
const WIPE = 0.75, AFTER_WIPE = 0.5, ENTER = 0.85, RISE = 28, EXIT = 0.35, CHARS_PER_SEC = 15;
const STAGGER = { tag: 0, head: 0.15, art: 0.25, card: 0.25, note: 0.45, foot: 0 };
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp = (x) => Math.max(0, Math.min(1, x));
const els = [];
let wipes = [];

/* Size the headline by how much there is of it, the way the tiles do. */
function headSize(text, script) {
  const n = text.length;
  const base = n <= 6 ? 190 : n <= 14 ? 158 : n <= 26 ? 124 : n <= 42 ? 104 : 86;
  return script ? Math.round(base * 1.22) : base;
}

/* A slot carries across a beat change when the ground and the content are
   both unchanged, so the tag, the drawing and the card hold still while the
   words around them change. Headlines and notes always move on. */
const CARRY = ['tag', 'art', 'card', 'foot'];
const same = (a, b) => a != null && JSON.stringify(a) === JSON.stringify(b);

function build(reel) {
  const stage = document.body;
  let t = 0;
  const beats = reel.beats.map((b) => {
    let beat = { ...b };
    if (b.piece) {
      const p = window.SLEEP_FIND(b.piece);
      beat = { ground: p.ground, tag: p.material, head: p.name, art: p.art, ...b };
    }
    beat.foot = 'Sleep Shop, Melbourne';
    beat.start = t;
    t += b.for;
    beat.end = t;
    return beat;
  });
  window.REEL_TOTAL = t;

  beats.forEach((beat, i) => {
    const prev = beats[i - 1];
    const g = G[beat.ground];
    const wiped = prev && prev.ground !== beat.ground;
    const layer = document.createElement('div');
    layer.className = 'layer';
    layer.style.zIndex = i;
    if (!prev || wiped) layer.style.background = g.bg;
    stage.appendChild(layer);
    if (wiped) wipes.push({ layer, start: beat.start, dir: reel.wipe || 'up' });

    const enterAt = !prev ? 0.1 : wiped ? beat.start + AFTER_WIPE : beat.start + 0.12;

    /* When an element leaves: never, if it lasts to the end or a new ground
       sweeps over it; otherwise it fades just before the next beat. */
    function leaveAt(slot, value) {
      let j = i;
      if (CARRY.includes(slot)) {
        while (beats[j + 1] && beats[j + 1].ground === beat.ground && same(beats[j + 1][slot], value)) j++;
      }
      const next = beats[j + 1];
      if (!next || next.ground !== beat.ground) return Infinity;
      return beats[j].end - EXIT;
    }

    function add(slot, node, extra) {
      layer.appendChild(node);
      els.push({ node, in: enterAt + STAGGER[slot], out: leaveAt(slot, beat[slot]), ...extra });
    }
    const carried = (slot) => CARRY.includes(slot) && prev && prev.ground === beat.ground && same(prev[slot], beat[slot]);

    for (const slot of ['tag', 'foot']) {
      if (!beat[slot] || carried(slot)) continue;
      const n = document.createElement('div');
      n.className = slot;
      n.style.color = g.quiet;
      n.textContent = beat[slot];
      add(slot, n, { still: slot === 'foot' && !!prev });
    }

    const visual = beat.art || beat.card;
    if (beat.head || beat.note) {
      const wrap = document.createElement('div');
      wrap.className = 'text ' + (visual ? 'top' : 'mid');
      layer.appendChild(wrap);
      for (const slot of ['head', 'note']) {
        if (!beat[slot]) continue;
        const n = document.createElement('div');
        n.className = slot + (slot === 'head' && beat.face === 'script' ? ' script' : '');
        n.style.color = g.ink;
        if (slot === 'note') n.style.opacity = 0.9;
        if (slot === 'head') n.style.fontSize = headSize(beat.head, beat.face === 'script') + 'px';
        n.textContent = beat[slot];
        wrap.appendChild(n);
        els.push({ node: n, in: enterAt + STAGGER[slot], out: leaveAt(slot, beat[slot]), base: slot === 'note' ? 0.9 : 1 });
      }
    }

    if (beat.art && !carried('art')) {
      const n = document.createElement('div');
      n.className = 'reel-art';
      n.innerHTML = window.SleepArt.render({ art: beat.art, ground: beat.ground, name: '' }, { label: '' });
      add('art', n);
    }

    if (beat.card && !carried('card')) {
      const n = document.createElement('div');
      n.className = 'card';
      n.style.transform = 'rotate(-2deg)';
      n.innerHTML = '<div class="rule"></div><div class="mark">Sleep Shop</div><div class="msg"></div>' +
        '<div class="cardfoot">MELBOURNE</div>';
      const msg = n.querySelector('.msg');
      /* The message writes itself on, a character at a time, with a breath
         at each line end the way a pen lifts. */
      const writeFrom = enterAt + STAGGER.card + 0.6;
      let at = writeFrom;
      const chars = [];
      for (const ch of beat.card) {
        if (ch === '\n') { msg.appendChild(document.createTextNode('\n')); at += 0.3; continue; }
        const s = document.createElement('span');
        s.textContent = ch;
        msg.appendChild(s);
        chars.push({ node: s, at });
        at += 1 / CHARS_PER_SEC;
      }
      add('card', n, { chars });
    }
  });
}

function render(t) {
  for (const w of wipes) {
    const p = easeInOut(clamp((t - w.start) / WIPE));
    const hidden = (1 - p) * 100;
    w.layer.style.clipPath = w.dir === 'down'
      ? 'inset(0 0 ' + hidden + '% 0)'
      : 'inset(' + hidden + '% 0 0 0)';
    w.layer.style.visibility = t < w.start ? 'hidden' : 'visible';
  }
  for (const e of els) {
    const shown = e.still ? (t >= e.in - 0.5 ? 1 : 0) : easeOut(clamp((t - e.in) / ENTER));
    const gone = t >= e.out ? clamp((t - e.out) / EXIT) : 0;
    const rise = e.still ? 0 : (1 - easeOut(clamp((t - e.in) / (ENTER + 0.1)))) * RISE;
    e.node.style.opacity = (shown * (1 - gone) * (e.base || 1)).toFixed(3);
    e.node.style.translate = '0 ' + rise.toFixed(2) + 'px';
    if (e.chars) for (const c of e.chars) c.node.style.opacity = clamp((t - c.at) / 0.14).toFixed(3);
  }
}
`;

function page(reel, faceCss, siteJs) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${faceCss}\n${STAGE}</style></head>
<body><script>${siteJs}</script><script>${RUNTIME}
build(${JSON.stringify(reel)});
window.render = render;</script></body></html>`;
}

async function encode(browser, reel, faceCss, siteJs) {
  const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await tab.setContent(page(reel, faceCss, siteJs), { waitUntil: 'load' });
  /* Faces load lazily, only once something is set in them, so ask for all
     three outright before checking any of them arrived. */
  const loaded = await tab.evaluate(async (faces) => {
    await Promise.all(faces.map((f) => document.fonts.load(`${f.style} ${f.weight} 40px "${f.family}"`)));
    return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''));
  }, FACES);
  for (const face of FACES) {
    if (!loaded.includes(face.family)) {
      throw new Error(`${reel.id}: ${face.family} did not load, the reel would be in the wrong typeface`);
    }
  }

  const total = await tab.evaluate(() => window.REEL_TOTAL);
  const frames = Math.round(total * FPS);
  const file = path.join(out, `${reel.id}.mp4`);

  /* A silent stereo track rides along: some upload paths refuse a video with
     no audio at all. The music is chosen in the app, not baked in here. */
  const ff = spawn(FFMPEG, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
    '-map', '0:v', '-map', '1:a', '-shortest',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', file
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((resolve, reject) =>
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code} on ${reel.id}`)))));

  for (let f = 0; f < frames; f++) {
    await tab.evaluate((t) => window.render(t), f / FPS);
    const png = await tab.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await done;

  /* The cover is the moment the marked beat is fully in, which is what the
     grid shows. Instagram crops it to the middle 1080 by 1440. */
  const coverBeat = reel.beats.findIndex((b) => b.cover);
  const until = reel.beats.slice(0, Math.max(coverBeat, 0) + 1).reduce((s, b) => s + b.for, 0);
  await tab.evaluate((t) => window.render(t), until - 0.4);
  await tab.screenshot({ path: path.join(out, `${reel.id}-cover.png`) });
  await tab.close();
  return { file, total, frames };
}

async function main() {
  checkFfmpeg();
  if (!existsSync(CHROMIUM)) throw new Error('Chromium not found at ' + CHROMIUM);
  const { chromium } = await import('playwright-core');

  const calendar = JSON.parse(await readFile(path.join(root, 'calendar.json'), 'utf8'));
  const only = process.argv[2];
  const reels = (calendar.reels?.posts ?? []).filter((r) => !only || r.id === only);
  if (!reels.length) throw new Error(only ? `No reel called "${only}"` : 'No reels in calendar.json');

  const faceCss = await embedFaces();
  /* The drawings are the site's own, so a piece looks the same in a reel as
     it does on its product page. */
  const siteJs = (await Promise.all(['data.js', 'art.js'].map((f) => readFile(path.join(SITE_JS, f), 'utf8'))))
    .join('\n');

  await mkdir(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] });
  try {
    for (const reel of reels) {
      const { file, total, frames } = await encode(browser, reel, faceCss, siteJs);
      console.log(`  ${path.relative(root, file).padEnd(22)} ${total.toFixed(1)}s, ${frames} frames  ${reel.title}`);
    }
  } finally {
    await browser.close();
  }
  console.log(`\n${reels.length} reel${reels.length > 1 ? 's' : ''} written to reels/, 1080 by 1920, H.264, with covers.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
