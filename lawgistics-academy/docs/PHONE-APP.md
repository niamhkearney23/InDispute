# The academy on a phone

The academy already works in a phone's browser. This adds the two things a
browser tab could not do: an icon on the home screen that opens straight into
the academy, and notifications.

This is step 1 of the phone app brief: an installable web app (a "PWA"). There
is no App Store or Google Play listing, no store fee and no second copy of the
code. Step 2, store apps, is not built; see the end of this page.

## What a trainee gets

- **An icon on the home screen.** It opens on Today, signed in, in its own
  window without the browser's address bar. The name, letter and colour are the
  firm's, from the brand settings, so each firm's copy installs as its own.
- **A reminder before each round**: "Round 2 of four opens at 8am", between
  five and ten minutes before, on their cohort's own clock. Only on a rounds
  day of their placement (not weekends, not the cohort's holidays, not before
  questions are published for their country), so it never announces a round
  the Today page does not show.
- **A notice when a coach marks their work** on the work board.
- **A notice when a coach puts up new work** they can see. Once per post: a
  coach editing a post later does not send it again.
- **A calm offline page** when there is no signal. Nothing is trained offline,
  because answers are timed and marked on the server.
- **The microphone** keeps working for voice memos and spoken explanations,
  installed or not.

Interns get the work notices too. They have no rounds, so no round reminders.

## Switching it on (once per firm's copy, about 15 minutes)

Everything is on the **Phones** page in Admin (administrators only). It makes
the keys in your browser, says where to paste them, and shows how many phones
have notifications on and when the last round reminder went.

In short:

1. **Phones page, Make the keys.** Three values appear: `VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY` and `CRON_SECRET`. They are made in your browser and
   sent nowhere.
2. **Vercel, Settings, Environment Variables.** Add those three, plus
   `VAPID_SUBJECT` set to `mailto:` and an address Apple and Google can write
   to, for example `mailto:tech@yourfirm.com`. Then **Redeploy**.
3. **Supabase, Database, Extensions.** Switch on `pg_cron` and `pg_net`. Then
   **SQL Editor**, paste the text the Phones page shows, put the
   `CRON_SECRET` where it says, and **Run**. This calls the academy every five
   minutes to check for a round about to open.

Until step 2 is done, nobody is offered notifications and nothing is sent.
Until step 3 is done, marked and new work are still sent (they go the moment a
coach saves), but round reminders are not.

Each firm's copy needs its own keys. Do not reuse one firm's keys on another.

**Why Supabase for the five-minute check, not Vercel?** Vercel's free plan
only runs scheduled jobs once a day, and a deploy with a more frequent one is
refused. Supabase runs them on every plan. On Vercel Pro, adding this to
`vercel.json` works instead of step 3:

```json
"crons": [{ "path": "/api/push/rounds", "schedule": "*/5 * * * *" }]
```

Vercel sends the `CRON_SECRET` by itself.

## How a trainee installs it

The **On your phone** card on their Account page shows the steps for the phone
in their hand.

- **iPhone (iOS 16.4 or later):** in Safari, Share, Add to Home Screen, Add.
  Then open it from the home screen and turn notifications on from Account.
  Apple only allows notifications for an app opened from the home screen.
- **Android:** Chrome offers "Install app" (the card shows a button when Chrome
  allows it). Notifications can be turned on from Account straight away.

It is worth putting these steps in the how-to video and the welcome message
the next time either is changed.

## Testing on a real phone

The sandbox this was built in cannot reach Apple's or Google's push services,
so the last check has to be on a real phone. With step 1 to 3 done:

1. Sign in as a confirmed trainee on an iPhone and on an Android phone, add the
   academy to the home screen, open it from there, and turn notifications on.
2. As a coach, put up a piece of work for trainees. Both phones should show
   "New work on the board" within a few seconds.
3. Hand something in as the trainee and mark it as the coach. The trainee's
   phone should show "Your work has been marked".
4. For a round reminder, put the trainee in a cohort whose next round opens in
   about fifteen minutes. The phone should buzz five to ten minutes before.
5. Turn flight mode on and open the academy: the offline page should show, and
   reload by itself when flight mode goes off.

## Privacy, for the store forms and the privacy policy

- A phone that turns notifications on gives the academy an address at its push
  service (Apple, Google, Mozilla or Microsoft) and two keys. Nothing else: no
  phone number, no contacts, no location. The device list keeps only a plain
  label ("iPhone", "Android phone").
- What is sent is encrypted on the server for that one phone; the push service
  carries it and cannot read it.
- A notification says only a round time, "your work has been marked" with the
  post's title, or a new post's title. Never a mark, a comment or anything a
  person wrote.
- A person sees only their own devices, and a device is deleted with its
  account. The server forgets a device the moment the push service says it is
  gone.

## How it fits together

| Piece | Where |
| --- | --- |
| The rule for which round is due a reminder, and what each notice says | `src/lib/push/rules.ts` (pure, tested in `tests/phone-app.test.ts`) |
| Sending, saving and forgetting devices | `src/lib/push/service.ts` (server only) |
| The five-minute check | `src/app/api/push/rounds/route.ts`, off unless `CRON_SECRET` and the keys are set |
| Telling people about marks and new work | `src/app/admin/work/actions.ts`, after the response is sent, so a coach never waits on a phone |
| The device table, the reminder log, and who hears about a post | `supabase/migrations/0042_phone_notifications.sql` |
| The manifest and home-screen icons | `src/app/manifest.ts`, `src/app/apple-icon.tsx`, `src/app/app-icon/` |
| Notifications and the offline page on the phone | `public/sw.js`, `public/offline.html` |
| The Account card | `src/app/(app)/account/phone-app.tsx` |
| The administrator's page | `src/app/admin/phone/` |

Who hears about a new post is the work board's own visibility rule, not a
second copy of it: 0042 moves the rule into `work_visible_to(post, person)`
and `work_visible` now asks it with the caller's id.

## Step 2: store apps (not built)

Only if firms ask for them. The plan in the brief stands: wrap this same site
with Capacitor for the App Store and Google Play, with native push through
Apple and Firebase, and keep one code base.

Three things have to exist before anything goes to Apple:

1. **Deleting an account from inside the app.** Apple requires it. Today the
   firm-side records cannot be deleted at all, on purpose. This needs the
   owner's decision on what a firm keeps when somebody leaves, then a
   migration. A proposal is in the developer's reply to the brief.
2. **No prices or payment in the iPhone app.** The pricing page and anything
   that leads to Stripe must be hidden when the academy runs inside the store
   app. Firms are invoiced, so nothing is lost.
3. **More than a website in a frame.** Native push, the home-screen experience
   and the microphone are the case for it.
