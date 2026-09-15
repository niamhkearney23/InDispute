# Daily Instagram/LinkedIn content automation

Generates one ready-to-post carousel per weekday: research (Claude + real
web search), house-style copy, rendered slides, a posting kit, and a
`reports/POST-QUEUE.md` entry. Friday runs "The Big Case File" per
CLAUDE.md instead of a regular judgment post.

Run by `.github/workflows/daily-instagram-carousel.yml`. Uses the same
`ANTHROPIC_API_KEY` repository secret as the other daily automation
(`lawgistics-site/automation/`), no new secret needed if that one's already
set up.

## The one rule that matters

**Nothing gets invented.** The research prompt requires a real, verifiable
source URL for every fact, and an explicit "nothing qualified today"
(`hasLead: false`) is treated as a correct result, not something to force
past with a weaker or unconfirmed post. If you ever see a fact on a
generated slide that looks wrong or unconfirmable, that's a prompt bug, not
intended behaviour, flag it.

## Delivery stays MANUAL

This commits assets and posting kits, it does **not** post to Instagram or
LinkedIn. Each morning's output needs a human to actually read the posting
kit, spot-check the facts against the source URL it names, and post it (or
not). Same standing rule as everywhere else in this repo.

## Running it manually

GitHub: **Actions** tab -> **Daily Instagram carousel** -> **Run workflow**.

Locally, from `automation/`:

```bash
npm install
npx playwright install chromium
export ANTHROPIC_API_KEY=sk-ant-...
node daily-carousel.mjs
```

Writes straight into `reports/` and `reports/assets/YYYY-MM-DD/` in your
working copy, commit and push yourself if you run it this way.

## How it decides what to post

- **Weekday:** searches austlii.edu.au, fedcourt.gov.au, hcourt.gov.au,
  supremecourt.vic.gov.au and countycourt.vic.gov.au for the most
  significant recent judgment, preferring commercial/corporate over
  criminal per CLAUDE.md, but not restricted to those five domains if the
  model needs a secondary source to confirm a detail.
- **Friday:** a broader search for a pop-culture-adjacent legal story (The
  Big Case File), commercial angle preferred, real named people so extra
  care on confirmed-only, this is where defamation risk actually lives.
- Either way, if nothing verifiable and worth posting turns up, it skips
  the day rather than posting something weak. Check `reports/POST-QUEUE.md`
  for banked runners-up to fill a gap like that.

## If a run fails

Exits non-zero with a clear error (missing API key, wrong slide count,
non-JSON final answer) rather than committing something broken. Check the
failed run's log under the **Actions** tab. A failed run never touches
`reports/`, so nothing already committed is at risk.
