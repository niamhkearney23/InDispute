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

**The end goal, in the owner's words: a law firm buys this to teach their
interns and paralegals everything.** The individual learner is real and matters,
but they are not who signs the cheque. When a decision could go either way, the
tie-break is what a firm buying this for their juniors would want, and what
their juniors would actually be taught by it.

Deliberately **not** in scope: a firm intranet. No home page of firm news, no
events, no contacts directory, no document storage, no leave requests. That was
considered and set aside: contracts and leave are a different risk class, they
bring data-protection obligations the firm carries, and most firms already have
somewhere those live.

White labelling exists in `src/lib/brand.ts` and works. **The owner has changed
direction on it: firms wanting to buy it is now something to serve rather than
a possibility to ignore.** `../lawgistics-site/academy.html` is written as the
worked example, a real firm running the product on itself, and its "For firms"
section is the pitch.

Two things that did not change with it. It is still one firm per deployment,
their own Vercel project and their own Supabase project, and it is still not
multi-tenancy: nothing should claim, or be built towards, a single deployment
serving many firms until there is a firm model, membership, and separation that
stands up to a firm asking who else can see their people. And the showcase must
stay a showcase of something true. No invented client, no testimonial nobody
gave, no case study that did not happen.

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

`academy.html` **used to be a second academy** with self-ticked checkboxes, XP
and a paid-work application gated on a number the candidate could edit in
devtools. That is gone. It is now the front door to this app and does not
assess anything: it describes each strand, marks nothing, and sends people here
for the questions. The two academies question is settled, and this one won.

Three things about it are load-bearing:

- It asks which country before anything that changes with the answer, keeps the
  choice in `localStorage` under `lg.country`, and reads `?c=my` / `?c=au` from
  the address. It passes the answer to `/signup?next=...&country=...`, so
  changing how signup reads `country` breaks the handoff.
- Australia deliberately shows fewer strands than Malaysia, because only three
  app modules have Australian questions. Do not pad it.
- Advocacy is the one strand marked on the site rather than here, and its coach
  prompt is told the learner's country so a correct Australian citation is not
  read as an error.

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
