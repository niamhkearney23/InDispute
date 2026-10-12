# Setting up a new firm

Each firm gets its own copy of the academy: its own website on Vercel and its
own database on Supabase. Nothing about one firm's people is in another firm's
database, so the answer to "who else can see our people?" is "nobody, there is
nobody else in it".

This takes about an hour, with no command line. You need from the firm: its
name as it should appear, its colour (a six-character hex code such as
`1f3a6b`), its logo (a link to an image, or a file), and the email addresses of
their firm administrator and their supervising lawyers.

Thomas Philip and Lawgistics appear only on Thomas Philip's own copy. A new
copy shows the firm's name everywhere instead, once the settings in step 3 are
filled in.

## 1. The database

1. Go to <https://supabase.com/dashboard> and press **New project**.
2. Name it after the firm, for example `academy-acme`. Choose the region
   **Southeast Asia (Singapore)** for a Malaysian firm, **Sydney** for an
   Australian one. Save the database password somewhere safe; you will not
   need it day to day.
3. When it is ready, open **SQL Editor**, press **New query**, paste in the
   whole of `supabase/SETUP.sql` and press **Run**.
4. Open **Authentication, Sign In / Providers, Email** and switch off
   **Confirm email** (see "Before the first sale" below for why this matters).
5. Open **Project Settings, API** and keep the tab open: step 3 needs the
   Project URL, the anon key and the service_role key.

## 2. The website

1. Go to <https://vercel.com/new> and import the same GitHub repository,
   `InDispute`.
2. Set **Root Directory** to `lawgistics-academy`.
3. Name the project after the firm, for example `academy-acme`. Its address
   will be `academy-acme.vercel.app` until the firm wants its own domain.
4. Do not deploy yet: open **Environment Variables** first (step 3).

## 3. The settings

Add each of these in Vercel, under **Settings, Environment Variables**:

| Name | What to put |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret: never share it) |
| `NEXT_PUBLIC_SITE_URL` | The site's address, for example `https://academy-acme.vercel.app` |
| `SETUP_TOKEN` | A long random password you make up, used once in step 4 |
| `NEXT_PUBLIC_BRAND_NAME` | The firm's name, for example `Acme` |
| `NEXT_PUBLIC_BRAND_SUFFIX` | `Academy`, or leave it out |
| `NEXT_PUBLIC_BRAND_FIRM` | The firm's full name, for example `Acme & Partners` |
| `NEXT_PUBLIC_BRAND_TAGLINE` | One line under the front page heading |
| `NEXT_PUBLIC_BRAND_ACCENT` | The firm's colour, six characters, for example `1f3a6b` |
| `NEXT_PUBLIC_BRAND_LOGO` | A link to the logo starting `https://`, or leave it out |
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | Only if this firm has the AI features |

Leave `PAYMENTS` unset: payments stay off and the firm's people get in through
the firm's code or an invitation.

Leave `STAFF_TWO_STEP` unset too. Unset, every staff member needs a code from
an authenticator app on their phone to open the staff pages (see "Two-step
sign-in" below). It exists only for a developer's own computer.

Then press **Deploy**.

## 4. Become the administrator of the new copy

1. Open the new site, press **Sign up**, and sign up with your own email.
2. Go to `/setup` on the new site, for example
   `https://academy-acme.vercel.app/setup`.
3. Enter the `SETUP_TOKEN` from step 3 and press the button. It loads all the
   content and makes you the administrator. It closes for good once there is
   an administrator.

## 5. The firm's people

1. Ask the firm's administrator and each supervising lawyer to sign up on the
   new site with their own work email.
2. In the new site, open **Admin, Staff**. Type each email and choose:
   - **Firm administrator** for the person who runs their people. They can
     invite and confirm people, run the joining checklist and the firm's own
     documents, make the firm's code, set programme dates, post and mark work
     and see the firm's figures. They cannot write, publish or sign off
     questions or matters.
   - **Coach** for each supervising lawyer: they sign content off, mark
     work, grade the certification register and supervise.
   - Somebody can be both.

   Tell each of them to have an authenticator app on their phone: the first
   time they open a staff page, they are asked to set up two-step sign-in
   (see "Two-step sign-in for staff" below). You are asked too, the next
   time you open Admin after step 4.
3. From here the firm runs itself: their firm administrator makes the firm's
   code under **Admin, Access**, sends invitations under **Admin, Joiners**,
   and fills in the joining checklist and the firm's documents under
   **Admin, Firm**.
4. For each intake, the firm administrator makes a cohort under
   **Admin, Cohorts**: its name, first and last day, the city whose clock
   the rounds run on, the round times and the public holidays to skip. Then
   they put each confirmed trainee in it from the cohort's page. A trainee
   in no cohort runs on Kuala Lumpur time at 7, 8, 9 and 10am.

## 6. Questions in the new copy

Each copy has its own database, so sign-offs do not travel between copies.
The questions load unsigned, and nothing reaches the firm's learners until a
lawyer signs each one off in that copy and an administrator presses
**Publish everything signed off**. The diagnostic and the rounds switch on by
themselves once questions are published, and no morning before that counts as
missed.

## Two-step sign-in for staff

Administrators, coaches and firm administrators type a six-digit code from an
authenticator app (Google Authenticator, Microsoft Authenticator, 1Password
and the like) after their password before any staff page opens. The first time
a staff member opens a staff page, they are taken to **Account, Two-step
sign-in** to set it up, which takes about two minutes. Learners can turn it on
for themselves there too, and are then asked for a code at every sign-in; for
them it is optional.

**In Supabase, check it is switched on.** It is on by default for every new
Supabase project, but check once:

1. Open the project at <https://supabase.com/dashboard>.
2. Choose **Authentication** in the left-hand menu.
3. Open **Multi-Factor** (on some versions of the dashboard it sits under
   **Sign In / Providers**).
4. Under **TOTP (App Authenticator)**, both enrolling and verifying should be
   **Enabled**. If either is off, nobody on staff can set it up or get in,
   and the setup page says "Two-step sign-in is switched off for this site in
   Supabase".

**When somebody loses their phone.** Supabase keeps no backup codes for an
authenticator app, so the setup page asks everybody to add a second device
(up to two) as a spare. When every device is gone, an administrator removes
them, and the person then signs in with their password alone and sets up the
new phone:

1. Sign in at <https://supabase.com/dashboard> and open this firm's project.
2. Choose **Authentication** in the left-hand menu, then **Users**.
3. Find the person by their email address and click their row.
4. In the panel that opens, press **Remove MFA factors**, and confirm.

Check it is really them first, for example by phone: removing the device is
exactly what somebody who has stolen a password would ask for.

If the dashboard has moved that button, the SQL Editor does the same thing.
Press **New query**, paste this with the person's email in place of the
example, and press **Run**:

```sql
delete from auth.mfa_factors
where user_id = (select id from auth.users where email = 'them@theirfirm.com');
```

## Before the first sale

- **Confirmed email.** With **Confirm email** off, anybody can sign up as any
  address. Before giving somebody a staff role on the Staff page, make sure
  the account really is theirs, for example by asking them to sign in while
  you are on the phone. The lasting fix is to connect an email provider in
  Supabase (Authentication, Emails, SMTP settings) and switch **Confirm
  email** back on. `docs/SECURITY-SETUP.md` walks through it, with staff
  two-step sign-in, backups and the rest.
- **One code base, many copies.** Every copy runs the same code, so a fix
  reaches every firm the next time each Vercel project deploys, which happens
  by itself on every merge. A database change (a new `UPDATE.sql`) has to be
  run once in each firm's Supabase.
