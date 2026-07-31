# Lawgistics Content Operations

This repo powers the **Lawgistics Daily Court Intelligence** workflow. Any session doing the daily run must follow these standing editorial rules (agreed with Niamh, 30 July 2026).

## Publishing cadence

- **ONE Instagram/LinkedIn post per weekday.** Each daily run features multiple judgments in the written brief, but only ONE gets a designed carousel + captions for posting that day. Pick the most significant/shareable judgment. Bank strong runners-up in a queue (see below) for slow news days.
- **Friday = The Big Case File.** Once a week (Fridays), instead of (or in addition to) the daily judgment post, produce a longer-form breakdown of a big, pop-culture-adjacent legal story — a celebrity trial, sports star contract dispute, high-profile defamation case, reality-TV legal drama, band royalties fight, influencer ad-compliance bust, etc. Must be legally substantive and current (research via WebSearch; NEVER fabricate or embellish facts about real people — defamation risk is real and the audience is lawyers). Same output package: 6-slide carousel, captions, LinkedIn post, reel script.
- Post queue lives at `reports/POST-QUEUE.md` — check it each run; add banked carousels, mark posted ones.
- **The Docket (daily, added 30 Jul 2026):** alongside the featured carousel, every daily run also produces a Docket CAROUSEL covering ALL significant decisions from the previous business day (or latest verified window): cover slide ("The Docket." + date + honest window subline) then ONE SLIDE PER CASE (case name with v in accent blue, one-line holding, citation bottom-left). Final case slide inverts to navy and carries the High Court status line + disclaimer. Template: `tools/carousel/docket.py`. Posted as its own second daily post or story sequence.

## Output locations

- Daily brief: `reports/YYYY-MM-DD-daily-court-intelligence.md`
- Designed assets + posting kit: `reports/assets/YYYY-MM-DD/`
- Carousel render pipeline: `tools/carousel/` (build.py generates slide HTML, shoot.mjs screenshots via playwright-core + system Chromium at /opt/pw-browsers/chromium; install fonts + playwright-core from npm first — see tools/carousel/README.md)

## Design system (keep consistent)

- **MINIMAL style** (approved by Niamh 30 Jul 2026 from her reference images, replacing earlier navy/gold and Press directions — do not revert). Quiet-luxury editorial: ONE statement per slide, huge whitespace, no boxes/bars/tags.
- Palette matches Niamh's existing Lawgistics Instagram grid: warm cream `#EDE7DC` background, deep navy `#171D2B` text, steel-blue underline accent `#3A5697` (4px underline on 1 key phrase per slide). Final slide of each carousel inverts: navy background, cream text, accent `#6E86C9`.
- Canvas 1080×1350 (4:5). Font: **TikTok Sans** (@fontsource/tiktok-sans) for everything — statements ~56-64px weight 500, bold via 600.
- Every slide: "n / 6" top-right, small grey citation block bottom-left, "SWIPE →" bottom-right on slide 1 only, disclaimer microtext on final slide. NO wordmark, NO kicker, NO "comment" CTA (Niamh removed these 30 Jul 2026 — keep slides bare). Nothing else — resist decorating.
- Copy rules for slides: max ~35 words per slide, short sentences, one underlined phrase; the carousel reads as six sequential statements (hook / facts / issue / ruling / takeaway / question).
- **NO em dashes (—) anywhere** — slides, captions, LinkedIn posts, articles (Niamh's rule, 30 Jul 2026). Use commas, colons or full stops instead.

## Editorial rules

- Verify every case against primary/secondary sources; never invent citations, parties, judges or outcomes. Flag unverified details honestly in the brief.
- Note in each posting kit that details should be checked against the full judgment before publication.
- Style: Morning Brew energy, short sentences, no jargon, always the official citation, always "why it matters".
- Delivery is MANUAL for now: commit assets to the branch and send files to the user with SendUserFile. Do not auto-post to social platforms.
