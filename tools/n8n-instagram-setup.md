# Auto-posting the daily carousel to Instagram with n8n

Realistic effort: two to three hours the first time, mostly fighting Meta's developer console. After that it runs itself.

---

## Part 0: what has to be true before you start

1. **@lawgistics.australia must be a Business or Creator account.** Instagram app → Settings → Account type and tools → Switch to professional account.
2. **It must be linked to a Facebook Page.** Meta's publishing API only works through a Page. If there is no Lawgistics Page, make one, it can be bare.
3. **You need somewhere n8n can run.** Either n8n Cloud (paid, easiest) or self-hosted (free, Docker on a cheap VPS). Either works.

If any of these is missing, nothing below will work, so do them first.

---

## Part 1: the Meta app and access token

This is the annoying part. Do it once.

1. Go to developers.facebook.com → My Apps → Create App → type **Business**.
2. Add the **Instagram Graph API** product (in some consoles it appears as "Instagram" → "Instagram API setup with Facebook Login").
3. Under App Roles, make sure **your own account is an Administrator** of the app.
4. Go to Graph API Explorer (Tools menu). Select your app. Request these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `business_management`
5. Generate a User Access Token and approve the dialog.

**The App Review shortcut.** You do not need Meta to review your app to post to your own account. While the app is in Development mode, it can act on accounts belonging to people who have a role on the app. Since you are an admin, it will work. App Review is only needed if you want to publish on behalf of other people's accounts.

### Turning the token into something that lasts

The token you just made expires in about an hour. Convert it:

1. **Short-lived → long-lived user token** (about 60 days):

```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=YOUR_APP_ID
  &client_secret=YOUR_APP_SECRET
  &fb_exchange_token=SHORT_LIVED_TOKEN
```

2. **Get your Page token** using the long-lived user token:

```
GET https://graph.facebook.com/v21.0/me/accounts?access_token=LONG_LIVED_USER_TOKEN
```

Page tokens derived from a long-lived user token generally do not expire. This is the token you put in n8n.

3. **Get your Instagram user ID** (you need this for every call):

```
GET https://graph.facebook.com/v21.0/PAGE_ID?fields=instagram_business_account&access_token=PAGE_TOKEN
```

Save the `instagram_business_account.id`. That is your `IG_USER_ID`.

**Set a calendar reminder to check the token every 45 days.** Silent token expiry is the number one reason these workflows die.

---

## Part 2: the image hosting problem

Instagram does not accept file uploads. You give it a **public HTTPS URL** and Meta's servers fetch the image. This means:

- Private GitHub repo raw links will not work, Meta cannot authenticate.
- Localhost will not work.
- The URL must be reachable by Meta, and stay reachable until publishing finishes.

Pick one:

| Option | Notes |
|---|---|
| **Cloudinary** | Free tier is generous, this is what most n8n templates use. Upload node exists. Recommended. |
| **Imgur** | Free, simple API, used in several n8n templates. |
| **Public GitHub repo or GitHub Pages** | Free and simple, but the slides become publicly visible before you post. Fine if you do not mind. |
| **S3 / Cloudflare R2** | Most robust, slight setup cost. |

Recommendation: **Cloudinary**. Add an upload step in the workflow, use the returned `secure_url`.

---

## Part 3: the publishing sequence

A carousel takes three stages. This is the part people get wrong.

**Stage 1, one container per slide.** Repeat six times, once per image:

```
POST https://graph.facebook.com/v21.0/{IG_USER_ID}/media
  image_url=https://your-host/potter-slide-1.png
  is_carousel_item=true
  access_token={PAGE_TOKEN}
```

Each call returns an `id`. Collect all six, **in order**.

**Stage 2, the carousel container:**

```
POST https://graph.facebook.com/v21.0/{IG_USER_ID}/media
  media_type=CAROUSEL
  children=ID1,ID2,ID3,ID4,ID5,ID6
  caption=YOUR_CAPTION_TEXT
  access_token={PAGE_TOKEN}
```

Returns a `creation_id`.

**Stage 3, publish:**

```
POST https://graph.facebook.com/v21.0/{IG_USER_ID}/media_publish
  creation_id={CREATION_ID}
  access_token={PAGE_TOKEN}
```

Add a **Wait node of about 10 seconds** between stage 2 and stage 3. Containers are processed asynchronously and publishing too early throws an error. If you want to be rigorous, poll `GET /{creation_id}?fields=status_code` until it returns `FINISHED`.

---

## Part 4: the n8n workflow

Node order:

1. **Schedule Trigger** — weekdays, 08:00. Set the workflow timezone to Australia/Melbourne in workflow settings, otherwise it fires on UTC.
2. **GitHub node** (or HTTP Request) — fetch the six slide files and the posting kit for today's date from `niamhkearney23/InDispute`, branch `claude/lawgistics-daily-court-intelligence-72udlz`, path `reports/assets/YYYY-MM-DD/`.
3. **Code node** — build today's date string and work out which files to grab.
4. **HTTP Request (Cloudinary upload)** — loop over the six images, collect the six `secure_url` values.
5. **HTTP Request ×6** — stage 1 containers. Use a Loop Over Items node, or the Split In Batches node, and append each returned id to an array.
6. **HTTP Request** — stage 2 carousel container, with the caption.
7. **Wait** — 10 seconds.
8. **HTTP Request** — stage 3 publish.
9. **Slack / Email / Telegram node** — tell yourself it worked, and include the permalink.

Two n8n nodes worth knowing:

- The **Facebook Graph API node** handles auth for you, so you do not have to paste the token into every HTTP node.
- There is a community node, **n8n-nodes-instagram** (MookieLian on GitHub), which wraps the whole three-stage dance including the polling. Worth trying before you hand-build it. Community nodes need self-hosted n8n, they do not run on n8n Cloud.

n8n also publishes ready-made templates. Search their template library for "Instagram carousel" and you will find several that already do the Cloudinary plus Graph API pattern, which you can import and rewire rather than starting blank.

---

## Part 5: limits and gotchas

- **50 API-published posts per rolling 24 hours.** A carousel counts as one. You will never come close.
- **Carousels are 2 to 10 images via the API.** Six is fine.
- **Images should be JPEG.** PNG sometimes works but Meta's docs specify JPEG. If the API rejects your PNGs, add a conversion step in Cloudinary, it can do this on the fly with a URL parameter.
- **Aspect ratio** must be between 4:5 and 1.91:1. Our 1080×1350 slides are exactly 4:5, which is the limit, so do not crop them any taller.
- **Caption limit** is 2200 characters, and 30 hashtags.
- **Alt text** cannot be set at publish time via the API. Add it manually afterwards if you care about accessibility, and you should.
- **Token expiry** kills more of these workflows than anything else. Check every 45 days.

---

## My honest recommendation

Build it, but keep a human gate for the first month.

Instead of node 8 publishing straight away, have n8n send you the caption and images and wait for approval. n8n has a **Wait for Webhook** node, or simply have it post to a Slack channel with an approve button. You press approve, it publishes.

The reason is not technical. It is that this account publishes legal commentary under your name, and the failure mode of full automation is publishing something wrong or badly timed at 8am while you are asleep. Once you have seen thirty days of output you trust, remove the gate.

Also worth knowing: **Meta Business Suite lets you schedule Instagram posts for free**, with no API, no tokens and no n8n. If the only thing you want is "not having to be at my phone at 8am", that solves it in about ninety seconds. n8n is worth it when you want the whole chain automated, generation through to publication, without touching anything.
