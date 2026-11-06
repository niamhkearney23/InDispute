# The emails Supabase sends, in the academy's name

Supabase sends two emails for the academy: the link to confirm a new
account, and the link to choose a new password. Out of the box they come
from Supabase, in Supabase's words, with "powered by Supabase" and an
"Opt out" link at the bottom. Two settings change that. Both are in your
Supabase project; nothing in the code needs changing, and you never paste
a key into a chat.

## 1. Send them from your own address (this removes "powered by Supabase")

The footer is added only while Supabase's own test mail service sends the
emails. Once the emails go through your own sending service it is gone.
If you have set up Resend for the marked-work emails, use the same account.

1. In Resend, check your domain (for example `lawgistics.my`) shows
   **Verified** under **Domains**. Create an API key under **API Keys** if
   you do not want to reuse the one in Vercel. Keep the page open; do not
   copy the key anywhere else.
2. Open your project at **supabase.com**.
3. Click **Authentication**, then **Emails**, then **SMTP Settings**.
4. Switch on **Enable custom SMTP**.
5. Fill in:
   - **Sender email**: an address on your verified domain, for example
     `academy@lawgistics.my`.
   - **Sender name**: `Lawgistics Academy`.
   - **Host**: `smtp.resend.com`
   - **Port**: `465`
   - **Username**: `resend`
   - **Password**: the Resend API key (paste it straight from Resend into
     this box).
6. Click **Save**.

## 2. Use the academy's own wording

1. Still in **Authentication**, **Emails**, click **Templates**.
2. Click **Reset password** (it may say **Reset Password**).
3. **Subject**: `Choose a new password for Lawgistics Academy`
4. **Body**: open `reset-password.html` in this folder on GitHub, click
   **Raw**, select everything, copy, and paste it over what is in the box.
5. Click **Save**.
6. Click **Confirm signup**. **Subject**: `Confirm your email for
   Lawgistics Academy`. **Body**: the whole of `confirm-signup.html`, the
   same way. Click **Save**.

Keep `{{ .ConfirmationURL }}` exactly as it is in both: Supabase puts the
real link there.

## 3. Check it

Sign out of the academy, press **Forgot your password?**, and put in your
own address. The email should arrive within a minute, from Lawgistics
Academy, with no Supabase footer. If it goes to junk the first time, mark
it as not junk.

A firm running its own copy of the academy changes "Lawgistics Academy"
in both files (and the sender name) to its own.
