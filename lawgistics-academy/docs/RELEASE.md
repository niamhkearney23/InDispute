# Releasing this version: staging first, then the live site

This release changes the database (migrations `0043` to `0048`) and the
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

The file ends by recording the version (`schema_version()` returns `0048`).

## 1. Rehearse on a restored copy (staging)

This is the step that proves the update on your real data, not on test
data. It needs a paid Supabase plan, which you need for backups anyway.

1. In Supabase, open the live project, then **Database, Backups**.
2. Choose the most recent backup and **Restore to a new project** (name it
   `academy-staging`). If the option is not offered on your plan, upgrade
   the plan first; do not restore over the live project.
3. When the new project is ready, open its **SQL Editor, New query**, paste
   `supabase/checks/before-update.sql`, press **Run**, and keep the result.
4. New query, paste the whole of `supabase/UPDATE.sql`, press **Run**. It
   should end with "Success. No rows returned".
5. New query, paste `supabase/checks/after-update.sql`, press **Run**. All
   thirteen checks must say **OK**. Compare the counts with step 3: all the
   same, except "published questions" and "published daily facts", which
   drop to the number that carry a lawyer's sign-off.
6. Paste `UPDATE.sql` again and run it, then `after-update.sql` again: the
   same result. This proves a second paste is harmless.
7. Optional but recommended: point a Vercel **Preview** deployment of the
   release branch at the staging project (Vercel, the project, **Settings,
   Environment Variables**, set the three Supabase values for **Preview**
   only, to the staging project's), open the preview, sign in as staff
   (you will be asked to set up the authenticator app), and click through
   Admin and a learner's Today page.

If any check says NOT OK, or the update stops with an error, stop: send the
error and the check results, and do not touch the live project.

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
3. New query, paste `after-update.sql`, **Run**. Thirteen OK; counts as
   expected.

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

**The website:** Vercel, the project, **Deployments**, the previous
production deployment, **Promote to Production** (Instant Rollback). Then,
because the older website has no two-step sign-in, run
`supabase/rollback/ROLLBACK-0047.sql` in the SQL Editor so its staff pages
work again. The rest of the database changes stay: they only refuse things,
and the older website works with them. Running `UPDATE.sql` again later puts
`0047` back.

**The data:** the update's only change to existing rows is taking unsigned
questions and facts back to review (0044), which a lawyer reverses by
signing them off and publishing them. To undo everything, including that,
restore the backup from step 2 (Database, Backups, restore; with Point in
Time Recovery, choose the time noted). A restore also loses anything done
since, so it is the last resort.

## Tested without a real project

`tools/integration/rehearse-update.sh b0161d8` runs steps 1.3 to 1.6 on a
throwaway Supabase built from the live site's own SETUP.sql with
production-like data, checks the rollback restores the staff checks
exactly, and re-applies the update. It does not replace step 1: it is not
your data, and not Supabase's hosted platform.
