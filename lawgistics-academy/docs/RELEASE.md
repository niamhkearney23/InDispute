# Releasing this version: staging first, then the live site

This release changes the database (migrations `0043` to `0053`) and the
website. The database goes first, on a restored copy, then on the live
project, then the website. Nothing in here is done for you: each step is
yours to approve and do.

The exact commit, and a fingerprint of the SQL file so you can tell it is
the one that was tested, are in the GO / NO-GO report for the release. If
the file you hold has a different fingerprint, stop and ask.

## What the update contains, in order

`supabase/UPDATE.sql` re-runs every migration from `0004`, each guarded so
running it twice is harmless. The live site is at `0042`. New in this
release:

| # | What it does | Changes data? |
| --- | --- | --- |
| 0043 | Account deletion | No |
| 0044 | Nothing reaches a learner without a lawyer's sign-off | **Yes**: published questions and daily facts without a sign-off go back to review |
| 0045 | Deletion ends access in the database; deletion jobs, retention, review | Adds tables and columns; nothing removed |
| 0046 | Unsigned lessons, court maps, essays and matters hidden from learners | No |
| 0047 | A staff role counts in the database only after the six-digit code | No |
| 0048 | Fixes the sign-off guard failing on Supabase ("permission denied for table users") | No |
| 0049 | Every nightly deletion check is recorded, and an unfinished deletion raises an alarm | Adds a table; nothing removed |
| 0050 | Morning notes from the coach | Adds a table; nothing removed |
| 0051 | A lawyer's sign-off past its date stops the content; no table can be emptied, and the firm's records cannot be deleted, by the app | No rows change. Deleting a person in Supabase Auth now fails for anybody with such records |
| 0052 | A sign-off that has run out goes back to the review queue, with a kept record of it | **Yes**: any question or daily fact already past its sign-off date goes back to review |
| 0053 | The Advocacy Studio: consent, recordings in a private bucket, AI feedback, coaches' reviews and a log of every time staff open a recording | No rows change. Adds four tables and the `studio-recordings` bucket |

The file ends by recording the version (`schema_version()` returns `0053`).

## 1. Rehearse on a restored copy (staging)

This proves the update on your real data. It needs a paid Supabase plan,
which you need for backups anyway. Do every part, in order.

### 1a. What a restored copy has, and what it does not

Supabase's **Restore to a new project** copies the database, including the
sign-in accounts. It does **not** copy:

- the **files** in Storage (photos, recordings, handed-in work): the bucket
  settings come back from the database, the files themselves do not;
- the **Auth settings** (site address, redirect addresses, email sending,
  two-step sign-in);
- the **API keys**: the copy has its own address and keys.

And anything the database runs on its own (scheduled jobs, database
webhooks) comes back with it and could start running. This app uses neither
today; 1c switches them off in case.

### 1b. Make the copy

1. Supabase, the live project, **Database, Backups**, the latest backup,
   **Restore to a new project**. Name it `academy-staging`, same region as
   the live project. If the option is not offered, upgrade the plan; never
   restore over the live project.
2. In the new project, **Project Settings, Team**: make sure only you have
   access. The copy holds your people's real names and records.

### 1c. Isolate it, before anything else

1. New project, **SQL Editor, New query**: paste the whole of
   `supabase/staging/prepare-staging.sql` and **Run**. It replaces every
   email address and phone number with one that cannot receive mail, removes
   the sessions copied from the live project, switches off any scheduled jobs
   and database webhooks, and marks the database as staging. The last table
   it shows must say 0 on every line.
2. **Authentication, URL Configuration**: set **Site URL** to
   `http://127.0.0.1:3124` and remove every other redirect address. Nothing
   in the copy then points at the live website.
3. **Authentication, Emails**: leave the built-in email sender; do **not**
   enter the live email provider. Every address is now unreachable anyway.
4. **Authentication, Multi-Factor** (or **Sign In / Providers**): make sure
   **TOTP (App Authenticator)** enrolling and verifying are **Enabled**, as on
   the live project.
5. **Storage**: leave the files missing. The tests upload their own; no live
   file is needed or copied.
6. **Project Settings, API**: these keys belong to the copy only. Never put
   them in a production setting anywhere.

### 1d. Keep everything else away from it

- **Vercel**: if you point a Preview deployment at the copy, set the three
  Supabase values for **Preview** only, never Production, and for Preview
  also set `AI_PROVIDER=none` and leave `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
  `INBOUND_EMAIL_TOKEN`, `ALERT_WEBHOOK_URL`, `PAYMENTS` and `SITE_ACCESS`
  unset for Preview. Vercel runs the nightly job only for Production
  deployments, so a Preview never calls it.
- No email-in forwarding, AI keys, payment keys or alert webhooks are ever
  set against the copy.

### 1e. The update itself

1. **SQL Editor, New query**: `supabase/checks/before-update.sql`, **Run**,
   keep the result.
2. New query: the whole of `supabase/UPDATE.sql`, **Run**. It ends with
   "Success. No rows returned".
3. New query: `supabase/checks/after-update.sql`, **Run**. All eighteen
   checks say **OK**. Counts as before, except "published questions" and
   "published daily facts", which drop to the number with a lawyer's sign-off.
4. Paste `UPDATE.sql` again, then `after-update.sql` again: the same result.

Send me the two check results (they hold counts only, no names).

### 1f. The automated tests against the copy

So the tests can reach the copy, in this session's cloud environment
settings (the environment menu in the session's title bar, then **Edit**):

1. **Network access**: add the copy's address, `<ref>.supabase.co` (the
   `<ref>` is in the copy's **Project Settings, General**), under Allowed
   domains, keeping "Allow package managers" ticked.
2. **Environment variables**: add `STAGING_SUPABASE_URL`
   (`https://<ref>.supabase.co`), `STAGING_SUPABASE_ANON_KEY` and
   `STAGING_SUPABASE_SERVICE_ROLE_KEY` (from the copy's **Project Settings,
   API**), and `PRODUCTION_SUPABASE_URL` (the live project's address, so the
   tests refuse it). Never paste keys into the chat.
3. Start a new session (settings reach new sessions) and say "run the
   staging tests". The tests refuse to run unless the database says it is
   staging.

### 1g. Afterwards

Delete the copy (**Project Settings, General, Delete project**) and remove
the four environment variables. It holds personal data and has no further
use once the evidence is written down.

If any check says NOT OK, a test fails, or the update stops with an error:
stop, and do not touch the live project.

## 2. Back up the live project

Immediately before:

1. Supabase, the live project, **Database, Backups**: note the time of the
   most recent backup. With Point in Time Recovery switched on, note the
   time now instead; you can restore to just before the update.
2. Without Point in Time Recovery, a daily backup can be up to a day old.
   Pick a quiet time (not 7 to 11am Kuala Lumpur, when rounds run), and
   tell staff not to sign anything off during the update.

## 3. Update the live database

1. **SQL Editor, New query**, paste `before-update.sql`, **Run**, keep it.
2. New query, paste the whole of `UPDATE.sql`, **Run**.
3. New query, paste `after-update.sql`, **Run**. All eighteen OK; counts
   as expected.

The live website keeps working while the database is ahead of it. Checked
on the throwaway Supabase: the older website's learner pages (Today, Learn,
Skills, Courts, Account) and admin pages (Questions, Sign off, Trainees,
Certification, Staff, Reports) all open without errors against the updated
database (`tests-integration/rehearsal/old-site-on-new-db.ts`). Until the
new website is live: published questions and facts without a sign-off are
gone from training straight away, but unsigned lessons and court maps still
show, because they live in the website's code; and any staff page that reads
through the database as the person, rather than as the server, shows what a
learner would see, because the older website never asks for the code.
Keep the window short.

## 4. Update the website

Merge the release into `main` (say "mrg"). Vercel builds `main` for each
project. Before merging, in each firm's Vercel project:

- **Settings, Functions, Function Region**: Singapore (`sin1`) for a
  Malaysian firm, Sydney (`syd1`) for an Australian one, matching its
  database. `vercel.json` no longer sets it.
- **Settings, Environment Variables**: add `EXPECTED_FUNCTION_REGION`
  (`sin1` or `syd1`) and `CRON_SECRET` (a long random password).

After the deployment: sign in as an administrator (set up the authenticator
app when asked), open Admin, and check there is no "database needs updating"
or "server region" warning.

## Rolling back

Follow `docs/ROLLBACK.md`. In short: restrict access first (`SITE_ACCESS`
set to `staff-closed` or `closed` in Vercel, then Redeploy), then fix
forward. The website is never put back to a build that does not ask staff
for the code (commit `b0161d8` or earlier), and no database change from
`0043` to `0052` is ever undone.

**The data:** the update's only changes to existing rows are taking unsigned
questions and facts back to review (0044) and taking any whose sign-off has
run out back to review (0052, which keeps a record of each), which a lawyer
reverses by signing them off again and publishing them. Restoring the backup from step 2 is
the last resort, because it also loses anything done since; how to do it
with the website closed until `UPDATE.sql` has been run again is section 4
of `docs/ROLLBACK.md`.

## Tested without a real project

`tools/integration/rehearse-update.sh b0161d8` runs steps 1.3 to 1.6 on a
throwaway Supabase built from the live site's own SETUP.sql with
production-like data, and re-applies the update. It does not replace step 1: it is not
your data, and not Supabase's hosted platform.
