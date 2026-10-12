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
so their accounts should need a code from a phone app as well as a password.

1. In Supabase, click **Authentication**, then **Multi-Factor**.
2. Make sure **TOTP (App Authenticator)** is enabled. Click **Save** if you
   changed it.
3. Each member of staff then follows the academy's own prompt the next time
   they sign in: scan the code with an authenticator app (Microsoft
   Authenticator, Google Authenticator or 1Password) and type the six digits.

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

The GitHub repository is public, so anybody can read and copy the code and
the draft questions. Unless you mean to give it away, make it private:

1. Open the repository on **github.com**.
2. Click **Settings** (the gear, top right of the repository).
3. Scroll to **Danger Zone** at the bottom of **General**.
4. Click **Change visibility**, choose **Private**, and confirm.

Vercel keeps deploying a private repository as long as its GitHub
connection stays in place. Check the next merge still deploys.

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
   sign up. This is the privacy policy still to be added to the sign-up page.

---

## 8. An independent check

Before the first firm pays, have a security tester (not the people who
built it) try to break in: get into another trainee's records, become an
administrator, or read the answers. The summary of how the academy is
protected is a good starting brief for them.
