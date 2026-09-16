# Lawgistics Marketing

One on-brand social graphic a day. Type what you want to post about, the
app drafts a carousel and a caption in your voice, you check it, edit it,
tick the box saying you have checked it, and download the slides. Nothing
is ever posted for you.

This is the real, hosted version of the Claude-artifact prototype built on
16 September 2026. Same house style, same slide renderer, but the AI call
runs on the server with the API key kept out of the browser.

## What it does today (MVP)

Two screens.

1. **Brand**, set once: wordmark, light/dark background colours, accent,
   serif and sans font choices. Defaults are the Lawgistics palette and
   type, so the first run is one click on Done. Also **Your voice**: paste
   a few things you have written and every draft matches how you actually
   sound. This is the compliant version of "read my LinkedIn", you paste
   the text yourself, nothing is scraped. Reachable later from the Brand
   button in the header.
2. **Post**, every day: a chat on the left ("What do you want to post about
   today?") and the result on the right. The first message drafts the
   LinkedIn-style post and 5-6 slides via `/api/draft` (Claude,
   server-side). Every message after that is a revision: "shorter",
   "punchier hook", "slide 3 should name the case". The current draft goes
   back to the model with the instruction and it returns the whole thing
   updated. **New post** clears the thread and starts again.

   On the right: the post text with **Copy post** (keeps the line spacing),
   a strip of the slides (tap one to open the hand editor, which is folded
   away by default), the consent box, and the save buttons. Saving is
   disabled until the "I have checked this" box is ticked. That is
   deliberate and should stay. On a phone the buttons are **Save all slides
   to Photos** / **Save this slide to Photos**, which hand pre-rendered PNGs
   to the share sheet; on desktop they are a ZIP (with `post.txt`) or a
   single PNG.

Everything autosaves in the browser (localStorage), including the chat
thread. No accounts yet.

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

- `app/page.tsx`: the two screens (markup only).
- `lib/studio.ts`: all the behaviour: chat, state, editor, preview, export.
- `app/api/draft/route.ts`: the server-side Claude call and the drafting
  brief (voice rules, no em dashes, no AI-sounding patterns, no invented
  citations). Accepts `current` for revisions.
- `app/globals.css`: the dark studio chrome plus the house-style slide CSS,
  ported verbatim from `tools/carousel/house-style.py`.
- `public/fonts/`: Playfair Display and TikTok Sans, self-hosted.
