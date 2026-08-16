@AGENTS.md

# Lawgistics Academy

Adaptive litigation training for Australian and Malaysian law students, PLT
students, graduates and junior lawyers, plus the induction a firm puts in front
of somebody before their first day.

Built by a lawyer, not a developer. Explain things in plain language, give
click-by-click instructions for anything involving Supabase or Vercel, and never
assume a terminal is available.

## Scope

**The academy, and the firm induction that goes with it.** That is the product.
It is called Lawgistics and it stays called Lawgistics.

Deliberately **not** in scope: a firm intranet. No home page of firm news, no
events, no contacts directory, no document storage, no leave requests. That was
considered and set aside: contracts and leave are a different risk class, they
bring data-protection obligations the firm carries, and most firms already have
somewhere those live.

White labelling exists in `src/lib/brand.ts` and works, but it is not the
direction. One product with one name. Other firms buying it is a possibility,
not the plan, and nothing should be built speculatively to serve it.

## Standing rules

These come from the owner and are not up for renegotiation.

- **No em dashes.** Anywhere. Prose, comments, commit messages, UI copy.
- **Row Level Security on every table.** RLS is the floor, not the ceiling.
- **Never expose** the Supabase service role key, the OpenAI or Anthropic keys,
  or admin credentials. Hiding an admin button is presentation, not security:
  authorisation happens server-side, in every action, before anything else.
- **AI never publishes legal content.** It may draft. A named person signs off,
  and that sign-off is a statement they are answerable for.
- **Say what is true.** The product's whole value is a record a firm can rely
  on. Anything that overstates what has been checked is worse than nothing,
  because unchecked content at least looks unchecked.

## The shape of it

Two halves that share a login and touch as little as possible.

**Ours.** Questions and daily briefs that we write and verify. Diagnostic, skill
map, spaced repetition, mastery per concept and per skill. Content is versioned
and immutable; editing mints a new version and clears the sign-off. Answers
never reach the browser. Australian and Malaysian law are kept strictly apart:
every question records its jurisdiction.

**Theirs.** The firm's welcome, AI policy and joining checklist, in the firm's
words. Never enters our review queue, never enters training. An acknowledgement
is pinned to the version read, so republishing puts it back in front of
everyone. Nothing here concludes a person is ready: a named supervisor decides,
and the record keeps their name, the date, and how many items were still
outstanding when they decided.

Every record in the firm half is insert and select only, for everybody
including administrators. A mistake is undone by recording a correction, never
by deleting.

## The other thing in this repository

`../lawgistics-site` is a static rebuild of lawgistics.my, 29 pages plus an
admin CMS that talks to the live Payload API. It was uploaded as a zip and is
committed here so it stops living in a temporary folder. It is not wired to
this app in any way yet.

Two things to know before touching it.

`academy.html` is a **second academy**, and it works nothing like this one.
Lessons are checkboxes the learner ticks themselves, there is no assessment,
progress lives in `localStorage` keyed on their email, and the client tells the
server which level it reached. That page also says finishing Level 3 lets you
apply to the paralegal cohort that Malaysian firms book through. A real
commercial step is therefore gated on a number the candidate can edit in
devtools. Which of the two academies survives is undecided, and the answer
changes whether this app's level names can stay jokes.

Its layout is checked by `tools/site-qa/device-check.mjs`, which looks for the
two failures that are invisible at desktop width: anything wider than the
screen, and text with no gutter beside it. Seven pages failed when it arrived.

## Where things stand

- Migrations run to `0010`. `supabase/UPDATE.sql` is the one-paste update for a
  database that already exists; `SETUP.sql` is for a new one. Both are generated
  by `npm run build:sql` and a test fails if they go stale.
- 164 tests, 77 schema guarantees against a real Postgres, 135 page and device
  combinations checked. Contract tests are mutation-tested; keep it that way.
- **The gate: 233 items in `/admin/review` are written but not verified.** This
  is the only thing standing between the app and being real. It is lawyer time
  and it cannot be delegated to a model. Do not let building crowd it out.
- Account creation on the joining path needs a real Supabase project and is not
  covered by the mock, so it wants one throwaway invitation before a real one.

## Working here

```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run build:sql                  # after touching supabase/migrations/
npm run qa:devices                 # see tools/visual-qa/README.md
psql "$DATABASE_URL" -f supabase/tests/schema-guarantees.sql
```

Read `README.md` before changing anything: it explains the reasoning, not just
the structure. The commit messages carry the *why* and are worth reading when a
decision looks strange, because most of the strange ones were deliberate.

When adding anything that produces a record a firm might rely on, add a schema
guarantee for it, and plant a deliberate error to prove the test catches it.
