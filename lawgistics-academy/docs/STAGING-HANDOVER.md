# Staging handover: rehearsing this release on a copy of the live database

This is the owner's checklist for the hosted staging rehearsal. Nothing here
touches the live project, and nothing in it is done for you: each step is
yours to approve and do. The detailed reasons behind each step are in
`docs/RELEASE.md`, section 1; this page is the order to do them in.

**What is being rehearsed.** The commit and test evidence are in the staging
readiness report that came with this page. The update file is
`supabase/UPDATE.sql`; its SHA-256 fingerprint at that commit is

    7bd16982326fed6cfe1c8b10e4b2e64dd1ec9c32195bb17137128228c81192e8

If the file you paste has a different fingerprint, stop and ask.

**Never** paste a database password, an API key or a service role key into
the chat. Keys go only into the session's environment settings (step 3),
where the tests read them and nobody sees them.

## 1. Make the copy (Supabase, about 15 minutes)

You need a paid Supabase plan for this; you need it for backups anyway.

1. Sign in at <https://supabase.com/dashboard> and open the **live** project.
2. **Database**, **Backups**. Choose the most recent backup, then **Restore to
   a new project**. Name it `academy-staging`, in the same region as the live
   project. If the option is not there, the plan needs upgrading. Never
   choose "Restore" on the live project itself.
3. When the new project is ready, open it. **Project Settings**, **Team**:
   make sure only you have access. The copy holds your people's real names.

## 2. Isolate the copy, before anything else

All in the **new** project (check the project name at the top of the page).

1. **SQL Editor**, **New query**. Paste the whole of
   `supabase/staging/prepare-staging.sql`, press **Run**. It replaces every
   email address and phone number with one that cannot receive mail, removes
   the sign-in sessions copied from the live project, switches off any
   scheduled jobs and database webhooks, and marks the database as staging.
   The last table it shows must say 0 on every line. The automated tests
   refuse to run against any database that has not been marked this way.
2. **Authentication**, **URL Configuration**: set **Site URL** to
   `http://127.0.0.1:3124` and delete every other redirect address.
3. **Authentication**, **Emails**: leave the built-in sender. Do not enter
   the live email provider.
4. **Authentication**, **Multi-Factor** (or **Sign In / Providers**): check
   **TOTP (App Authenticator)** enrolling and verifying are **Enabled**.
5. **Storage**: leave it empty. The copy does not bring files across, and the
   tests upload their own.
6. **Vercel**: point nothing at the copy, for Production or Preview. The
   rehearsal does not need a deployment.

## 3. Let this session's tests reach the copy (Claude environment settings)

In the Claude app, open this session's environment (the environment name in
the session's title bar, then **Edit**):

1. **Network access**, **Allowed domains**: add the copy's address,
   `<ref>.supabase.co`. The `<ref>` is the 20-letter code in the copy's
   **Project Settings**, **General**. Keep "Allow package managers" ticked.
   No other address is needed: the tests talk to the copy through its API
   only and never connect to its database directly.
2. **Environment variables**, add exactly these four:

   | Name | Value | Where to find it |
   | --- | --- | --- |
   | `STAGING_SUPABASE_URL` | `https://<ref>.supabase.co` | the copy's **Project Settings**, **API** |
   | `STAGING_SUPABASE_ANON_KEY` | the copy's `anon` `public` key | same page |
   | `STAGING_SUPABASE_SERVICE_ROLE_KEY` | the copy's `service_role` key | same page |
   | `PRODUCTION_SUPABASE_URL` | the **live** project's address, `https://<live ref>.supabase.co` | the live project's **Project Settings**, **API** |

   The last one is a safety catch: the tests refuse to run if the staging
   address is the live one. The address must be the `https://<20 letters>.supabase.co`
   form or the tests refuse that too.
3. Start a new session (settings reach new sessions only) and say "run the
   staging rehearsal". Do not paste any of the values into the chat.

## 4. The rehearsal: seventeen checks, the update, the tests

### 4a. In the copy's SQL Editor (you)

1. **New query**: paste `supabase/checks/before-update.sql`, **Run**. Keep
   the result (counts only, no names).
2. **New query**: paste the whole of `supabase/UPDATE.sql`, **Run**. It ends
   with "Success. No rows returned". It also takes back to the review queue
   anything whose lawyer's sign-off has run out (0052) and records each.
3. **New query**: paste `supabase/checks/after-update.sql`, **Run**. All
   seventeen lines must say **OK** (below). Counts as before, except
   "published questions" and "published daily facts", which drop to the
   number with a current lawyer's sign-off.
4. Paste `UPDATE.sql` again, then `after-update.sql` again: the same result.
   Pasting twice must be harmless.

Send me the two check results. If any line says NOT OK, or the update stops
with an error: stop, and do not touch the live project.

### 4b. The seventeen checks

| # | What it proves | Since |
| --- | --- | --- |
| 1 | The database is at the version the website expects (0052) | |
| 2 | No question is published without a lawyer's sign-off on its current wording | 0044 |
| 3 | No daily fact is published without a lawyer's sign-off | 0044 |
| 4 | Publishing without a sign-off is refused (the three guards are in place) | 0044 |
| 5 | Learners are given only signed-off questions and facts | 0044 |
| 6 | A staff role counts only once the six-digit code has been typed | 0047 |
| 7 | Account deletion is installed and only the server can run it | 0043 |
| 8 | Every table has row level security switched on | |
| 9 | A deleted account is refused on every request, whatever sign-in says | 0045 |
| 10 | Every table also refuses a deleted account (the backstop rule) | 0045 |
| 11 | Deletions are recorded step by step, and only the server can read them | 0045 |
| 12 | Lessons, court maps and essays have their lawyer sign-off record | 0046 |
| 13 | A matter reaches learners only with a lawyer's sign-off | 0046 |
| 14 | Every nightly deletion check is recorded, and only the server can read the record | 0049 |
| 15 | A coach's morning note is never deleted and stays in its author's name | 0050 |
| 16 | A sign-off past its date stops the content; no table can be emptied, and no kept record (fifteen tables) deleted, by anybody the app runs as, and the refusing triggers are on the right tables and switched on | 0051 |
| 17 | A sign-off that ran out goes back to review with a kept record, only the server can run that or claim an answer, and none is still published | 0052 |

Checks 1 to 15 are the original list. 16 and 17 were added with 0051 and
0052 so that the rehearsal proves those migrations as well, not only the
earlier ones. Check 17 can say NOT OK on a day a sign-off ran out after the
update was pasted; `select public.return_lapsed_content();` in the SQL
editor puts it right, and the nightly job does the same.

### 4c. The automated tests against the copy (this session)

Once you say so, I build the website against the copy on this machine and
run the integration tests at it (`npm run test:staging`): sign-in and
two-step sign-in, staff boundaries, deletion, the content gate, publication,
expiry and withdrawal of approved content, Today, morning notes. Two tests
are skipped on a hosted copy, by design, and the report will say so: one
stops the Storage service, one holds a database transaction open, and
neither is possible through a hosted project's API. Both run on the local
stack every time.

The tests create their own people and content in the copy and leave them
there; the copy is deleted afterwards (step 5).

## 5. Afterwards

1. Supabase, the copy, **Project Settings**, **General**, **Delete
   project**. It holds personal data and has no further use once the
   evidence is written down.
2. Remove the four environment variables and the allowed domain from the
   session's environment settings.

## A brand-new firm (a fresh install)

A new firm starts from an empty project rather than an update: paste
`supabase/SETUP.sql`, then `supabase/checks/after-update.sql`; all seventeen
must say OK. The same was done on a throwaway Supabase for this release
(the readiness report has the result).

## Not done without your explicit approval

Running anything against the live project, merging, deploying, changing
repository visibility or hosting, and running the hosted rehearsal itself.
