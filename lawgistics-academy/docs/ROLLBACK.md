# When something goes wrong: restrict first, then fix forward

**The principle is fail secure.** When something goes wrong after a release,
the first move is always to take access away, never to put back an older,
weaker version. You restrict the website with one setting, `SITE_ACCESS`,
then the problem is fixed in a new version, and only then is the website
opened again.

Two things are never done, whatever the problem:

1. **Never put the website back to a build that does not ask staff for the
   six-digit code.** That is any build from commit `b0161d8` or earlier (the
   website before the release that added two-step sign-in).
2. **Never relax a database control.** No "undo" of migrations `0043` to
   `0048`, no SQL that switches off Row Level Security, drops a policy or
   changes who counts as staff. The old file that undid `0047` has been
   withdrawn for exactly this reason: it let a staff password alone read
   staff data again.

## The switch: `SITE_ACCESS`

Set in Vercel. It works on any build from this version onwards (the one that
added this page).

| Value | What happens |
| --- | --- |
| `open` | Normal. The same as not having the setting at all. |
| `staff-closed` | Everything for staff is closed: every Admin page and download, every staff button, the inbound email address, the joining digest and first-run setup. Staff see a page saying the staff area is closed for maintenance. Learners carry on as normal. |
| `closed` | The whole website shows "The academy is closed for maintenance". Nobody can sign in and no button does anything. Only the nightly job that finishes account deletions keeps running. |

Anything else, a typing mistake or an empty value included, counts as
`closed`. Capital letters and spaces around the word do not matter.

What the switch never does: it never turns two-step sign-in off, never skips
a sign-in check and never opens anything that `open` keeps shut. It also does
not change the database. The database's own rules stay in force for anybody
who reaches Supabase directly, which is why they are never relaxed.

**Which one to choose.** `staff-closed` when the problem is with Admin, a
staff account or two-step sign-in. `closed` when learners' records may be
affected, while a database is being restored, or when you are not sure.

## 1. Restrict access (always first)

1. Open <https://vercel.com>, then the firm's project.
2. **Settings**, then **Environment Variables**.
3. If `SITE_ACCESS` is listed, press the three dots beside it, **Edit**.
   Otherwise fill in the form at the top: **Key** `SITE_ACCESS`.
4. **Value**: `staff-closed` or `closed`. Tick **Production** only. **Save**.
5. **Deployments**. The top one marked **Current** is the live one. Press
   the three dots beside it, **Redeploy**, and confirm. A setting only
   reaches the website when it is deployed again.
6. When it says **Ready**, open the website in a private window and check:
   for `staff-closed`, the address `/admin` shows "The staff area is closed
   for maintenance"; for `closed`, the front page shows "The academy is
   closed for maintenance".

## 2. Fix forward

The fix is a new version of the website, checked the same way as a release
(`docs/RELEASE.md`), and deployed while access is still restricted. Then open
again (section 5).

## 3. Vercel Instant Rollback

Allowed **only** to a production deployment built from the release that added
two-step sign-in, or later. To recognise one:

1. In **Deployments**, click the deployment. Under **Source** it shows the
   branch (`main`) and a commit: seven letters and numbers and a message.
2. That commit must be the release commit named in the GO / NO-GO report for
   the release, or one made after it. `b0161d8`, and anything older, is never
   allowed. If you cannot tell, do not use it.
3. Afterwards, sign in as staff in a private window: Admin must ask for the
   six-digit code before it opens. If it opens with a password alone, go
   straight to section 1 with `closed` and send word.

Two things to know. Instant Rollback brings a deployment back exactly as it
was built, with the settings it had then: so while the website is restricted,
do not use **Promote** or **Instant Rollback**; open the chosen deployment's
three dots and press **Redeploy** instead, which builds it again with today's
settings, `SITE_ACCESS` included. And a deployment built before this version
does not know the switch at all, so it cannot be restricted.

## 4. Restoring the database from a backup

Only when the data itself has to go back (the database returns to `0042`,
before the release). A restore also loses everything done since.

1. Section 1, with `closed`. It stays `closed` until step 4 here is done.
2. Supabase, the project, **Database**, **Backups**: restore the backup (with
   Point in Time Recovery, the time chosen).
3. Straight away, before anything else: **SQL Editor**, **New query**, paste
   the whole of `supabase/UPDATE.sql`, **Run**. The restored database does not
   have `0043` to `0048` until this is done, so keep this gap as short as
   you can.
4. New query, paste `supabase/checks/after-update.sql`, **Run**. All thirteen
   checks must say **OK**. If any says NOT OK, stop here, leave the website
   `closed` and send the results.
5. Open again (section 5).

## 5. The route back: opening again, with two-step sign-in enforced

1. Vercel, the project, **Settings**, **Environment Variables**,
   `SITE_ACCESS`: **Edit** it to `open`, or press **Remove**. **Save**.
2. **Deployments**, the current one, three dots, **Redeploy**. Wait for
   **Ready**.
3. In a private window, sign in as a staff member with the password only.
   You must be taken to the page asking for the six-digit code (or, for
   somebody with no app yet, to the page that sets one up), not to Admin.
4. Type the code. Only now does Admin open. Check there is no "database
   needs updating" warning.
5. Sign in as a learner and open Today.

If step 3 opens Admin without asking for the code, go straight back to
section 1 with `closed`, and send word.

A staff password alone never reaches staff data through the database:
`0047` (a staff role counts only after the code) is never removed, so that
holds whether the website is open or restricted. The one gap is a restored
backup from before the release, which does not have `0047` until
`UPDATE.sql` has been run on it again. That is why section 4 runs it
straight after the restore, with the website `closed`.

## When a security control may be relaxed

**In production, never.** These are the controls:

- Row Level Security on every table.
- Two-step sign-in for staff, in the website and in the database (`0047`).
- The deletion lockout: the check before every database request and the
  restrictive policies that refuse a deleted account (`0045`).
- The publication and content gates: nothing reaches a learner without a
  lawyer's sign-off (`0044`, `0046`).
- The content security policy.
- The secret the nightly job must present (`CRON_SECRET`).
- `SITE_ACCESS` itself: once restricted, it is opened only through section 5.

The only permitted exceptions each need **all** of these:

1. Your written approval, naming the control, the reason, the person doing
   it and a time limit.
2. Access restricted (`staff-closed` or `closed`) for the whole time, unless
   it is the per-person exception below.
3. A row in `docs/SECURITY-EXCEPTIONS.md`, written before it starts and
   closed when it ends.

**The per-person exception that already exists:** removing a staff member's
lost authenticator device, after confirming by phone that it is really them
(`docs/NEW-FIRM.md`, "When somebody loses their phone"). It relaxes nothing
for anybody else, and the person must set up a new device before Admin opens
for them; until then their password alone reaches no staff data.

**Local-only switches** (`STAFF_TWO_STEP=off`, and the visual check's
stand-in Supabase in `tools/visual-qa`) are never set on any Vercel
deployment, Production or Preview.

Restricting access never needs an exception. Anybody responsible for the
website may set `staff-closed` or `closed` at any time.
