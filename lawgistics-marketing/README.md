# Lawgistics Marketing

One on-brand social graphic a day. Type what you want to post about, the
app drafts a carousel and a caption in your voice, you check it, edit it,
tick the box saying you have checked it, and download the slides. Nothing
is ever posted for you.

This is the real, hosted version of the Claude-artifact prototype built on
16 September 2026. Same house style, same slide renderer, but the AI call
runs on the server with the API key kept out of the browser.

## What it does today (MVP)

One question per screen. Four screens, Back and Next at the bottom, and a
step bar top-right to jump between them.

1. **Brand**: wordmark, light/dark background colours, accent, serif and
   sans font choices. Defaults are the Lawgistics palette and type, so the
   first run is one click. Also **Your voice**: paste a few things you have
   written and the draft matches how you actually sound. This is the
   compliant version of "read my LinkedIn", you paste the text yourself,
   nothing is scraped.
2. **Topic**: "What do you want to post about today?" -> drafts 5-6 slides
   plus a caption via `/api/draft` (Claude, server-side) and moves you to
   Review. Or load the example carousel, or start from a blank slide.
3. **Review**: one slide at a time, live preview that is pixel-identical to
   the export, every field editable, bold/italic with `**` and `*`,
   add/duplicate/reorder/delete.
4. **Download**: a strip of every slide, the consent box, and the buttons.
   Downloads are disabled until the "I have checked this" box is ticked.
   That is deliberate and should stay. Single slide PNG, or the whole
   carousel as a ZIP with the caption as `caption.txt`.

Everything autosaves in the browser (localStorage), including which screen
you were on. No accounts yet.

Not in this MVP, on purpose: accounts/login, billing, AI logo generation,
posting cadence reminders, website builder. See the scope discussion in the
session that built this.

## Run it locally

```bash
cd lawgistics-marketing
npm install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local
npm run dev
```

Open http://localhost:3000.

## Deploy (Vercel, click by click)

This app lives in a subfolder of the repo, so it needs its own Vercel
project pointed at that folder.

1. Go to vercel.com -> **Add New** -> **Project**.
2. Pick the `InDispute` repository (already connected for the other sites).
3. Under **Root Directory**, click Edit and choose `lawgistics-marketing`.
4. Framework preset should auto-detect **Next.js**. Leave build settings.
5. Under **Environment Variables**, add `ANTHROPIC_API_KEY` with your key
   (same key the other automations use).
6. Click **Deploy**. Every push to the production branch redeploys.

The Vercel region is pinned to Sydney (`syd1`) in `vercel.json`, matching
the academy app.

## Where things are

- `app/page.tsx`: the four screens (markup only).
- `lib/studio.ts`: all the behaviour: steps, state, editor, preview, export.
- `app/api/draft/route.ts`: the server-side Claude call and the drafting
  brief (voice rules, no em dashes, no AI-sounding patterns, no invented
  citations).
- `app/globals.css`: the dark studio chrome plus the house-style slide CSS,
  ported verbatim from `tools/carousel/house-style.py`.
- `public/fonts/`: Playfair Display and TikTok Sans, self-hosted.
