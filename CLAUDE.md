# Lawgistics Content Operations

This repo powers the **Lawgistics Daily Court Intelligence** workflow. Any session doing the daily run must follow these standing editorial rules (agreed with Niamh, 30 July 2026).

## Publishing cadence

- **ONE Instagram/LinkedIn post per weekday.** Each daily run features multiple judgments in the written brief, but only ONE gets a designed carousel + captions for posting that day. Pick the most significant/shareable judgment. Bank strong runners-up in a queue (see below) for slow news days.
- **Friday = The Big Case File.** Once a week (Fridays), instead of (or in addition to) the daily judgment post, produce a longer-form breakdown of a big, pop-culture-adjacent legal story — a celebrity trial, sports star contract dispute, high-profile defamation case, reality-TV legal drama, band royalties fight, influencer ad-compliance bust, etc. Must be legally substantive and current (research via WebSearch; NEVER fabricate or embellish facts about real people — defamation risk is real and the audience is lawyers). Same output package: 6-slide carousel, captions, LinkedIn post, reel script.
- Post queue lives at `reports/POST-QUEUE.md` — check it each run; add banked carousels, mark posted ones.

## Output locations

- Daily brief: `reports/YYYY-MM-DD-daily-court-intelligence.md`
- Designed assets + posting kit: `reports/assets/YYYY-MM-DD/`
- Carousel render pipeline: `tools/carousel/` (build.py generates slide HTML, shoot.mjs screenshots via playwright-core + system Chromium at /opt/pw-browsers/chromium; install fonts + playwright-core from npm first — see tools/carousel/README.md)

## Design system (keep consistent)

- Canvas 1080×1350 (4:5). Deep navy `#0B1626`/`#0E1D33` background, gold accent `#C9A227`, cream text `#F4EFE4`, body grey-blue `#CBD5E3`.
- Fonts: Playfair Display (700/900) for headlines, Inter for everything else (both from @fontsource on npm).
- Every slide: gold corner frame, "DAILY COURT INTELLIGENCE · date" kicker (Friday feature uses "THE BIG CASE FILE · date"), LAWGISTICS wordmark footer, slide number, citation on judgment slides, disclaimer on final slide.

## Editorial rules

- Verify every case against primary/secondary sources; never invent citations, parties, judges or outcomes. Flag unverified details honestly in the brief.
- Note in each posting kit that details should be checked against the full judgment before publication.
- Style: Morning Brew energy, short sentences, no jargon, always the official citation, always "why it matters".
- Delivery is MANUAL for now: commit assets to the branch and send files to the user with SendUserFile. Do not auto-post to social platforms.
