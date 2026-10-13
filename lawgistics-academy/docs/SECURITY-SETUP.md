# Security setup: the switches only you can turn on

The code does its part. These are settings in the accounts the academy runs
on, and nobody can change them for you from the code. Do them once for each
copy of the academy (each firm's Supabase and Vercel).

Never paste a password, key or code from these pages into a chat or an
email. None of the steps below needs you to.

Menus in Supabase, Vercel and GitHub move from time to time. If a step's
menu is not where it says, use the search box at the top of that site and
type the bold words.

---

## 1. Confirm people's email addresses

Today anybody can sign up with any address, including somebody else's. Two
steps fix it, in this order. Doing the second without the first makes
sign-up look broken, because Supabase's own email allowance is a few
messages an hour.

### 1a. Connect an email provider

You need an account with an email-sending service (Resend, Postmark, Amazon
SES, SendGrid or your firm's Microsoft 365 all work). The service gives you
a host, a port, a username and a password.

1. Open your project at **supabase.com**.
2. Click **Authentication** in the left-hand menu.
3. Click **Emails**, then **SMTP Settings**.
4. Switch on **Enable custom SMTP**.
5. Fill in the sender email (for example `academy@yourfirm.com`), the sender
   name (the firm's name), and the host, port, username and password from
   the email service.
6. Click **Save**.
7. Test it: sign out of the academy, click **Forgot password**, and put in
   your own address. The email should arrive within a minute.

### 1b. Switch on Confirm email

1. Still in Supabase, click **Authentication**, then **Sign In / Providers**.
2. Click **Email**.
3. Switch on **Confirm email** and click **Save**.
4. Test it: sign up with a new address you own. The academy says "check
   your inbox"; the link in the email signs you in.

---

## 2. Two-step sign-in for staff

Coaches, firm administrators and administrators can see trainees' records,
so the academy asks them for a six-digit code from a phone app as well as
their password. This is already built in and switched on. Before it goes
live:

1. Tell every member of staff, yourself included, to install an
   authenticator app first (Microsoft Authenticator, Google Authenticator or
   1Password). The next time they open Admin, the academy walks them through
   scanning a code with it. It takes about two minutes.
2. Ask each of them to add a second device as a spare when it offers.
   Supabase keeps no backup codes.
3. Check it is switched on in Supabase: **Authentication**, then
   **Multi-Factor**. Under **TOTP (App Authenticator)** both enrolling and
   verifying should say **Enabled**. It is on by default.

When somebody loses their phone, `docs/NEW-FIRM.md` ("When somebody loses
their phone") has the steps. Check by phone that it is really them first.

---

## 3. Two-step sign-in on the accounts that run the academy

Whoever gets into these accounts gets everything. Switch on two-step
sign-in for every person who has a login to each.

- **Supabase:** click your picture at the top right, then **Account
  preferences**, then **Security**, then **Add new app** under multi-factor
  authentication.
- **Vercel:** click your picture, then **Account Settings**, then
  **Authentication**, then **Two-Factor Authentication**.
- **GitHub:** click your picture, then **Settings**, then **Password and
  authentication**, then **Enable two-factor authentication**.

---

## 4. Backups, and proving they work

A backup you have never restored is a hope, not a backup.

1. In Supabase, click **Database**, then **Backups**.
2. Check that daily backups are listed. They come with the paid plans; on
   the free plan there are none, so move to a paid plan before a firm's
   trainees use the academy.
3. Consider **Point in Time Recovery** (an add-on on the same page) for a
   firm that would mind losing a day's work.
4. Once a quarter, prove a restore works: create a spare Supabase project,
   restore the latest backup into it (Supabase's **Restore to a new
   project**, on the Backups page), sign in to it and check a trainee's
   record is there. Then delete the spare project. Write the date down.

---

## 5. Keep each firm's database in step with the code

Every merge updates the website for every firm by itself. A change to the
database does not: it needs `supabase/UPDATE.sql` pasted into each firm's
Supabase.

1. Open the project at **supabase.com**, click **SQL Editor**, then **New
   query**.
2. Paste the whole of the latest `supabase/UPDATE.sql` and click **Run**.
3. It is safe to run again; it ends with "Success. No rows returned".

Run it before merging a change that needs it, so the website never runs
ahead of the database.

---

## 6. Who can see the code

The GitHub repository `niamhkearney23/InDispute` is public, so anybody can
read and copy the code and the draft questions. Checked on 13 October 2026:
it belongs to your personal GitHub account (not an organisation), it has no
licence file (so nobody was given a right to reuse it, though copies already
taken cannot be called back), and nobody has forked it.

Three things to sort out first, in this order:

1. **The default branch.** GitHub's default is an old branch,
   `claude/paralegal-application-review-FCor4`, not `main`. Vercel deploys
   from `main`. New pull requests aim at the default, so change it:
   repository **Settings, General, Default branch**, the two-arrows button,
   choose `main`, **Update**.
2. **GitHub Pages.** There is a `gh-pages` branch. If it serves a website
   (repository **Settings, Pages** shows the address), a free GitHub
   account cannot serve Pages from a private repository, so that site would
   go offline. Move it first, or upgrade to GitHub Pro.
3. **Vercel's free (Hobby) plan.** Vercel deploys a private repository on
   Hobby only for commits by the Vercel account's owner. The merges into
   `main` are yours, so production should keep deploying, but previews of
   commits written by Claude may be blocked, and some people have reported
   blocks they did not expect. Have a way back ready (step 5).

Then:

4. Repository **Settings**, scroll to **Danger Zone**, **Change visibility**,
   **Private**, confirm.
5. Make a small merge into `main` (or redeploy in Vercel) and check all three
   Vercel projects (`litigation-training`, `in-dispute-bxzc`,
   `lawgistics-marketing`) deploy. If one is blocked, either make the
   repository public again for now or move to Vercel Pro.

---

## 7. Data protection: where the data lives

The academy keeps trainees' names, emails, answers, coaching notes and
uploaded recordings. Before a firm's trainees use it:

1. **Region.** In Supabase, **Project Settings**, **General**, check the
   region. Singapore for a Malaysian firm, Sydney for an Australian one.
   Vercel's servers may run elsewhere; that is a transfer to note.
2. **Malaysia (PDPA).** Personal data leaving Malaysia (to Singapore, or to
   the AI services the tutor uses) is a cross-border transfer. Have a
   Malaysian data protection adviser confirm the transfer is allowed and
   what the firm must tell trainees, and record their advice.
3. **AI services.** If the tutor is switched on, the trainee's answers are
   sent to the AI provider. Check the provider's data processing terms (no
   training on your data, where it is processed, how long it is kept) and
   keep a copy.
4. **Privacy notice.** Trainees should be told all of the above before they
   sign up, and what section 7a says about deleting an account and how long
   things are kept. This is the privacy policy still to be added to the
   sign-up page.

---

## 7a. Deleting an account, and how long things are kept

What the privacy notice should say, in substance, and what the academy
actually does. Have the firm's data protection adviser confirm it before it is
published.

**When somebody deletes their account** (Account page, or an administrator at
Admin, Trainees):

- Their name, email address, photo and cartoon, timezone, goals, tutor
  conversations, wrong-code attempts and any recordings are removed.
- They are signed out on every device and cannot use the account again. This
  is enforced by the database itself, even if the sign-in service is
  unavailable at that moment.
- Their own messages and comments on the work board are replaced with
  "Removed when the account was deleted.", unless a supervising lawyer kept a
  particular one because supervision needs it, and recorded why.
- What the firm keeps as its training record stays: answers, homework, work
  handed in with its files, matter answers and marks, joining records,
  certificates and certification records. **These are not anonymous.** The
  name is taken off them, but what somebody wrote or handed in may still
  identify them. An administrator reviews them at Admin, Deletions, removes
  work-board text that is not needed, and decides each certification record:
  redact the identifying details (grades, dates and box numbers stay) or
  retain, with a reason such as a regulatory record.
- If a step does not finish (the sign-in service or file storage fails), the
  person is told the truth: they are signed out and cannot use the account,
  their details are removed from the database, and the firm will finish the
  rest. It is retried automatically every day and shown to administrators.

**How long work-board messages are kept:** messages and comments on a piece
of work are replaced with "Removed at the end of the retention period." once
the work closed (its last activity, or its due date if later) more than
**24 months** ago, unless a supervising lawyer kept them for supervision. The
number is `WORK_BOARD_RETENTION_MONTHS` in `src/lib/account/retention.ts`;
changing it is the owner's decision and needs a developer.

**Turning on the daily retry (once per firm):**

1. Make a secret: on any computer with a terminal, `openssl rand -base64 32`,
   or ask whoever set up Vercel. It must be at least 16 characters.
2. In **Vercel**, open the firm's project, then **Settings**, then
   **Environment Variables**.
3. Add a variable named `CRON_SECRET` with the secret as its value, for
   **Production**. Save.
4. Open **Deployments**, choose the latest one, and **Redeploy** so it takes
   effect.
5. Check **Settings**, **Cron Jobs**: `/api/cron/erasure-retry` should be
   listed, once a day. Until `CRON_SECRET` is set the job is off, and an
   administrator has to press **Retry** at Admin, Deletions instead.

**One database setting to check after running UPDATE.sql:** the update tells
the database's API to refuse deleted accounts before every request. In
Supabase, **SQL Editor**, run
`select rolconfig from pg_roles where rolname = 'authenticator';` and check
the answer includes `pgrst.db_pre_request=public.check_request`. If the
project already used a pre-request function of its own, this replaced it:
tell the developer.

---

## 8. An independent check

Before the first firm pays, have a security tester (not the people who
built it) try to break in: get into another trainee's records, become an
administrator, or read the answers. The summary of how the academy is
protected is a good starting brief for them.
