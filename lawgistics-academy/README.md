# Lawgistics Academy

**Train like a lawyer.**

Adaptive litigation training for Australian law students, PLT students, graduates and
junior lawyers.

This is the MVP. It proves exactly one loop, and nothing else:

> **Diagnostic → Skill map → Daily training → Feedback → Weakness tracking → Spaced
> retesting → Progression**

The measure of success is a learner thinking *"it understands what I don't know, teaches
it to me, and remembers to test me again."* Not *"there are lots of features."*

---

## Getting it running

### 1. Create a Supabase project

<https://supabase.com/dashboard> → New project. Note the project URL and API keys from
**Project Settings → API**.

### 2. Configure the environment

```bash
cd lawgistics-academy
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`.

The service role key bypasses Row Level Security. It must never be prefixed with
`NEXT_PUBLIC_`, never be committed, and never be sent to a browser.

### 3. Apply the schema

Paste each file in `supabase/migrations/` into the Supabase **SQL Editor** and run them
**in order** — `0001_init.sql`, then `0002_daily_facts.sql`. Or, with the Supabase CLI
linked to your project:

```bash
npx supabase db push
```

### 4. Seed the question bank

```bash
npm install
npm run seed
```

That loads 6 domains, 51 concepts, 10 skills, 78 questions and 50 daily facts.

### 5. Run it

```bash
npm run dev
```

Sign up at <http://localhost:3000/signup>.

> Supabase enables email confirmation by default. For local development, turn it off under
> **Authentication → Providers → Email**, or configure an SMTP provider.

### 6. Make yourself an administrator

Admin cannot be self-assigned — a database trigger blocks it and RLS gives the browser no
route to it. Sign up first, then:

```bash
npx tsx scripts/make-admin.ts you@example.com
```

`/admin` is then available.

---

## The legal accuracy problem — read this

Legal accuracy is the thing that makes or breaks this product, and it is the one thing
software cannot verify for you.

**Every question in this repository ships with `verification_status = 'requires_review'`.**
The content is drafted carefully and each question records its jurisdiction and, where
relevant, its source. But none of it has been signed off by an Australian legal
practitioner. Until it is, treat it as a working draft.

The workflow the system enforces:

```
Draft → Requires review → Verified → Published → Superseded/Retired
```

- New questions created in `/admin` always start as **drafts**.
- **Publishing is refused** for any question whose current version is not
  `human_verified`. That check is server-side, in `transitionQuestion`.
- Verification is recorded against the **version**, not the question. Rewrite a question
  and it drops back to requiring review — nobody inherits someone else's sign-off.
- The AI layer can only ever produce drafts. It has no route to `published`.

The one deliberate compromise: `npm run seed` marks seed questions `published` so a fresh
install has a working training loop, while every one of them still carries
`requires_review` and the admin dashboard headlines the count. If you would rather nothing
be servable until a person has approved it:

```bash
npm run seed -- --drafts-only
```

Then verify and publish from `/admin`. Training sessions will be empty until you do.

### Jurisdiction

Every question version carries a jurisdiction, and it is shown to the learner on the
question and again in the feedback. A Victorian procedural rule is never presented as
though it were an ACT rule. `AU_GENERAL` is for genuinely national principles only — when
in doubt, tag the specific jurisdiction.

Worth knowing, and covered in the bank itself: the uniform Evidence Acts apply in the
Commonwealth, NSW, Victoria, Tasmania, the ACT and the NT. Queensland, Western Australia
and South Australia are **not** uniform evidence jurisdictions.

---

## How it works

### The knowledge graph

Content is not filed under broad subjects. Every question links to:

| Edge | Meaning |
| --- | --- |
| **Domain** | How content is browsed — Civil Procedure, Evidence, … |
| **Concepts** | What mastery is tracked against — subpoenas, hearsay, ratio and obiter |
| **Skills** | The *kind of thinking* a question exercised — procedural sequencing, evidence analysis, attention to detail |
| **Jurisdiction** | Which jurisdiction's rule this is |
| **Difficulty** | 1–5 |
| **Source** | Reference, URL, date checked |

Concepts and skills are separate axes on purpose. Concepts drive spaced repetition. Skills
are what eventually let the system say *"strong in evidence analysis and strategic
reasoning, weaker in detailed procedural sequencing"* rather than merely *"good at
Evidence"* — and they are the foundation the career-fit idea would be built on later.

### Immutable history

`questions` holds the stable identity; `question_versions` holds the content, and a
database trigger refuses any edit to a stem, answer key, options, type or jurisdiction.
Editing mints a new version. Attempts point at the version the learner actually saw.

Your mastery evolves. Your historical record does not get rewritten underneath you.

### Answers never reach the browser

The `questions` and `question_versions` tables are admin-only under RLS. Learners read
`v_question_delivery`, a view that omits the answer key and every piece of explanatory
text. Grading happens server-side, in `submitAnswer`, against the base tables.

There is no client-side path to a correct answer before it is submitted.

### The daily brief

One verified fact a day, on the dashboard. It is a reason to open the app on a day you
weren't going to train — origins, distinctions, and the rules everyone assumes they
already understand.

Everyone sees the same fact on the same day. That's deliberate: a shared brief is
something two people in the same cohort can talk about, and a personalised one isn't.
Rotation is a plain modulo over a stable ordering, computed from the calendar date in the
learner's own timezone — so nothing repeats until the whole published pool has cycled, the
same date always gives the same fact, and there is no state to drift.

Facts carry the same provenance and sign-off discipline as questions: jurisdiction,
source, and human verification before publishing. They are simpler in two ways. Nothing a
learner does is recorded against a fact, so there is no mastery to protect and no need for
immutable versioning — correcting a fact just corrects it. And there is no answer key, so
learners read published facts directly under RLS rather than through a delivery view.

Manage them at `/admin/facts`, which also shows which fact is running today.

### The engine

Everything tunable lives in `src/lib/learning/config.ts` — nothing is buried in business
logic.

**Session mix** (`TRAINING_MIX`): 40% weakest concepts, 30% due for review, 20% new
material, 10% reinforcement. Any bucket that cannot be filled spills into the others in
priority order, so a learner always gets a full session — including on day one, when
nothing is weak and nothing is due.

**Mastery** (`src/lib/learning/mastery.ts`): an exponentially-weighted score in 0–100,
scaled by question difficulty and by stated confidence. Being **certain and wrong** moves
mastery further than a wrong guess does, because it means a belief needs correcting rather
than a gap needs filling. Scores are damped until there is enough evidence behind them, so
two lucky answers never read as "84 — Evidence".

**Spaced repetition** (`src/lib/learning/review-scheduler.ts`): a pure function —
`(state, outcome, now) → state`. No database, no ambient clock. Wrong answers always come
back tomorrow whatever the prior interval; correct answers follow an SM-2-style ladder,
capped by a mastery band so a shaky concept cannot drift out to a month. A correct answer
the learner marked as a guess is pulled back in. Swapping the algorithm means changing one
file and no call sites.

**XP** is stored as individual events, never as a running total, so the history stays
auditable. Levels are computed from the sum.

### AI is optional, and additive

`AI_PROVIDER=none` is the default, and the app behaves identically without it minus one
paragraph of commentary. `src/lib/ai/legal-coach.ts` returns `null` on missing config,
error or timeout, and every call site continues. It is invoked strictly *after* the
attempt, mastery, schedule and XP have all been written.

The coach is also constrained: it works only from text an admin has already approved and
is instructed never to introduce a rule, section number, case or time limit that is not in
that material. It rephrases and connects; it does not state the law.

---

## Testing

```bash
npm run test        # 61 tests — engine, content, and the contract tests below
npm run typecheck
npm run lint
npm run build
```

Three of the suites are contract tests, aimed at the failure modes TypeScript
cannot see:

- **`schema-contract.test.ts`** parses the SQL migrations into a schema, walks the
  TypeScript AST for every Supabase query chain, and checks each table, column, filter,
  write key and embedded relation against it. A typo in a `.select()` string or an
  `.insert()` key is invisible to the compiler and surfaces only as a failed request in
  production — this catches it at build time.
- **`authorisation-contract.test.ts`** asserts that every exported function in a
  `'use server'` module establishes who the caller is, that admin actions require admin
  specifically and check before touching the service-role client, and that privileged
  modules carry `server-only`. A server action is a public endpoint; the form on the page
  is not the boundary.
- **`session-resume.test.ts`** covers resuming a part-finished session, including when a
  question has been withdrawn from under it.

Both contract tests are mutation-tested — deliberately planted errors were confirmed to
fail them — so they cannot pass vacuously.

The schema's own guarantees are tested against a real Postgres:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/schema-guarantees.sql
```

25 checks, run inside a transaction that rolls itself back. Among them: a learner cannot
make themselves an administrator; cannot read another learner's attempts; cannot read the
question versions table where the answers live; cannot forge XP; cannot write to the daily
brief; cannot see unpublished facts. And: question content cannot be rewritten in place,
recorded attempts cannot be altered or deleted, and the delivery view exposes no answer
key.

---

## Deploying

Vercel, with **Root Directory** set to `lawgistics-academy`.

Environment variables: the three Supabase values, plus `NEXT_PUBLIC_SITE_URL` set to the
deployed origin. Add the deployed origin to Supabase's redirect allow-list under
**Authentication → URL Configuration**.

---

## Project structure

```
src/
  app/
    (auth)/                sign in, sign up
    (app)/                 the learner-facing product
      onboarding/          four questions
      diagnostic/          intro, and the skill map that comes out of it
      dashboard/           today's training, streak, XP, level, skill map
      train/[sessionId]/   the session runner and its summary
      skills/              full skill map — by area, by skill, and blind spots
    admin/                 question bank, daily brief, verification workflow, versioning
  lib/
    learning/              config, mastery, review-scheduler, progression, selection
    training/service.ts    grading, mastery writes, scheduling, XP
    facts/                 the daily brief and its rotation
    ai/                    provider abstraction + legal coach (both optional)
    supabase/              browser, server (RLS-scoped) and service (privileged) clients
    admin/guard.ts         server-side authorisation
  content/seed/            the question bank and daily facts, as reviewable TypeScript
supabase/
  migrations/0001_init.sql, 0002_daily_facts.sql
  tests/schema-guarantees.sql
scripts/
  seed.ts                  idempotent; re-versions rather than overwriting
  make-admin.ts
tests/
```

---

## Deliberately not built

Payments · public leaderboards · social features · live court lists · voice courtroom
simulator · career recommendations · native app · non-Australian jurisdictions · enterprise
dashboards.

The design leaves room for them. The skill axis is already recorded per attempt, which is
what a career-fit signal would eventually read from — and if it is ever built it should be
framed as *"areas you may enjoy exploring"*, never as a determination about someone's
career. The version and provenance model is what would let a courtroom simulator or
drafting lab be added without compromising the verified bank.

None of that matters until people open the app every morning.

---

## Disclaimer

Training content only. Not legal advice. Progression levels are game levels, not
professional titles or qualifications. Always check the current rules of the relevant court
before acting on a point of procedure.
