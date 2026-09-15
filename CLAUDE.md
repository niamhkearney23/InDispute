# Lawgistics Content Operations

This repo powers the **Lawgistics** Instagram/LinkedIn content workflow. Any
session doing a content run must follow these standing rules.

**Version history:** Original single-daily-post model agreed with Niamh, 30
July 2026. Repositioned to the six-pillar system below, 2 Sept 2026 ("stop
making every post look like an announcement"). Accent colour reverted from
a teal experiment back to the original steel-blue, 15 Sept 2026.

## Positioning

Not a place that occasionally posts about an internship. **The place young
legal people check daily to understand the profession, find opportunities,
and get ahead.** Useful first. The internship program is one pillar among
six, not the whole account.

**Display name:** Lawgistics | Law Careers + Cases
**Bio:**
```
The modern law hub for Australian law students and early-career lawyers.
Jobs • cases • AI • careers • global opportunities
↓ Start here
```

## Six content pillars

1. **The Job Board** — live roles, clerkships, graduate programs, deadlines.
2. **Case in Plain English** — major cases explained without jargon.
3. **What They Don't Teach You** — billing, networking, court etiquette, drafting, workplace advice.
4. **Law + AI** — AI rulings, tools, prompts, ethical issues.
5. **The People** — young lawyer profiles, student stories, interviews, office diaries. Needs real, consenting subjects; see Known gaps.
6. **Beyond the Degree** — international internships, alternative careers, Kuala Lumpur. The program pillar, deliberately the minority of the mix.

## Series labels (permanent, always visible on the post)

- THE JOB BOARD
- CASE IN 60
- LAW, EXPLAINED
- THE SHORT ANSWER
- CAREER MOVE
- AI + LAW
- INSIDE THE PROFESSION
- LAW ABROAD
- **Recently in Court.** — the roundup format (see below), predates the six-pillar system and continues under it, filed under Case in Plain English.

A post without one of these labels is off-strategy under this system.

## Content mix

35% career/practical · 25% cases/news · 15% AI + legal tech · 15% people/interviews · 10% Lawgistics program (Beyond the Degree).

The 10% is deliberately the minority. Everything else has to earn attention
on its own, with no internship pitch attached.

## Publishing cadence

- **ONE Instagram/LinkedIn post per weekday**, carrying one of the series
  labels above. Bank strong runners-up in the queue (see below) for slow
  news days.
- **Friday = The Big Case File** (falls under Case in Plain English), OR a
  Job Board / Career Move / AI + Law post if a Big Case File isn't ready.
  The Big Case File is a longer-form breakdown of a big, pop-culture-adjacent
  legal story: a celebrity trial, sports star contract dispute, high-profile
  defamation case, reality-TV legal drama, band royalties fight, influencer
  ad-compliance bust, etc. Must be legally substantive and current (research
  via WebSearch; NEVER fabricate or embellish facts about real people,
  defamation risk is real and the audience is lawyers). Same output
  package: 6-slide carousel, captions, LinkedIn post, reel script.
- Post queue lives at `reports/POST-QUEUE.md`, check it each run; add
  banked carousels, mark posted ones, and log any correction against a
  post already live (see `reports/assets/2026-07-30/POST-CORRECTION.md`
  for the pattern).
- **"Recently in Court."** (roundup, renamed from "The Day in Court." on 10
  Aug 2026 because the window covered is usually several days back and the
  old name overstated currency; "The Docket" is retired too, don't reuse
  either): a carousel covering the significant decisions from the latest
  verified window: cover slide ("Recently in Court." on two lines + hairline
  + honest subline naming the court, the number of judgments and the date)
  then ONE SLIDE PER CASE (case name with v in the steel-blue accent,
  one-line holding, citation bottom-left). Final slide inverts to navy and
  carries the closing line + disclaimer. Template:
  `tools/carousel/recentlyincourt.py` (older `dayincourt.py` superseded).
- **Confirmed only applies to roundups too.** Only give a case its own
  slide and a stated holding if the outcome is confirmed. Cases whose
  outcomes cannot be verified go on a single "Three more, in brief" slide
  with name, citation and subject matter only, never an outcome.
- **Every case slide carries a learning line.** A pull-out in serif italic
  against an accent rule, opening "Learn this:", stating the *principle*
  rather than repeating the outcome. One sentence, no sub-clauses, no
  hedging. The point is that the slide is useful in an exam, not just
  informative. Applies to case slides on roundups and single-case
  carousels alike.

## Subject matter: commercial over criminal

Niamh's preference, 27 Aug 2026. Where there is a choice of case, **lead
with commercial and corporate law over criminal law.** Contract, banking
and finance, corporations, competition and consumer, insolvency,
employment, IP, media and defamation, sports and entertainment contracts,
regulatory enforcement. That is the material she likes and it is closer to
what the internships actually involve.

This is a preference, not a prohibition. Run a criminal case when it is
genuinely the best story of the week, or when the legal point is unusually
useful to a student. But when the docket offers both, take the commercial
one, and do not run three criminal posts in a row.

Applies to the Friday Big Case File too: pick the commercial pop-culture
story (band royalties, sports contracts, influencer ad compliance, brand
disputes, a collapse) over the celebrity criminal trial.

## Output locations

- Daily brief: `reports/YYYY-MM-DD-daily-court-intelligence.md`
- Designed assets + posting kit: `reports/assets/YYYY-MM-DD/`
- Carousel render pipeline: `tools/carousel/` (house-style.py generates
  slide HTML, shoot.mjs screenshots via playwright-core + system Chromium
  at /opt/pw-browsers/chromium; install fonts + playwright-core from npm
  first, see `tools/carousel/README.md`)
- The Figma file (`https://www.figma.com/design/JS4Q7YU4dm9zckfJ8HHuRA`,
  documented in `reports/assets/FIGMA.md`) mirrors the same design system
  as editable components, for when Niamh wants to build or adjust a slide
  herself without a session. The Python pipeline stays the source of truth
  for anything built from a judgment, because that's where the
  verification tables and guardrails live. If the palette or type ramp
  changes in one, change it in the other.

## AUDIENCE, read this first

The Instagram account is **@lawgisticsaustralia**, repositioned from "Law
Internships" to **"Law Careers + Cases."** About 495 followers as at Aug
2026. The audience is **law students and early-career lawyers**, not
practitioners. Engagement data from the grid, pre-repositioning:

| Post | Views |
|---|---|
| 5 things that actually get you a legal role | 644 |
| The Day in Court (roundup) | 136 |
| Lies every law student tells themselves | 42 |
| Hanson v Faruqi (case post) | 43 |
| The five stages of every law assignment | 33 |
| 10 types of law student | 31 |

Student-life and career content outperforms pure case analysis by roughly
15x, which is the whole reason for the six-pillar repositioning: career and
practical content is now 35% of the mix by design, not an afterthought.
Case posts still belong on the feed (they build authority and credibility
for the Job Board and Beyond the Degree pillars), but every case post
should answer "why does a law student care" and not only "why does a
practitioner care." Where possible, tie the case back to study, KL, or
getting hired.

## Design system (keep consistent)

- **HOUSE style**, matching Niamh's existing grid (adopted 9 Aug 2026).
  Key elements:
  - **Playfair Display serif** for the statement, with **italics on the
    emphasis words** ("every law *assignment*", "lies law students tell
    *themselves*"). This is the signature of the grid.
  - **Small letterspaced uppercase kicker/series-label chip** top-left,
    sans, muted, or (for the six-pillar series labels) a filled steel-blue
    chip.
  - **LAWGISTICS wordmark bottom right**, small, letterspaced. Slide 1
    uses an italic "swipe →" instead.
  - Alternating cream and navy **at post level** (each post is
    predominantly one or the other) so the grid keeps its checkerboard
    rhythm. Invert the closing slide.
  - Body copy stays TikTok Sans, so the serif carries the statements and
    the sans carries the detail.
- Template: `tools/carousel/house-style.py`. The older all-sans template is
  `tools/carousel/build.py`, superseded (kept for historical posts built
  before 9 Aug 2026, e.g. `reports/assets/2026-07-30/`).
- Palette: warm cream `#EDE7DC`, deep navy `#171D2B` (dark slides
  `#141A28`). Emphasis is carried by **serif italics**, not by the
  underline used in the superseded template.
- **Accent colour is steel-blue, `#3A5697` on cream/light slides and
  `#6E86C9` on navy/dark slides.** This is the *only* accent; a teal
  ("aqua") was tried for the six-pillar series-label chips during the
  Figma repositioning work and reverted back to steel-blue on 15 Sept
  2026, matching the rest of the grid. Never introduce a second accent
  colour without asking first, past experience shows it gets tried and
  then reverted.
- Canvas 1080×1350 (4:5). Statements ~60-78px Playfair; body ~33px TikTok
  Sans.
- Every slide: kicker/series-label top-left, citation block bottom-left,
  wordmark bottom-right (italic "swipe →" on slide 1). NO page numbers, NO
  "comment" CTA, and NO comment-bait sentences ("drop your take below",
  "tell us in the comments"), the closing statement stands on its own.
  Nothing else, resist decorating.
- Copy rules for slides: max ~35 words per slide, short sentences, one
  italicised phrase; a single-case carousel reads as six sequential
  statements (hook / facts / issue / ruling / words / why it matters).
- **NO em dashes (—) anywhere**, slides, captions, LinkedIn posts, articles
  (Niamh's rule, 30 Jul 2026). Use commas, colons or full stops instead.
- **Real or contextual photography roughly every third post.** No
  identifiable person's photo without their consent, established rule.
  Contextual photography (places, objects, screens) needs no consent and
  is the default until real photos are cleared.
- **More full-screen Reels and face-led content**, and shorter carousels:
  one idea per slide is the target on the six-pillar posts, not an
  aspiration. Tables, checklists and simple diagrams people will actually
  save.

## The sign-off (every case caption, and every Beyond the Degree caption)

Every case post caption ends with a short brand block so new viewers learn
what the account is. Full text and alternates: `reports/assets/SIGN-OFF.md`.
Default:

> Want international legal experience? You have come to the right place.
> Lawgistics places Australian law students in legal internships in Kuala
> Lumpur. Courtroom access, practising lawyers, live matters.
> Applications via the link in bio.

Goes after the citations, before the disclaimer and hashtags. No
exclamation marks, no emoji, no question after it. The offer is the close.
Non-case posts (Job Board, AI + Law, Career Move, Inside the Profession)
don't need the full sign-off block every time, this is 10% of the mix by
design, not every post.

Case captions are written as **thought leadership**, not case notes: state
a view, draw the broader lesson, and let the restraint carry the premium
tone. Short declarative sentences, no hype, no hedging.

## Program content (Beyond the Degree pillar): gain, never shortfall

Niamh's rule, 9 Aug 2026. Intern and program copy is **always** framed as
what the student gains, never as a shortage or difficulty at home. Do NOT
write that clerkships are competitive or hard to get, that firms will not
look at students until penultimate year, or that applicants do not need a
distinction average. That framing reads as a consolation prize and signals
that only students who failed to get something else would apply. Tall
poppy syndrome does the rest.

Every line answers "what is in it for me", stated as an advantage:
international exposure ahead of your cohort, courtroom access, something
on the record that compounds. Aspirational, not remedial.

**Status, not pedagogy.** Nobody applies to an internship in order to
learn. They apply to be somewhere other people are not. Cut "you will
learn", "you will develop skills", "three things a textbook cannot teach
you". Write the experience and the standing it gives them instead.

**Never desperate.** A confident offer is stated once and left alone. No
pleading CTAs, no "we answer every DM", no repetition of the ask. The close
on the pinned deck is three words.

**No corporate register.** Banned: anything that sounds like a company
values statement or a LinkedIn culture post. "A city that runs on
ambition", "people who decided not to wait", "we support each other",
"driven individuals", "like-minded people". Cool reads as concrete and
specific, never as abstract nouns about ambition and drive. Write the
flight time, the temperature, the food, the thing you actually saw.

**NEVER invent testimonials.** Do not write a quote, review or endorsement
attributed to a student, intern, firm or staff member unless Niamh has
supplied the real words. Fabricated testimonials are misleading and
deceptive conduct under the Australian Consumer Law and the audience is
lawyers. Build the slide with bracketed placeholders and a "PLACEHOLDER, DO
NOT POST" footer, then ask her for the real quote.

## Confirmed only

Niamh's rule, 10 Aug 2026. **Nothing goes on a slide, in a caption, in a
LinkedIn post or in a reel script unless it is confirmed.** Not "reported",
not "on one account", not hedged with "apparently". If it cannot be
confirmed, it does not go in. Write around it or leave it out.

This includes **attributed superlatives from interested parties**. A land
council, a regulator, a plaintiff's solicitor or a company saying something
is the biggest, the first or the worst is not a confirmed fact, and
attribution does not rescue it. Leave it out.

Hedged wording is not a substitute for verification. If a fact needs a
hedge to be safe, it is not ready to publish. Keep unconfirmed material in
the brief's verification table only, clearly marked, so it is on the
record without being broadcast.

**If a claim already published turns out to be unconfirmed, don't replace
it with a different unconfirmed claim.** State only what's actually
confirmed, say the rest is being re-verified, and give Niamh a concrete way
to settle it (a primary source to check) rather than guessing again. See
`reports/assets/2026-07-30/POST-CORRECTION.md` for the pattern.

## Job Board and Law + AI pillars: same standard, harder in practice

- **The Job Board needs real listings and real deadlines.** Nothing gets
  invented, a fabricated clerkship deadline is a live harm, not a content
  risk. If exact dates aren't published yet for the next intake, say so
  ("not yet confirmed") rather than reusing last year's dates or guessing.
  A daily automation (see below) keeps `lawgistics-site/jobs.html` current
  this way; the same standard applies to any Job Board Instagram post.
- **Law + AI needs fresh research per post**, same confirmed-only standard
  as everything else. Real incidents (e.g. sanctioned lawyers citing
  hallucinated cases) are fair game once verified; nothing speculative.
- **The People pillar needs real, consenting subjects.** No identifiable
  person's photo or quote without their sign-off, this is unchanged by the
  repositioning and has no shortcut.

## Related automation (lawgistics-site, not Instagram)

`lawgistics-site/automation/` runs a separate, already-built daily job
(`.github/workflows/daily-lawgistics-content.yml`) that keeps
`court-updates.html` and `jobs.html` on the *website* current, using Claude
with web search under the same confirmed-only standard. That automation is
scoped to the website's Malaysian court-updates and Australian job-listing
content; it does not generate or post anything to Instagram. See
`lawgistics-site/automation/README.md`. A similar pattern (Claude + web
search, confirmed-only, commit-only, no auto-post) is the intended model
for automating the Instagram content pipeline in this repo too, once built.

## Editorial rules

- Verify every case against primary/secondary sources; never invent
  citations, parties, judges or outcomes. Flag unverified details honestly
  in the brief.
- Note in each posting kit that details should be checked against the full
  judgment before publication.
- Style: Morning Brew energy, short sentences, no jargon, always the
  official citation, always "why it matters".
- Delivery is MANUAL for now: commit assets to the branch and send files
  to the user with SendUserFile. Do not auto-post to social platforms,
  even once content generation itself is automated.

## Known gaps, flagged rather than filled

- **The People pillar** cannot be built without real, consented
  individuals supplying their own words and photos.
- **The Job Board** stays sparse until real listings are supplied or
  freshly verified, see above.
- **Law + AI** needs fresh, per-post research, no standing content bank.
