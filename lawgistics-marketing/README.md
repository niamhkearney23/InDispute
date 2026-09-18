# Lawgistics Marketing

One on-brand social graphic a day. Type what you want to post about, the
app drafts a carousel and a caption in your voice, you check it, edit it,
tick the box saying you have checked it, and download the slides. Nothing
is ever posted for you.

This is the real, hosted version of the Claude-artifact prototype built on
16 September 2026. Same house style, same slide renderer, but the AI call
runs on the server with the API key kept out of the browser.

## What it does today (MVP)

Six screens, one question each. The first three are setup and only appear
on the first run (the Brand button reopens them); after that the daily
loop is screens 4 to 6.

1. **Who are you**: your name and what you do. The field ("employment law
   for small business owners") is fed to the model so the post is written
   for the people who would hire you, not for lawyers in general. A
   fold-out switches to posting as a law firm or a business instead.
2. **Your look**: ten colour ways, four layouts, a live preview slide, and
   **Surprise me** for a random pairing. A fold-out has exact colours and
   fonts.
3. **Your voice** (optional): paste anything you have written and the
   drafts copy your rhythm. This is the compliant version of "read my
   LinkedIn", you paste it yourself, nothing is scraped.
4. **What to write about**: one box, plus Slides or One poster, plus a
   one-tap weekly reminder that downloads a repeating calendar event.
5. **Happy with this?**: the slides at full size, the post text, and
   **Change something** which opens the chat (say "shorter", "punchier
   hook") and the hand editor.
6. **Save it and post it**: the consent box, Save to Photos on a phone or
   ZIP/PNG on desktop, and Copy post.

Older description of the three-screen version follows.

1. **Brand**, set once: "Who is this post coming from?" — **Me** (the
   default, since a personal LinkedIn post reaches further than a company
   page), **My law firm**, or **My business**. Then a name, one of four
   layouts (Editorial, Bold, Minimal, Colour block), one of ten colour
   ways, and a fold-out for exact colours and fonts. **Surprise me** picks
   a random layout-and-colour pairing you have not just seen. A live
   preview slide shows the result as you choose. The model is told which
   kind it is: a law firm writes as "we" for clients and referrers,
   general information only; a business writes for its customers; a person
   writes in the first person. A live preview slide on the right shows
   what their posts will look like. Also **Your voice**: paste a few things
   you have written and every draft matches how you actually sound. This
   is the compliant version of "read my LinkedIn", you paste the text
   yourself, nothing is scraped. Reachable later from the Brand button.
2. **Ask**, every day: one big box, "What do you want to post about
   today?", and a choice of **Slides (a carousel)** or **One poster** (for
   a one-off event: "live music at the cafe this Friday from 6"). Write my
   post drafts it via `/api/draft` (Claude, server-side) and moves to the
   Post screen. The model is told whether it is writing for a business or
   a named person, and for a poster it returns exactly one slide and is
   told not to invent dates, times, places or prices.
3. **Post**: the result on the right, a chat on the left for changes:
   "shorter", "punchier hook", "slide 3 should name the case". The current
   draft goes back to the model with the instruction and it returns the
   whole thing updated. **New post** goes back to Ask.

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

**Styles and colours.** Four layouts (Editorial, Bold, Minimal, Colour
block) and six colour looks, chosen on the Brand screen. Lawgistics is
Editorial + House.

**Photos and AI design.** In the hand editor, any slide can take an image
behind the text (OpenAI images via `/api/image`, key kept on the server
as `OPENAI_API_KEY`): **Design with AI** makes an abstract, dark-toned
background in the brand's own colours with the middle left clear for the
words; **Photo with AI** makes an editorial photo from a description,
places and objects only, no text, no faces; or upload your own. **Use on
every slide** copies one image across the carousel so it stays
consistent for the cost of one image. Images are stored as slide-sized
JPEGs in localStorage; revisions from the chat keep them by slide
position.

## Run it locally

```bash
cd lawgistics-marketing
npm install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local
echo 'OPENAI_API_KEY=sk-...' >> .env.local   # optional, only for AI photos
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
   (same key the other automations use), and `OPENAI_API_KEY` if you want
   the AI photo button to work.
6. Click **Deploy**. Every push to the production branch redeploys.

The Vercel region is pinned to Sydney (`syd1`) in `vercel.json`, matching
the academy app.

### If the short URL never updates

This repo's default branch is `claude/paralegal-application-review-FCor4`,
not `main`, and `main` holds different work (the academy and the site).
A fresh Vercel project assumes `main`, which causes three symptoms at
once: Root Directory rejects `lawgistics-marketing` as invalid (it is
looking on `main`, where the folder does not exist), every push lands as
a Preview so the `.vercel.app` URL stays frozen, and preview URLs ask you
to log in to Vercel.

Fix it in this order, in **Settings → Git** (newer Vercel: **Settings →
Environments → Production**):

1. Set **Production Branch** to `claude/paralegal-application-review-FCor4`.
2. Then set **Root Directory** to `lawgistics-marketing`; it validates now.
3. Push a commit, or use **Deployments → ⋯ → Redeploy**. Changing the
   setting alone does not rebuild anything.

## Where things are

- `app/page.tsx`: the two screens (markup only).
- `lib/studio.ts`: all the behaviour: chat, state, editor, preview, export.
- `app/api/draft/route.ts`: the server-side Claude call and the drafting
  brief (voice rules, no em dashes, no AI-sounding patterns, no invented
  citations). Accepts `current` for revisions.
- `app/globals.css`: the dark studio chrome plus the house-style slide CSS,
  ported verbatim from `tools/carousel/house-style.py`.
- `public/fonts/`: Playfair Display and TikTok Sans, self-hosted.
