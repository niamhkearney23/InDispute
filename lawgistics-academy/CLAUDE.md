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
- **Staff roles, and the lines between them hold.** A firm administrator
  (0037, below) runs the firm's own people and setup and never content. An administrator writes
  content and runs the firm's setup. A **coach** is the lawyer who supervises
  the juniors: they sign content off and record supervisor decisions, weekly,
  and they cannot write content. Editing a question mints a new version and
  clears its sign-off, so an account that could edit and verify could sign its
  own rewrite with the audit trail showing an ordinary review. A coach who
  thinks an item is wrong flags it with a note; somebody else changes it.
  Exactly seventeen actions accept a coach, named in `tests/authorisation-contract`,
  and a test fails if an eighteenth quietly does. Two of the seventeen are the coach's
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
  again. The sixteenth is **signing off a court map or an essay topic**
  (0046, `signOffReference`): the same judgement for the other legal content
  written in the code, asking `checkReviewer` like the lesson one.
  The seventeenth is **keeping a work-board message for supervision**
  (`keepForSupervision`, 0045, `checkReviewer`): a lawyer marks a learner's
  message or comment kept, with a reason, so it survives the learner deleting
  their account and the retention period. A decision about a person's words
  under the lawyer's name; it touches no content.
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

- Migrations run to `0049`.
  `supabase/UPDATE.sql` is the one-paste update for a database that already exists; `SETUP.sql` is for a new one. Both are generated
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
  answers every sender the same. The draft is the subject and the email as
  typed (since 0039 the AI no longer tidies it: an email may name a client,
  and nothing goes to a third party before a lawyer has looked), attachments
  are not stored (the reply says to add the file on the draft page, under the
  declaration); one draft per message id; the page reminds the lawyer to take
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
  Acts, cases, citations, courts, money, time limits, matched as whole
  tokens) not in the checked words is thrown away and replaced with fixed
  words. The learner's own words come back only inside quotation marks, so
  a learner cannot type a time limit and have the tutor hand it back as
  fact, and "Explain it back" never tells them they are right or wrong
  (0038 work). Learner text is fenced (`quoted`, every angle bracket and
  invisible character stripped, lookalike speaker names caught) so it reads
  as words, never instructions. One answer
  per question and one asking per question are unique indexes; the answer
  form names the question it shows, so an old tab cannot answer a new one.
  Staff read conversations through the server only (the RLS policies name
  the owner and nobody else): a coach sees only people the firm supervises
  (confirmed trainees, accepted invitations, confirmed on an active code), an
  administrator sees everybody, and the notice above each conversation says
  which. Messages are never changed or deleted, except that an administrator
  may blank one once (`redactTutorMessage`, admin only, the database checks
  the words and stamps who and when); deletes only arrive by cascade from the
  account going, or from its erasure (0043). Sixty learner messages and
  twenty conversations a day each, forty messages per "Explain it back"; a count that cannot be read counts as
  the limit reached. More
  modes (sprint, error simulator, learning path) were proposed and deferred
  until matters and questions are signed off.
- `0032` is **lesson sign-offs**. Lessons live in `src/content/seed/lessons.ts`;
  `DRAFT_LESSONS` are rewrites (a client story, a guess before each screen)
  that replace a live lesson only once signed off at Admin, Lessons, and are
  shown to no learner before. Since 0046 no lesson reaches a learner
  unsigned (see below). A sign-off covers one wording
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
- `0036` is the third audit. Coaches edit but never delete sessions,
  certification trainees and entries, or work posts (each table had one
  "for all" coach policy; the register now has its own read policy). A work
  post's files must sit in its own folder, a matter recording under its own
  learner and attempt, and a photo in the learner's own avatars folder.
  `area_scores` counts each answer once by its question's area, so scores
  by area are the share of answers right, as the pages say (the app falls
  back to the old per-concept sum on a database without 0036). Inbound
  email needs a check from the sender's own domain before the address is
  looked up (0039 narrowed this to DMARC or aligned DKIM; see below). Rounds count only answers given in the round's
  own hour, with no grace (the ten-minute grace 0036 shipped with was taken
  out later): a round left at 7:59 cannot be filled in at 10:45 or finished
  unanswered. The calendar starts at the later of the start date and the day
  rounds start counting (see Rounds), and ends on day twenty when no end
  date is set.
- `0039` is the fourth audit, on uploads and email. A coach's file or voice
  memo on a work post, and a learner's matter recording, carry the same
  declaration an intern makes (`declared_clean`, `recording_declared_clean`);
  the database refuses one without it. Rows from before were marked covered
  rather than left to fail (a "not valid" check would have frozen them, see
  0024), except unpublished email drafts, whose attachment was taken off.
  Inbound email reads only the topmost Authentication-Results header (the one
  the receiving server wrote; `INBOUND_AUTHSERV_ID` pins whose it must be) and
  needs DMARC pass or DKIM from the From domain itself; SPF alone no longer
  counts, `inbound_auth` records which, and older drafts are shown as
  unconfirmed. A hand-in carries its form's nonce (`client_nonce`, unique) so
  a double press is one submission, and a refused insert removes the file it
  uploaded. Ten wrong access codes an hour per person (`code_attempts`,
  server only). Display names are 1 to 80 characters and the signup trigger
  cuts to fit. Every AI call aborts after 25 seconds (`AI_TIMEOUT_MS`), and a
  tutor explanation is saved only with its reply. Learners never see a
  database or storage message; only `MissingSettingError` (src/lib/env.ts) is
  shown as written. Server settings live in `env-server.ts` (`server-only`).
  Error pages: `global-error.tsx`, `(app)/error.tsx`, `admin/error.tsx`,
  `not-found.tsx`.
- `0037` is the **firm administrator** (`is_firm_admin`), the firm's own
  person who runs their people: invitations, confirming trainees, the
  joining checklist and the firm's documents, codes, programme dates, the
  leaderboard switch, the work board and the firm's figures. In the
  database they are a coach; in the app the ten setup actions ask
  `checkFirmAdmin` and the six actions that are a lawyer's judgement
  (signing off a question, matter or lesson, marking a matter, the
  register) ask `checkReviewer`, which a firm administrator alone does not
  pass. Only an administrator grants either staff flag, at Admin, Staff.
  Each firm still gets its own copy: `docs/NEW-FIRM.md` is the setup, and
  `NEXT_PUBLIC_BRAND_LOGO` puts its logo in the wordmark.
- `0038` keeps each country's law in that country at the database too:
  the delivery view and the daily brief's read policy filter by the
  caller's country (`caller_country()`), staff and the service role read
  both. A fact's jurisdiction change clears its sign-off; a question's
  country moves only with its new version.
- `0040` makes sign-offs hold at the database. Administrators read content
  but write it only through the server; `guard_signoff` clears a sign-off
  when the explanation, its supporting text or the source changes (a
  fact's title, body, why it matters or jurisdiction), stamps the date
  itself, refuses a signed-in caller signing in somebody else's name, and
  keeps who wrote it. A sign-off, a fact sign-off and a matter decision
  must name the `updated_at` the reviewer saw and fail if it moved. Nobody
  marks their own hand-in or matter. Homework is written by the server
  only. `/setup` needs `SETUP_TOKEN` and claims the first administrator in
  one locked statement (`claim_first_admin`). A matter is handed in only
  with every part done. Only the server clears `must_change_password`.
- `0041` is **cohorts**: an intake's name, first and last day, the timezone
  its rounds run on (from a short list of cities, `TIMEZONES`), the hours
  they open at (5am to 8pm, one to eight of them, each open for its own
  hour) and the public holidays it skips. A firm administrator makes them at
  Admin, Cohorts and puts confirmed trainees in (`saveCohort`,
  `assignCohort`). Putting somebody in copies the cohort's dates onto their
  profile and changing a cohort's dates moves its people, so homework,
  rounds and the joining checklist still read the person's own dates. The
  clock is a `Schedule` (`src/lib/training/schedule.ts`); somebody in no
  cohort, or whose cohort cannot be read, runs on `DEFAULT_SCHEDULE`, which
  is the programme as first built (Kuala Lumpur, 7 to 10am, holidays.ts).
  `cohort_id` is changed only by the server or an administrator. The public
  trainee page and the front page describe the next unfinished cohort, or
  `PROGRAMME` when there is none.
- `0042` is **firm reports** (Admin, Reports, the firm administrator's):
  active people per month, which is what a firm is invoiced on (somebody
  counts once a month when they answered, ticked homework, handed in work or
  started a matter; `firm_activity`, service role only), each person's
  progress (homework, rounds, work and matters marked Good, certificate) and
  the certification register, each as CSV or a branded PDF from
  `/admin/reports/export/<kind>`, which checks `checkFirmAdmin` before it
  reads anything. Only the people the firm supervises are counted, staff
  left out. PDFs are made with pdf-lib (`src/lib/reports/pdf.ts`) in the
  firm's colour with its name and, when it is a PNG or JPEG, its logo; the
  built-in fonts cover Western European letters, so other characters fall
  back to plain letters in the PDF while the CSV keeps them. CSV cells that
  start like a formula get an apostrophe. A learner downloads their own
  certificate of completion as a PDF from `/certificate/pdf`.
- `0044` is the **publication gate**: nothing reaches a learner until a
  lawyer has signed it off, in either country. Loading content publishes
  nothing (`seedContent` writes only `requires_review`; there is no publish
  option and no "withdraw all / put back" pair any more). The database
  refuses to publish an unsigned question or fact, takes a published item
  back to review when its current wording loses its sign-off, and
  `v_question_delivery` and the daily brief's read policy check
  `human_verified` as well as the status. Fixtures in schema-guarantees sign
  off before they publish.
- `0046` is the **content gate**, the owner's decision: "Hide unverified
  lessons and legal courts content until a qualified lawyer approves them.
  Apply the same rule to Australia and Malaysia." A learner sees a lesson,
  a country's court map (`/courts`, the court diagram on lesson screens and
  on court questions) or a comparison essay topic only once a lawyer has
  signed off its current wording. The rule is one function,
  `forViewer` in `src/lib/content/gate.ts`; pages ask
  `src/lib/content/service.ts` (`lessonFor`, `courtMapFor`, `courtMapsFor`,
  `essayFor`) and never import the content themselves. Browser components
  take the courts as a prop (shapes in `court-shape.ts`); a test follows
  every import from every `'use client'` file and fails if one reaches
  `court-hierarchies.ts`, `lessons.ts`, `essay-topics.ts` or
  `src/lib/content/wording.ts`, because a browser import ships the text to
  everybody. Sign-offs of court maps and essays are in `content_signoffs`
  (insert-only, server-written, a coach or administrator only and never a
  firm administrator alone, never in somebody else's name, no browser access
  at all), signed at Admin, Courts and essays (`/admin/reference`). Each is
  pinned to a SHA-256 of the wording (`src/lib/content/wording.ts`), so
  editing the code withdraws it. A sign-off that cannot be read counts as
  none. Learners are told the part is waiting for a lawyer's check; the
  Courts menu item, the court map card on Learn and the tour's courts card
  appear only when the map is there to open; a court question without a
  signed map is answered from a plain list. Staff (administrator, coach,
  firm administrator) see everything, marked "Not yet checked by a lawyer".
  In the database: `matter_model_answer` gives a learner the lawyer's
  approach only while the matter is signed off and not flagged,
  `matters_read` asks for the sign-off as well as published, and
  `legal_sources` (unsigned, unused by learner pages) is staff only. In the
  app: an answer's explanation is withheld, and no AI note written, when the
  version lost its sign-off after the question was given out. The visual
  check's stand-in signs the Malaysian map and the Australian court lesson
  (`tools/visual-qa/signed-fixtures.ts`); `MOCK_NOTHING_SIGNED=1` draws a
  fresh install, and pages can say what text must and must not be on them.
  Two more were found by the integration crawl (October 2026) and gated: a
  module's `rationale` (it states law in places) is shown to staff only, and
  the twenty rules on the sign-in pages (the programme concepts' `remember`
  lines) are a reference item, `programme-maxims`, sent to the page by
  `signedMaxims()` only once signed off; `RotatingMaxim` takes them as a prop
  and no browser file may import `programme-concepts.ts`.
  Not gated, because they state no law: module names and summaries, the
  programme plan, days and concepts (coach prompts and practice maxims,
  marked not yet reviewed by the firm), the training file (invented facts),
  homework, the tour, coach sessions and work posts (the coach's own
  teaching under their name), and the firm's own documents.
- **Schema version.** `npm run build:sql` ends both SQL files with
  `schema_version()` (the newest migration's number, service role only) and
  writes `src/lib/schema-version.ts`. The admin layout shows an administrator
  "The database needs updating" when the database reports less, or has no
  such function. The mock answers `rpc/schema_version` from the same file.
- **Certification register** asks for the firm's internal matter reference
  (`case_no`), never the court case number, and no longer asks for a court
  file reference; an older entry that has one shows it so it can be cleared.
- `docs/SECURITY-SETUP.md` is the click-by-click for what only an account
  owner can switch on: SMTP and Confirm email, staff two-step sign-in,
  account 2FA, backups and a test restore, UPDATE.sql in step, repository
  visibility, PDPA and AI data terms, an independent test.
- `0043` is **deleting an account** (PDPA erasure, and Apple's rule should a
  phone app be built). The owner's decision: **remove the name, email and
  photo, do not destroy what the firm relies on.** What stays is not
  anonymous and nothing may say it is: written answers, messages, files and
  certification records can still identify somebody. A learner deletes their own on the Account page
  (typing DELETE and their own address; the id is the session's), an
  administrator deletes a learner at Admin, Trainees, [id] (`eraseLearner`,
  `checkAdmin` only). Staff are refused, by the page and by the database:
  take the role off at Admin, Staff first. `src/lib/account/erasure.ts` runs
  `erase_account` (service role only, one transaction), then changes the
  sign-in address to `erased-<id>@invalid.invalid`, sets a password nobody
  knows (64 characters; Supabase refuses more than 72) and bans the account
  for a hundred years, then deletes the photo and recordings from storage.
  **Goes:** name (now "Deleted account"), email, photo and cartoon, timezone,
  goals, career stage, tutor conversations, `code_attempts`, an undecided
  code request, matter recordings (even handed in), and the name and address
  on the accepted invitation. **Stays, under the same id now named "Deleted
  account":** answers, homework, work claims, submissions and their files,
  work-board messages and comments that were kept for supervision (0045
  replaces the rest), matter attempts and marks, onboarding records,
  certificates, XP and mastery. That split is the owner's to change, in the
  migration and here. The certification register is reviewed through 0045's
  link. `erased_at` is set only inside the function
  and never cleared or moved, and an erased name, address and picture stay
  cleared. The guards on handed-in recordings and tutor conversations let
  erasure through only when `app.erasing` names the row's person **and** the
  caller is running as `erase_account`'s owner (`erasing()`), so a client
  setting the same value is still refused. A banned account counts as
  signed out (`signInRefused`, in `getCurrentUser` and the middleware) and a
  deleted person lands on `/goodbye`. Reports keep counting the months they
  were active; the leaderboard leaves them off.
- `0045` makes deletion **safe to rely on** (the owner's review of 0043).
  **Access ends in the database**, whatever Supabase Auth does: `erase_account`
  deletes `auth.sessions` and `auth.refresh_tokens` rows in its own
  transaction (guarded by `to_regclass`); PostgREST runs `check_request()`
  before every request (`alter role authenticator set pgrst.db_pre_request`,
  registered by `register_request_check()` only where that role exists), which
  raises 42501 for a caller whose profile is erased and never errors for
  anybody else; and every RLS table in `public`, plus `storage.objects`, has
  a restrictive policy `erased_account_refused` (`refuse_erased_callers()`,
  run by 0045 and again at the end of SETUP.sql and UPDATE.sql, so later
  tables are covered). The policy calls `caller_erased()` directly, not as
  `(select ...)`: as a subquery Postgres reports infinite recursion on
  tables reached from another table's policy (work_claims from work_posts).
  `getCurrentUser` and the middleware also ask `caller_erased` with the
  person's own session (`erasedByCheck`), so the app signs out an erased
  profile even when the ban never happened. **Deletion is a job**
  (`account_erasures`, one row per person, service role only): who asked and
  when, when each step finished (database, sessions, sign-in, files),
  attempts, last error, `completed_at` (a constraint refuses it while a step
  is missing). `runErasure` (`src/lib/account/erasure.ts`, every Supabase call
  through `ErasureDeps`, `serviceErasureDeps(client)` for the real thing)
  resumes whatever is unfinished. Files are listed page by page and a step
  fails on any listing or deletion error, on fewer removed than asked, or if
  a fresh listing is not empty; then the person sees "the deletion is being
  finished", never "deleted" (`goodbyeCopy`), and the administrator a
  warning (`adminErasureMessage`). Admin, Deletions (`/admin/deletions`,
  administrators) lists unfinished and recent jobs with each step and Retry.
  `/api/cron/erasure-retry` (Vercel cron, daily, `Authorization: Bearer
  $CRON_SECRET`, 404 when unset, constant-time compare) retries and applies
  the retention period. **Work board:** on deletion the person's own messages
  and comments become "Removed when the account was deleted." unless a coach
  or administrator kept one for supervision, with a reason; text on work
  that closed (last activity or due date) more than **24 months** ago
  (`WORK_BOARD_RETENTION_MONTHS` in `src/lib/account/retention.ts`, the only
  place the number lives) would be replaced the same way by the daily job
  unless kept. **The period is pending legal approval**:
  `WORK_BOARD_RETENTION_APPROVED = false` makes the daily job remove nothing
  by it until the owner approves it in writing. Only `redact_*` functions can change the text (`redacting()`, the
  same two-part test as `erasing()`). **Review:** the job keeps the former
  display name only until the review closes, so `erasure_identifying_records`
  can list what may still identify them (kept messages, words naming them,
  hand-ins, matter answers, notes, certificate, register) with Redact for
  work-board text. **Certification:** an administrator links a register record
  to an account (`certification_trainees.profile_id`,
  `linkCertificationTrainee`); a deletion queues the record and each entry
  (`erasure_review_items`) to redact (names and free text cleared; grades,
  dates, boxes and firm kept) or retain with a reason. The review closes only
  when every item is decided, and closing clears the former name. Accounts
  deleted under 0043 get a job on upgrade with sessions revoked; the daily
  job then makes sure sign-in is closed and files are gone.
- **Two-step sign-in for staff** (no migration; Supabase Auth's own TOTP).
  Every function in `src/lib/admin/guard.ts` asks for it once the role check
  passes: staff with no authenticator app are sent to `/account/two-step`,
  staff whose session is not `aal2` to `/two-step`, and the check functions
  refuse. The level is read with `getClaims` (a verified token), the devices
  from the user `getUser` returned. The middleware sends anybody with an app,
  learner or staff, to the code step first. Up to two devices, because
  Supabase keeps no recovery codes; an administrator removes a lost one in
  the Supabase dashboard (`docs/NEW-FIRM.md`). `STAFF_TWO_STEP=off` turns it
  off for local work and the visual check's mock only; unset is on, and a
  Vercel production deployment ignores it. Rules and tests:
  `src/lib/auth/two-step.ts`, `tests/two-step.test.ts`.
- `0047` makes **a staff role count in the database only once the code has
  been typed**: `is_admin`, `is_coach` and `is_firm_admin` are true only on
  an `aal2` token (`staff_session_checked`; no `aal` claim at all, as in the
  SQL editor or the service role, changes nothing). Before it, a coach's
  password alone read the certification register straight through the API,
  around the website's two-step check. Found by the integration tests.
- `0048`: `guard_signoff` (0040) looked accounts up in `auth.users`, which
  the server's role may not read on real Supabase. Postgres checks table
  rights when it plans the statement, and once a connection switched to a
  generic plan every server update to a fact, question version or matter
  failed with "permission denied for table users". It now asks
  `account_exists(uuid)` (security definer). Never read `auth.users` from a
  function that runs as the caller; found only by the integration tests.
- **Rollback is fail secure** (the owner's decision, after rejecting a
  rollback that put back password-only staff access in the database): restrict
  access first, then fix forward; never deploy a build without two-step
  sign-in (`b0161d8` or earlier), never undo `0043` to `0048`.
  `docs/ROLLBACK.md` is the owner's guide and lists every security control
  with the only conditions under which one may be relaxed (exceptions are
  recorded in `docs/SECURITY-EXCEPTIONS.md`). The switch is `SITE_ACCESS`,
  read at runtime by `src/lib/security/site-access.ts`: unset or `open` is
  normal; `staff-closed` closes /admin, `/api/inbound/work`, `/api/digest`
  and `/setup` (503 maintenance page from the middleware) and every guard in
  `src/lib/admin/guard.ts` refuses first (`require*` redirect to
  `/maintenance`, `check*` return null), because a server action can be
  posted to any page's address; `closed` makes the middleware answer 503
  everywhere except `/api/cron/erasure-retry` (and not that with a
  `Next-Action` header), `getCurrentUser` answers nobody, and `join` refuses.
  Any other value counts as `closed`. The switch can only refuse: no value
  touches two-step sign-in. Tests call every server action and the real
  middleware under each value (`tests/site-access*.test.ts`), and the
  authorisation contract holds every guard and `getCurrentUser` to asking it
  first. The old SQL file that undid `0047` is withdrawn; do not write
  another.
- `0049` makes **an unfinished deletion impossible to miss** (the owner's
  finding: the nightly route answered 200 with jobs still incomplete). After
  retrying, `/api/cron/erasure-retry` reads back every job not completed and
  judges the run (`assessErasureRun`, `src/lib/account/erasure-monitoring.ts`,
  pure, where every threshold lives): **ok** nothing outstanding, **warning**
  outstanding but every one tried tonight and none failing repeatedly,
  **escalate** any failing repeatedly (attempts >= 3, or waiting more than 72
  hours) or any **not attempted** (outstanding and not tried: the batch limit,
  `ERASURE_RETRY_LIMIT` 1 to 100 else 25, or the 45-second deadline), or the
  read failing. HTTP 200 only at ok, 503 otherwise (500 at ok when the
  retention period, the retry or the record failed), so Vercel's cron view
  shows the failure. The body has counts, ages and levels only. Every run is
  a row in `operational_runs` (service role select and insert only, no
  policy for anybody, update, delete and truncate refused by trigger even for
  the owner, `ok` only with `outstanding = 0`, carries 0045's restrictive
  policy). `ALERT_WEBHOOK_URL` (https only, five seconds, never thrown, never
  echoed) gets `{text, level, counts}` at warning and escalate and one
  `resolved` on the first ok after a run that was not; `alert_sent` and
  `alert_error` record what happened. Every admin page shows administrators
  (not coaches) `adminErasureNotices`: N not finished, and at escalate how
  many failed repeatedly, were not attempted last night and how long the
  oldest waited; "The nightly deletion check is not running" when
  `CRON_SECRET` is unset or no run is recorded in 36 hours; and says so when
  it cannot read, never nothing (`readAdminErasureNotices`,
  `src/lib/account/erasure-monitor-store.ts`). Admin, Deletions lists the
  last seven runs. The escalation procedure is `docs/SECURITY-SETUP.md`,
  section 7a. `handleErasureCron(request, secret, work, { env, fetch, now })`
  takes everything it touches, and `erasureRunStore(db)` is the real
  database half, for the integration tests.
- **Integration tests on a throwaway Supabase** (`tools/integration`,
  `tests-integration`, Docker): Supabase's own Postgres image, Auth,
  PostgREST and Storage, pinned. `npm run it:up`, `npm run test:integration`,
  `tools/integration/app.sh up` for the browser tests, and
  `tools/integration/rehearse-update.sh <live commit>` rehearses UPDATE.sql
  on the live site's schema with production-like data, using
  `supabase/checks/before-update.sql` and `after-update.sql`.
- **Server region per firm.** `vercel.json` pins no region; each firm's Vercel
  project sets its Function Region to match its database (sin1 or syd1) and
  names it in `EXPECTED_FUNCTION_REGION`; Admin warns when they differ
  (`src/lib/region.ts`).
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
  exactly its hour and missed for good after it, with no grace: an answer
  counts for the round whose hour it was given in by the server's clock
  (`answered_at`), whatever session it belongs to, so 7:59:59 counts for 7am
  and 8:00:01 for 8am, and somebody answering across the hour is never marked
  missing. A round is done at ten answers in its hour, or a short session
  (the bank had fewer than ten) started, answered and finished inside it.
  `beginSession` refuses a daily session outside an open round and sizes it
  to what the round still needs, by the same count. Which days have rounds
  is one function, `roundsDayNumber` (working days from the start date to
  the end date, or day twenty when none is set), used by today's rounds and
  the calendar alike. Nothing is missed before rounds start counting
  (`notBefore`: the later of `trainee_approved_at` and the first sign-off of
  a published question for the country, since questions have no publication
  time); a round that closed by then shows as not counted. A corner clock
  counts down to the next opening or the open round's close, Today shows the
  rounds and a little calendar of every morning, and a coach sees the
  calendar and missed count on Admin, Trainees. No rounds run until
  questions are published for the trainee's country.
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
  headline (`brand.association`, shown only under the Lawgistics name). Since October 2026 it shows the firm's own logo there in place of the
  name (`brand.associationLogo`, `public/brand/thomas-philip-lockup.png`,
  reversed out in white on the navy), and the foot of every academy page
  carries it too. It is the logo as the firm supplied it on a clear
  background, cut off above the "Litigation, Arbitration, Mediation" line,
  which cannot be read that small; the whole logo is
  `public/brand/thomas-philip.png`. Another name, another firm, or a changed
  association line shows no logo unless `NEXT_PUBLIC_BRAND_ASSOCIATION_LOGO`
  is set. The
  trainee page (`/trainee`) has the same navy hero and the same video.
- **The look.** The academy (everything under `src/app/(app)`), Admin and the
  code step use the `theme-paper` class on their layouts, which swaps the
  colour tokens in `globals.css`: ivory paper, deep navy type and buttons,
  Thomas Philip's own taupe (#746c5a) for small labels, progress lines and
  details, white cards with a hairline and a soft shadow, a navy greeting
  card. No gold, by the owner's choice. Headings Newsreader, body Figtree.
  The owner tried bright and playful and went back (October 2026): "it
  doesn't look like a law firm. Make it more like a coach, and this is the
  homework." Figma has the direction on the "Coach and homework" page: the
  coach and their note first, the homework they set, their marking. A firm's
  `NEXT_PUBLIC_BRAND_ACCENT` still wins (`--brand-accent`). The work board is
  "Coach" in the menu (its page is "From your coach"), and the staff link to
  Admin, Work is "Marking". **On a phone the menu is at the foot of the screen**
  (`src/components/bottom-nav.tsx`: Today, Learn, Coach, Progress, Account,
  hidden from `sm:` up, where the header carries the same names); the header
  keeps Courts (while `courtsShown`), Admin or Coach, and Sign out. It only
  links to pages every learner could already open. The round clock sits
  above it. The front page and sign-in stay cream. The certificate and a
  matter's case file stay cream paper inside it.
  Use the tokens, never fixed Tailwind colours, or a page breaks in one look.
- **Content security policy** (`src/lib/security/csp.ts`, set by
  `src/middleware.ts`): scripts run only with a nonce minted per request, so
  every page must render per request (the root layout awaits `connection()`);
  a page built ahead of time shows but nothing on it works. A new outside host
  (a video site, a logo, a payment page) needs adding there, and frame-src is
  built from `src/lib/lessons/embed.ts`. Downloads and the cartoon keep their
  own stricter policy in `next.config.ts`.
- 645 tests, 570 schema guarantees against a real Postgres (fresh, and SETUP
  then UPDATE again), 477 page and device combinations (the five-device sweep in October
  2026, after 0045 to 0048) and 33 accessibility combinations checked, and 20 integration tests on a throwaway Supabase
  (`npm run test:integration`). Contract tests are
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
