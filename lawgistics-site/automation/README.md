# Daily content automation

Two scripts that keep `court-updates.html` and `jobs.html` current without
anyone manually editing them:

- `daily-court-updates.mjs` — looks for real, newly published Malaysian
  court decisions and adds them to `assets/data/court-updates-live.json`.
- `daily-jobs.mjs` — checks official Law Society and firm graduate-program
  pages for real, currently open (or confirmed upcoming) Australian
  clerkship windows and rewrites `assets/data/jobs-live.json`.

Both run once a day via `.github/workflows/daily-lawgistics-content.yml`.
`court-updates.html` and `jobs.html` fetch those JSON files at page load and
merge them into what's already on the page — nothing here touches the HTML
files themselves.

## The one rule that matters

**Nothing gets invented.** Each script uses Claude with real web search and
is instructed to only report something it found a live, named source for —
a court judgment, a Law Society page, a firm's own careers page. An empty
result (no new cases today, no confirmed job dates yet) is treated as a
correct answer, not something to paper over with a guess. If you ever see a
case or a clerkship date on the site that looks made up, that's a bug in the
prompt, not the intended behaviour — say so rather than trusting it.

This does **not** add a lawyer sign-off step. `court-updates.html` already
carries its own "AI-drafted, pending lawyer verification" notice — that
still applies to whatever this script adds. `jobs.html` carries the
equivalent: every listing links straight to the official page so a student
can check it themselves before relying on the date shown here.

## One-time setup

You only need to do this once.

1. **Get an Anthropic API key**, if you don't already have one for this
   project (the same key already used by `api/claude.mjs` for the site's
   Claude proxy works fine here too):
   - Go to [console.anthropic.com](https://console.anthropic.com), sign in,
     open **Settings → API Keys**, and create a key if you don't have one.
2. **Add it to GitHub** so the daily workflow can use it:
   - On GitHub, open this repository.
   - Click **Settings** (top of the repo, not your account settings).
   - In the left sidebar: **Secrets and variables → Actions**.
   - Click **New repository secret**.
   - Name: `ANTHROPIC_API_KEY`. Value: paste the key. Click **Add secret**.
3. **Confirm the branch.** The workflow runs against this repo's default
   branch and pushes its updates straight back to it. In the Vercel
   dashboard, open the project → **Settings → Git**, and check that the
   "Production Branch" matches this repo's default branch (usually `main`).
   If it doesn't, either change it there, or change the branch this repo
   treats as default under GitHub **Settings → General → Default branch**.

That's it — the workflow will start firing on its schedule. Nothing else in
this repo needs to change.

## Running it manually

On GitHub: **Actions** tab → **Daily Lawgistics content** → **Run workflow**.
Useful for testing after setup, or if you want fresh content right now
instead of waiting for the schedule.

Locally, from `lawgistics-site/automation/`:

```bash
npm install
export ANTHROPIC_API_KEY=sk-ant-...
node daily-court-updates.mjs
node daily-jobs.mjs
```

This writes straight to the `assets/data/*.json` files in your working
copy — commit and push them yourself if you run it this way.

## How the merge works

- **Court updates accumulate.** Each run adds only genuinely new cases
  (deduped by suit number) on top of whatever's already in
  `court-updates-live.json`, keeping the most recent 200.
- **Jobs are replaced, not accumulated.** Clerkship windows open and close,
  so each run fully rewrites `jobs-live.json` with whatever is currently
  verifiable — it doesn't keep a growing history of past intakes.

## If a run fails

Both scripts exit with a non-zero status and a clear error if
`ANTHROPIC_API_KEY` is missing, or if Claude's final answer isn't valid
JSON (this fails loudly on purpose rather than writing something unverified
to a public page). Check the failed run's log under the **Actions** tab —
the site keeps showing yesterday's data either way, since a failed run
never touches the committed files.
