# Lawgistics Content Operations

This repo powers the **Lawgistics Daily Court Intelligence** workflow. Any session doing the daily run must follow these standing editorial rules (agreed with Niamh, 30 July 2026).

## Publishing cadence

- **ONE Instagram/LinkedIn post per weekday.** Each daily run features multiple judgments in the written brief, but only ONE gets a designed carousel + captions for posting that day. Pick the most significant/shareable judgment. Bank strong runners-up in a queue (see below) for slow news days.
- **Friday = The Big Case File.** Once a week (Fridays), instead of (or in addition to) the daily judgment post, produce a longer-form breakdown of a big, pop-culture-adjacent legal story — a celebrity trial, sports star contract dispute, high-profile defamation case, reality-TV legal drama, band royalties fight, influencer ad-compliance bust, etc. Must be legally substantive and current (research via WebSearch; NEVER fabricate or embellish facts about real people — defamation risk is real and the audience is lawyers). Same output package: 6-slide carousel, captions, LinkedIn post, reel script.
- Post queue lives at `reports/POST-QUEUE.md` — check it each run; add banked carousels, mark posted ones.
- **"Recently in Court." (roundup post, renamed from "The Day in Court." on 10 Aug 2026 because the window covered is usually several days back and the old name overstated currency; the earlier name "The Docket" stays retired, don't reuse either):** a carousel covering the significant decisions from the latest verified window: cover slide ("Recently in Court." on two lines + hairline + honest subline naming the court, the number of judgments and the date) then ONE SLIDE PER CASE (case name with v in accent blue, one-line holding, citation bottom-left). Final slide inverts to navy and carries the closing line + disclaimer. Template: `tools/carousel/recentlyincourt.py` (older `dayincourt.py` superseded).
- **Confirmed only applies to roundups too.** Only give a case its own slide and a stated holding if the outcome is confirmed. Cases whose outcomes cannot be verified go on a single "Three more, in brief" slide with name, citation and subject matter only, never an outcome.
- **Every case slide carries a learning line.** A pull-out in serif italic against an accent rule, opening "Learn this:", stating the *principle* rather than repeating the outcome. One sentence, no sub-clauses, no hedging. The point is that the slide is useful in an exam, not just informative. Applies to case slides on roundups and on single-case carousels.

## Output locations

- Daily brief: `reports/YYYY-MM-DD-daily-court-intelligence.md`
- Designed assets + posting kit: `reports/assets/YYYY-MM-DD/`
- Carousel render pipeline: `tools/carousel/` (build.py generates slide HTML, shoot.mjs screenshots via playwright-core + system Chromium at /opt/pw-browsers/chromium; install fonts + playwright-core from npm first — see tools/carousel/README.md)

## AUDIENCE, read this first

The Instagram account is **@lawgisticsaustralia, "Lawgistics | Law Internships"**: internships for Australian law students in Kuala Lumpur. Courtroom access, practical experience, career insight. About 495 followers as at Aug 2026.

The audience is **law students and early-career lawyers**, not practitioners. Engagement data from the grid confirms it:

| Post | Views |
|---|---|
| 5 things that actually get you a legal role | 644 |
| The Day in Court (roundup) | 136 |
| Lies every law student tells themselves | 42 |
| Hanson v Faruqi (case post) | 43 |
| The five stages of every law assignment | 33 |
| 10 types of law student | 31 |

Student-life and career content outperforms pure case analysis by roughly 15x. Case posts still belong on the feed, they build authority and credibility for the internship offer, but every case post should answer "why does a law student care" and not only "why does a practitioner care". Where possible tie the case back to study, KL, or getting hired.

## Design system (keep consistent)

- **HOUSE style**, matching Niamh's existing grid (adopted 9 Aug 2026 after reviewing the live account). Key elements her own posts already use and which the earlier all-sans slides were missing:
  - **Playfair Display serif** for the statement, with **italics on the emphasis words** ("every law *assignment*", "lies law students tell *themselves*"). This is the signature of the grid.
  - **Small letterspaced uppercase kicker** top-left, sans, muted: "THE FACTS", "A CASE STUDY", "WHY IT MATTERS".
  - **LAWGISTICS wordmark bottom right**, small, letterspaced. Slide 1 uses an italic "swipe →" instead.
  - Alternating cream and navy **at post level** (each post is predominantly one or the other) so the grid keeps its checkerboard rhythm. Invert the closing slide.
  - Body copy stays TikTok Sans, so the serif carries the statements and the sans carries the detail.
- Template: `tools/carousel/house-style.py`. The older all-sans template is `tools/carousel/build.py`, superseded.
- Palette: warm cream `#EDE7DC`, deep navy `#171D2B` (dark slides `#141A28`). Emphasis is carried by **serif italics**, not by the underline used in the superseded template.
- Canvas 1080×1350 (4:5). Statements ~60-78px Playfair; body ~33px TikTok Sans.
- Every slide: kicker top-left, citation block bottom-left, wordmark bottom-right (italic "swipe →" on slide 1). NO page numbers, NO "comment" CTA, and NO comment-bait sentences ("drop your take below", "tell us in the comments") — Niamh removed these; the closing statement stands on its own. Nothing else — resist decorating.
- Copy rules for slides: max ~35 words per slide, short sentences, one italicised phrase; the carousel reads as six sequential statements (hook / facts / issue / ruling / words / why it matters).
- **NO em dashes (—) anywhere** — slides, captions, LinkedIn posts, articles (Niamh's rule, 30 Jul 2026). Use commas, colons or full stops instead.

## The sign-off (every case caption)

Every case post caption ends with a short brand block so new viewers learn what the account is. Full text and alternates: `reports/assets/SIGN-OFF.md`. Default:

> Want international legal experience? You have come to the right place.
> Lawgistics places Australian law students in legal internships in Kuala Lumpur. Courtroom access, practising lawyers, live matters.
> Applications via the link in bio.

Goes after the citations, before the disclaimer and hashtags. No exclamation marks, no emoji, no question after it. The offer is the close.

Case captions are written as **thought leadership**, not case notes: state a view, draw the broader lesson, and let the restraint carry the premium tone. Short declarative sentences, no hype, no hedging.

## Program content: gain, never shortfall

Niamh's rule, 9 Aug 2026. Intern and program copy is **always** framed as what the student gains, never as a shortage or difficulty at home. Do NOT write that clerkships are competitive or hard to get, that firms will not look at students until penultimate year, or that applicants do not need a distinction average. That framing reads as a consolation prize and signals that only students who failed to get something else would apply. Tall poppy syndrome does the rest.

Every line answers "what is in it for me", stated as an advantage: international exposure ahead of your cohort, courtroom access, something on the record that compounds. Aspirational, not remedial.

**Status, not pedagogy.** Nobody applies to an internship in order to learn. They apply to be somewhere other people are not. Cut "you will learn", "you will develop skills", "three things a textbook cannot teach you". Write the experience and the standing it gives them instead.

**Never desperate.** A confident offer is stated once and left alone. No pleading CTAs, no "we answer every DM", no repetition of the ask. The close on the pinned deck is three words.

**No corporate register.** Banned: anything that sounds like a company values statement or a LinkedIn culture post. "A city that runs on ambition", "people who decided not to wait", "we support each other", "driven individuals", "like-minded people". Cool reads as concrete and specific, never as abstract nouns about ambition and drive. Write the flight time, the temperature, the food, the thing you actually saw.

**NEVER invent testimonials.** Do not write a quote, review or endorsement attributed to a student, intern, firm or staff member unless Niamh has supplied the real words. Fabricated testimonials are misleading and deceptive conduct under the Australian Consumer Law and the audience is lawyers. Build the slide with bracketed placeholders and a "PLACEHOLDER, DO NOT POST" footer, then ask her for the real quote.

## Confirmed only

Niamh's rule, 10 Aug 2026. **Nothing goes on a slide, in a caption, in a LinkedIn post or in a reel script unless it is confirmed.** Not "reported", not "on one account", not hedged with "apparently". If it cannot be confirmed, it does not go in. Write around it or leave it out.

This includes **attributed superlatives from interested parties**. A land council, a regulator, a plaintiff's solicitor or a company saying something is the biggest, the first or the worst is not a confirmed fact, and attribution does not rescue it. Leave it out.

Hedged wording is not a substitute for verification. If a fact needs a hedge to be safe, it is not ready to publish. Keep unconfirmed material in the brief's verification table only, clearly marked, so it is on the record without being broadcast.

## Editorial rules

- Verify every case against primary/secondary sources; never invent citations, parties, judges or outcomes. Flag unverified details honestly in the brief.
- Note in each posting kit that details should be checked against the full judgment before publication.
- Style: Morning Brew energy, short sentences, no jargon, always the official citation, always "why it matters".
- Delivery is MANUAL for now: commit assets to the branch and send files to the user with SendUserFile. Do not auto-post to social platforms.
