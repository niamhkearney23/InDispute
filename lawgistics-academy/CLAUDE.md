@AGENTS.md

# Lawgistics Academy

Adaptive litigation training for Australian and Malaysian law students,
graduates and junior lawyers (PLT students in Australia, pupils and interns in
Malaysia), plus the induction a firm puts in front of somebody before their
first day. PLT is an Australian stage and is never offered to a Malaysian.

Built by a lawyer, not a developer. Explain things in plain language, give
click-by-click instructions for anything involving Supabase or Vercel, and never
assume a terminal is available.

## Scope

**The academy, and the firm induction that goes with it.** That is the product.
It is called the **Lawgistics Academy**, set as the default brand in
`src/lib/brand.ts`, and the part that belongs to the firm's trainee programme
is the **Litigation Trainee Academy** (`brand.traineeAcademy`). The owner
named both; it was briefly called the Litigation Academy before that. White
labelling still works exactly as before: a firm's own name overrides the
default per deployment, the default just changed.

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
- **Two staff roles, and the line between them holds.** An administrator writes
  content and runs the firm's setup. A **coach** is the lawyer who supervises
  the juniors: they sign content off and record supervisor decisions, weekly,
  and they cannot write content. Editing a question mints a new version and
  clears its sign-off, so an account that could edit and verify could sign its
  own rewrite with the audit trail showing an ordinary review. A coach who
  thinks an item is wrong flags it with a note; somebody else changes it.
  Exactly fifteen actions accept a coach, named in `tests/authorisation-contract`,
  and a test fails if a sixteenth quietly does. Two of the fifteen are the coach's
  own **sessions**: they record something, paste a YouTube or Vimeo link, and
  it leads the dashboard the morning it is for. That is not an exception to
  the rule, it is outside it: a session has no version chain, no answer key,
  no sign-off, and never reaches the training engine. It is the coach's own
  teaching, under their own name, and the training runs 7am to 11am daily,
  so the coach needs to be able to put something in front of people without a
  developer and a deployment. Two more are the **certification register**
  under `/admin/certification`: a coach's own trainees, on their own real
  court files, graded against a fixed set of competency boxes that live in
  code rather than in the database. This is the plainest fit of anything on
  the list for "record supervisor decisions": it is Malaysia-specific,
  entirely outside the question bank and the review queue, and a mis-graded
  entry is corrected in place, the same way a coach fixes a session they
  already published. The last three are the **work board** under `/admin/work`:
  a coach posts a piece of work or something to read, typed or as a voice
  memo recorded in the page, for their trainees or for everyone in a
  country, says how many people may take it, an intern puts their name on
  it and hands a file in, and the coach marks it with a verdict and a
  paragraph. Each piece has a message thread between the intern and the
  coaches. What was handed in is append-only and the marking trigger cannot
  touch it; every upload carries the intern's own declaration that nothing
  in it identifies a client, and the database refuses a row without that.
  The third action asks the AI to suggest how long a task will take; it
  saves nothing, and what an intern sees is the number the coach confirmed.
  The eleventh is **confirming a trainee**: the trainee sign-up page is public,
  so saying you are a trainee opens nothing until a coach or administrator
  confirms it (`trainee_approved_at`, 0023), a decision about a person under
  their name. Joining by invitation is confirmed on the way in. Two more
  are **matters** (0027): signing a matter off, which is the same judgement
  as signing off a question and is refused from whoever last wrote the
  words, and marking a learner's handed-in attempt. Writing and publishing a
  matter stay with an administrator. The fourteenth is **confirming access**
  (0030): somebody who entered a firm's code is free only once a coach or
  administrator says they really are with that firm. Making and switching
  off codes stays with an administrator. The fifteenth is **signing off a
  lesson** (0032): lessons are written in the code, and a sign-off is pinned
  to a SHA-256 of every word a learner sees, so any change needs signing
  again.
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
- `?only=my` / `?only=au` is a different thing from `?c=`. It is that country's
  academy on its own address, reached as `/malaysia` and `/australia` through
  the Vercel rewrites and linked that way from the footer. There is no country
  switch on it, it does not write the choice to `localStorage`, and the
  Australian one drops the daily question and the two notes explaining the
  Malaysian bank, because none of the three offers an Australian anything.
  Anything new that mentions the other country needs hiding there too.
- Australia deliberately shows fewer strands than Malaysia. Four app modules
  have Australian questions; the fourth, "Running a file", is pointed to from
  the Australian note rather than given a strand of its own. Do not pad it.
- The Malaysian page has a "Join as a trainee" link to `/trainee` that does
  not wait on `questionsOpen`, because the trainee programme works without
  published questions.
- Advocacy is the one strand marked on the site rather than here, and its coach
  prompt is told the learner's country so a correct Australian citation is not
  read as an error.

Its layout is checked by `tools/site-qa/device-check.mjs`, which looks for the
two failures that are invisible at desktop width: anything wider than the
screen, and text with no gutter beside it. Seven pages failed when it arrived.

## Where things stand

- Migrations run to `0035`. `supabase/UPDATE.sql` is the one-paste update for a
  database that already exists; `SETUP.sql` is for a new one. Both are generated
  by `npm run build:sql` and a test fails if they go stale.
- `0022` came out of an audit of what the database allowed against what the
  app does. Learners now only read their own training record (the server
  writes it), work is handed in unmarked and a mark carries whoever made it,
  a firm policy version's words are frozen, the firm-half records refuse
  updates for everybody, nobody can sign off a version they wrote, and "put
  everything back" only restores what a person withdrew (`withdrawn_at`), so it
  can never publish the Malaysian bank. Keep new learner-owned tables
  select-only for learners unless a page genuinely writes through RLS.
- `0024` is the second audit. A "not valid" check is re-checked on every update
  of an old row, so 0022's no-self-sign-off rule froze self-signed items solid;
  those sign-offs are cleared and the rule validated. Never add a constraint
  "not valid" to a table whose old rows must still be editable. It also stops
  learners changing `profiles.email` (staff identify people by it; the
  make-coach and make-admin scripts now look people up through auth, not
  profiles), keeps publish names and dates fixed, and requires a confirmed
  trainee to keep seeing trainee work they took.
- `0025` is the firm's weekly leaderboard: off until an administrator turns it
  on (`firm_settings`, one row), first names and XP only, read through one
  security definer function that gives nothing back while the setting is off
  and leaves staff and anyone who opted out (`profiles.leaderboard_opt_out`)
  off it. Module completion is still every question right at least once; the
  summary and the dashboard now say the number rather than "not finished".
- `0026` lets a coach mark a session **trainees only** (confirmed trainees
  and staff, enforced in the read policy; the learner reader filters it too
  because it uses the service client), and adds **comments** under work
  posts: public to everybody who can see the post, insert and select only,
  the author always the caller. Names on the board (who is on a post, who
  commented) come only through two security definer functions that return
  first names by the leaderboard's rule, never ids or emails.
- `0027` is **matters**: a short practice file on invented facts with a time
  limit and four tasks (procedure, a short advice, a spoken explanation of up
  to three minutes, and five follow-up questions the AI asks about the
  learner's own draft; the AI asks and never answers or states law, and the
  standard questions are used, and labelled, when it is not available). The
  lawyer's approach is column-revoked from learners and reaches them only
  through `matter_model_answer()` after they hand in. Publishing needs a
  sign-off from somebody other than the writer; editing the words clears it
  and takes the matter down; an attempt keeps a snapshot of what it was given
  and is frozen at hand-in. `certificates` are issued once, by the server,
  when every required module is finished and five matters are marked Good.
  `0028` loads five AI-drafted Malaysian matters, unpublished, unsigned and
  with no author, for a lawyer to correct and sign off.
- `0029` is **work by email**: a lawyer emails the inbound address,
  `/api/inbound/work` (off unless `INBOUND_EMAIL_TOKEN` is set, Basic auth,
  constant-time compare) turns it into an **unpublished draft** under their
  name, only if the sender's address matches a coach or administrator, and
  answers every sender the same. The AI tidies the email into a post and adds
  nothing; one draft per message id; the page reminds the lawyer to take
  client names out before publishing.
- `0030` is **who pays**. Somebody on their own pays (RM 349 a month or RM 2,990
  a year in Malaysia, A$209 or A$1,790 in Australia, in `src/lib/access/rules.ts`),
  priced as a practical course rather than an app. Trainees are shown that
  real yearly price beside "Free", and never any other figure.
  Staff, confirmed trainees and anyone who joined by a firm's invitation are
  free. Anyone else from a firm or university enters its code and is free once
  a coach confirms them, because codes get passed around; switching a code off
  ends it for everyone on it. **Payments are off** unless the deployment sets
  `PAYMENTS=on` and a Stripe key, and the owner's decision is to keep them off
  until the questions and matters are signed off. Payment goes through
  Stripe's own checkout, and only the signed webhook (`/api/stripe/webhook`)
  records it. Every training page calls `requireAccess()` and a test fails if
  a new one does not; the actions that start training or call the AI check
  `hasAccess` too. None of the three tables is written by a learner.
- `0031` is the **tutor** (`/tutor`), two modes. "Explain it back": the
  learner explains an idea as if to a ten-year-old and the AI stops them at
  jargon, skipped steps and oversimplification, one question at a time; it is
  told never to explain the idea or state law, and to send anything legally
  doubtful to the lesson or a coach. "Test me": up to five questions from one
  module, only questions that still stand today (current version, published,
  `human_verified`, not `review_flagged`, `review_due_on` null or in the
  future, exactly one right answer: `stillChecked` and `askable` in
  `src/lib/tutor/rules.ts`), marked by the server from the answer key; the
  AI's comment is drawn from the checked explanation, which the page shows in
  its own box only while it still stands. A question taken back mid-test is
  skipped ("Carry on"), not marked. Every AI reply goes through
  `src/lib/tutor/guard.ts` first: anything law-shaped (sections, orders,
  Acts, cases, citations, time limits) not in the checked words or the
  learner's own is thrown away and replaced with fixed words. Learner text
  is fenced (`quoted`) so it reads as words, never instructions. One answer
  per question and one asking per question are unique indexes; the answer
  form names the question it shows, so an old tab cannot answer a new one.
  Staff read conversations through the server only (the RLS policies name
  the owner and nobody else): a coach sees only people the firm supervises
  (confirmed trainees, accepted invitations, confirmed on an active code), an
  administrator sees everybody, and the notice above each conversation says
  which. Messages are never changed or deleted, except that an administrator
  may blank one once (`redactTutorMessage`, admin only, the database checks
  the words and stamps who and when); deletes only arrive by cascade from the
  account going. Sixty learner messages and twenty conversations a day each,
  forty messages per "Explain it back"; a count that cannot be read counts as
  the limit reached. More
  modes (sprint, error simulator, learning path) were proposed and deferred
  until matters and questions are signed off.
- `0032` is **lesson sign-offs**. Lessons live in `src/content/seed/lessons.ts`;
  `DRAFT_LESSONS` are rewrites (a client story, a guess before each screen)
  that replace a live lesson only once signed off at Admin, Lessons, and are
  shown to no learner before. Live lessons nobody has signed show learners
  "Not yet checked by a lawyer". A sign-off covers one wording
  (`lessonContent` hashed); the table is insert-only, server-written, staff
  only.
- `0033` is a **cartoon of yourself**: a person builds a face on the Account
  page (skin, hair or head covering, eyes, glasses, clothes and so on) and it
  shows beside their name instead of a photo or initial, including to coaches
  on Admin, Trainees. Nothing is drawn from a photo. What is stored
  (`profiles.avatar_style`) is the list of choices, every one from the lists in
  `src/lib/avatar/cartoon.ts`; the database holds it to short plain words and
  the drawing puts anything off a list back to its default. The drawings are
  Avataaars by Pablo Stanley (free for personal and commercial use), drawn by
  DiceBear (MIT); a test checks every choice is one the library can draw.
  A face is served from `/cartoon/<choices>.svg` (public, cached for good,
  draws only listed choices, its own strict content security policy in
  `next.config.ts`), so a page of faces carries addresses, not drawings. The
  drawing library lives in `src/lib/avatar/draw.ts` and reaches the browser
  only on the maker.
- `0034` counts the figures on Admin, Trainees in the database
  (`learner_answer_summary`, service role only). Counting raw answers in the
  app stopped at the thousand rows a request returns, so a busy month
  undercounted everyone. The page says when figures could not be read rather
  than showing zeros, and when it lists only the first 500 people.
- **Options are shown shuffled** (`src/lib/learning/option-order.ts`), fixed per
  question version or lesson screen, and the letter shown is the place on the
  screen, never the id. The bank was written with the right answer B three
  times in four. The right answer is also usually the longest, which shuffling
  cannot fix: the sign-off screens say so per question
  (`src/lib/review/answer-cue.ts`) for the reviewer to even out.
- **No "by skill" scores are shown.** Questions carry skill tags, but they were
  attached loosely when drafted, and a multiple-choice answer cannot show
  speaking or writing. Scores by area (domain) stay. In October 2026 every
  question's area, topics and skills were reviewed strictly (a label stays only
  where answering depends on it): 201 of 203 changed, 156 now carry no skill,
  and the seed check refuses oral or written communication on a question and
  allows none. Eleven questions use the closest topic because none fits; that
  list is in PR #43. `0035` applies the same labels to a database that already
  has the questions, because the app only loads questions the database lacks;
  any future relabel needs the same kind of migration.
- **Rounds** (`src/lib/training/rounds.ts`): on a working day of the placement a
  confirmed trainee trains in four rounds of ten questions, opening at 7, 8, 9
  and 10am Kuala Lumpur time whatever their own timezone. A round is open for
  its hour and missed for good after it; a session belongs to the round it was
  started in. `beginSession` refuses a daily session outside an open round and
  sizes it to what the round still needs. A corner clock counts down to the
  next opening or the open round's close, Today shows the rounds and a little
  calendar of every morning, and a coach sees the calendar and missed count on
  Admin, Trainees. No rounds run until questions are published for the
  trainee's country, so nothing is marked missed that could not be done.
- **Score over time** (`src/lib/learning/score-history.ts`): the overall score
  is the share of every answer ever given that was right, drawn as a line with a
  point per day, on Progress for the learner and on Admin, Trainees for staff.
  Answers are read page by page (`answerMarks`), never just the first thousand.
- **The front page video** (`video/front-page/`, HyperFrames): 32 seconds,
  silent, in the hero where the example matter card was. It shows the same
  matter worked and marked, the trainee mornings and the score rule, and no
  brand name, so a firm's deployment can use it unchanged. Change it when any
  of those change; `video/front-page/README.md` says how to render it again.
  The middleware matcher lets `.mp4` through so signed-out visitors get it.
- **The how-to video for trainees** (`video/how-to-use/`, served at
  `/video/how-to-use.mp4`): 70 seconds, portrait, for sending by WhatsApp. It
  names the firm and the start date and shows real screens, the ones with
  sample data marked "Example"; change it when the dates, the rounds or a
  screen it shows change.
- **Interns are not litigation trainees.** The firm's interns join by
  invitation (choose "Malaysian"), use the academy as homework whenever it
  suits them and have no rounds; nothing in the app calls them trainees. Their
  how-to video is `video/how-to-use-interns/` (`/video/how-to-use-interns.mp4`).
- **The LinkedIn ad** for the trainee programme is `video/linkedin-trainee-ad/`,
  with the video, stills and post text in `out/`. Posted by hand, once the
  firm has approved it.
- **The tour** (`/welcome`, words in `src/content/tour.ts`): joining ends on a
  short card-by-card tour of what each part of the academy is and where to
  find it, then the diagnostic (or Today when there is nothing to sit).
  Trainees also get the rounds, the work board and the month. Open again from
  Account. Change it when a menu item or a rule it describes changes.
- **The front page** says "In association with Thomas Philip" under the
  headline (`brand.association`, shown only under the Lawgistics name). The
  trainee page (`/trainee`) has the same navy hero and the same video.
- **The look.** The academy (everything under `src/app/(app)`) is navy: the
  `theme-navy` class on its layout swaps the colour tokens in
  `globals.css` (cream buttons, ice-blue details, burgundy warnings, a two-level
  grid, gold-free by the owner's choice). Admin has the same look. The front
  page and sign-in stay cream. The certificate and a matter's case file stay paper inside it.
  Use the tokens, never fixed Tailwind colours, or a page breaks in one look.
- 396 tests, 319 schema guarantees against a real Postgres, 240 page and device
  combinations and 33 accessibility combinations checked. Contract tests are
  mutation-tested; keep it that way.
- Uploads are capped at 4MB because Vercel refuses a request over about 4.5MB
  before the app sees it; the forms check before sending. Larger files would
  need uploading from the browser straight to Storage.
- The two marked exercises are checked by `npm run qa:marker`, which drives the
  real pages with `/claude` stubbed. It exists because the drafting exercise
  returned a bare 504 on a good letter and nothing caught it: rendering a page
  is not pressing its button.
- **The gate: the review queue is written but not verified.** This is the only
  thing standing between the app and being real. It is lawyer time and it
  cannot be delegated to a model. Do not let building crowd it out.
- `npm run plan:review [-- MY|AU]` sorts it into the three piles it actually
  is: sign from experience, check the citation, find a citation first. Malaysia
  is 27 signable today, 42 behind 38 sources, 12 blocked. Australia is 67, 36
  behind 35 sources, 19 blocked. The 27 are the shortest path to a live
  Malaysian module, after which `questionsOpen.MY` in the site's `config.js`
  flips to true.
- `npx tsx scripts/make-coach.ts them@theirfirm.com` grants the coach role, and
  they must sign up themselves first: a sign-off records who decided, and that
  is worth nothing if the account was not theirs.
- Account creation on the joining path needs a real Supabase project and is not
  covered by the mock, so it wants one throwaway invitation before a real one.

## Working here

```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run build:sql                  # after touching supabase/migrations/
npm run qa:devices                 # see tools/visual-qa/README.md

# The static site checks want it served first:
#   python3 -m http.server 8466 --directory ../lawgistics-site
npm run qa:site && npm run qa:a11y && npm run qa:marker
psql "$DATABASE_URL" -f supabase/tests/schema-guarantees.sql
```

Read `README.md` before changing anything: it explains the reasoning, not just
the structure. The commit messages carry the *why* and are worth reading when a
decision looks strange, because most of the strange ones were deliberate.

When adding anything that produces a record a firm might rely on, add a schema
guarantee for it, and plant a deliberate error to prove the test catches it.
