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

**Styles and colours.** Four type systems (Editorial, Bold, Minimal,
Colour block) and ten colour ways, chosen on the Brand screen. Lawgistics
is Editorial + House.

**Per-slide composition.** The thing that stops a carousel looking like
six of the same slide. Each slide carries a `layout` (title / statement /
essay / impact / stat / list / quote) and a `ground` (light / dark /
accent), both chosen by the model and overridable by hand in the editor.
The drafting brief explicitly tells it to vary both and not to repeat a
shape or a ground three times running. `essay` wants a real block of
argument, `stat` wants a genuine figure, `list` splits `body` on
newlines, `quote` needs a real quotation.

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
echo 'OPENAI_API_KEY=sk-...' >> .env.local   # images, and drafting if you prefer it
npm run dev
```

**Which model writes the drafts.** Either provider can. With both keys set
it uses Anthropic; with only one, it uses that one. To pin it, set
`DRAFT_PROVIDER=openai` or `DRAFT_PROVIDER=anthropic`. The OpenAI model
defaults to `gpt-4o` and is overridable with `OPENAI_DRAFT_MODEL` (set a
newer one if you want it, the API's error message will tell you if the
name is wrong). Images always use OpenAI.

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

## Opening the studio to other people (access codes)

Every post a visitor makes is paid for by your OpenAI and Anthropic accounts, so
the three routes that spend money (`/api/draft`, `/api/refine`, `/api/image`) can
be put behind access codes.

Set one variable in the hosting dashboard:

```
ACCESS_CODES = anna-2026, bruce-9, founding-firm-3
```

- One code per firm or per person. Remove a code from the list to revoke just
  that one. A revoked code stops working on the person's next click, and the
  studio asks them for a current one rather than failing silently.
- **Unset, the gate is off** and the studio is open to anyone with the link, so
  setting this up can never lock you out. `/api/setup` shows `accessRequired`
  and says so in its notes.
- The check is on the server (`lib/access.ts`). The box in the browser is only
  the way in, not the lock.
- Codes are compared in constant time and are never returned by any endpoint.
- Changing the variable needs a redeploy to take effect.

This stops strangers. It does not cap what a code holder spends, so also set a
monthly spend limit in the OpenAI and Anthropic dashboards.

## Firm workspaces (profiles, a shared brand, approval, usage)

This is what turns the solo studio into something a firm can use together. Each
lawyer has their own profile, the firm has one locked brand, posts are reviewed
before they can be saved, and whoever runs marketing can see usage.

It is the only part of the app that stores anything, so it needs a database.
**If it is not configured, none of it appears and the solo studio behaves exactly
as before.**

### Setting it up

1. **Create a Postgres database.** Neon, Supabase and Vercel Postgres all work and
   all give you a plain connection string. Use the pooled one if there is a choice.
2. **Add three settings** in the hosting dashboard (Vercel: Settings, Environment
   Variables), then redeploy:

   | Setting | What it is |
   |---|---|
   | `DATABASE_URL` | the Postgres connection string |
   | `SESSION_SECRET` | 32 or more random characters. Generate with `openssl rand -base64 32` |
   | `OWNER_KEY` | 24 or more random characters, only you hold it. Same way to generate |

   The tables create themselves on first use. There is nothing to run.
3. **Check it.** Open `/api/setup`. `firm.configured` should read `true`. If not,
   `firm.reason` says what is missing.
4. **Create the first firm.** Open `/owner`, enter your `OWNER_KEY`, give the firm
   a name and its first admin's name. You get an invite code **once**.
5. **Send the admin their invite** (the code, or the link, which has the code
   after a `#` so it never reaches a server log). They open it, sign in, and land
   on `/team`.

If a firm ever loses its only admin, `/owner` has "Add an admin" for that firm.

### How it works for a firm

- **Signing in** is by one-time invite code, so there is no email system and no
  passwords. An admin adds a person and sends them the code. A code works once and
  expires after 14 days. A lost phone: switch the person off, then issue a new invite.
  A switched off person is signed out on their very next request.
- **The firm brand** (colours, fonts, layout style, footer note) is set by an admin
  on `/team`. Lawyers cannot change it. That is what makes it a firm brand.
- **Approval** can be on or off per firm. On, a lawyer's post goes to the review
  queue, and the studio will not save or copy it until a reviewer approves it.
  **Any edit after approval sends it back to draft**, and a reviewer's decision
  names the exact revision they read, so nobody can approve words that changed
  underneath them.
- **The allowance** is a monthly count of *new* posts per lawyer (revising is free),
  counted in Sydney time, set by the admin. `0` means no limit. A failed model call
  gives the slot back.

### What it does not do, said plainly

- **Approval is a process, not a lock.** The slides are drawn in the browser, so
  someone determined can screenshot the preview. What it does is stop this app
  saving or copying a post nobody approved. The sales page says the same.
- **Invites are not emailed.** The admin sends them.
- **No billing inside the app.**
- **A stored post is capped at about 3.5MB**, so a post with several AI photos can be
  too large to submit. The studio says so.
- The allowance is a hard limit only if the studio is closed to people without an
  account. Set `ACCESS_CODES` as well, otherwise someone can call `/api/draft`
  without signing in and not be counted.

### What is stored

For a firm workspace: the firm's name and brand, each person's name, role and
profile (including the writing sample they chose to give), the posts they submit
for review, and a count of drafts per person per month. Invite codes are stored as
a hash only. Nothing is stored for someone using the studio on their own: that
stays in their browser. What a lawyer types is sent to the AI provider to write the
post, as with any AI tool.

### Security notes

Every route that touches firm data takes the firm from the signed session and never
from the request, and every query is scoped to it, so another firm's valid id is a
plain 404. Request bodies are shaped by closed allow lists before they are stored or
drawn. Mutating requests with a foreign `Origin` are refused. Sessions are signed
cookies (HttpOnly, SameSite=Lax, Secure over https) that are re-checked against the
database on every request.

### Tests

The firm layer was tested against a real Postgres wire protocol with the real `pg`
driver: tenant isolation, forged, expired and wrongly signed sessions, forged
origins, the approval rules, people management, the allowance across a month
boundary, the layer switched off, and the access gate combined with accounts. The
interface was driven end to end in a browser with an owner, an admin and a lawyer.
One honest limit: the test database runs every connection on one shared backend, so
it proves the logic but cannot demonstrate two requests racing across real
connections. The allowance's correctness under true parallelism rests on a row lock
on the member, which is the standard fix and was reasoned, not exercised.
