# Lawgistics — rebuilt site + admin

A static rebuild of lawgistics.my with a Payload-style admin CMS that runs
against the **live Payload API** on lawgistics.my. No build step, no
dependencies.

## Run it locally

```bash
python3 /Users/niamhkearney/Downloads/lawgistics/serve.py --port 8455 --root /Users/niamhkearney/Downloads/lawgistics
```

Then open http://localhost:8455. `serve.py` serves the static files **and**
proxies `/api/*` to `https://lawgistics.my/api`, so the browser only ever makes
same-origin requests — no CORS configuration needed on the CMS.

## Live vs demo mode

Sign in at `/admin/` with your **real Payload account** — the login form posts
your credentials straight to Payload's `/api/users/login`; nothing else sees or
stores them, and the JWT lives in sessionStorage for the tab. Once signed in,
the admin hydrates every collection from the live API and all edits write back
with POST/PATCH/DELETE. A green **live · lawgistics.my** badge shows in the
topbar; failed API writes revert the change and show a toast.

The login page also has "Use offline demo mode instead" — that's the original
seed-data + localStorage build (admin@lawgistics.my / lawgistics), useful for
showing people without touching production.

## Client-facing pages and the live API

The three public forms write **straight into the production CMS** — anonymous
create is open on `contact-submissions`, `enquiry-submissions`, and
`newsletter-leads`, and the forms send the exact field names the live
collections validate against (probed via Payload's validation errors — no test
records were created):

- **Contact** → `name`, `email`, `subject`, `message`
- **Enquiry** → `businessName`, `businessType`, `stage` (idea/startup/growing/
  established), `legalServices` (comma-joined string), `description`,
  `timeline` (urgent/soon/flexible), `email`, `phone`,
  `preferredContact` (email/phone/video/whatsapp)
- **Newsletter** → `email`

If the API is unreachable the submission is kept locally and the visitor still
sees a success message — nothing is lost.

Public *reads* fall back to seed data because your Payload access control
(correctly) denies anonymous reads on most collections — only `media` is
public (and it hydrates live: all 43 items). The site attempts anonymous
hydration on every load, so the moment you open read access on `faqs`,
`insights`, `insight-categories`, `categories`, `templates`, `reviews`, and
the `pricing` global in your Payload config, the public pages go live with no
code change here. In Payload that's `access: { read: () => true }` on each of
those collections.

### Live API map (verified)

| Store key | Payload slug |
| --- | --- |
| users, media, faqs, insights, reviews, categories, templates | same name |
| insightCategories | `insight-categories` |
| contactSubmissions | `contact-submissions` |
| enquirySubmissions | `enquiry-submissions` |
| newsletterLeads | `newsletter-leads` |
| documentsToReview | `documents-to-review` |
| pricing | `globals/pricing` |

One caveat: your real Payload field names may differ from the ones in
`admin/schema.js` (anonymous reads are blocked, so they couldn't be inspected).
If a column shows — for every row after you log in, the field key needs
renaming in `schema.js` to match your collection config.

## Structure

```
index.html            Home
aboutus.html          About
documents.html        Template library (filter + search)
legalhelp.html        Lawyer matching + enquiry form
insights.html         Article index (filter + search)
article.html          Single article — reads ?slug=
contactus.html        Contact form
privacy-policy.html   PDPA privacy notice
login.html            Customer sign in / sign up

admin/                Admin CMS
  index.html          Shell (hash router)
  login.html          Admin sign in
  schema.js           Collection definitions — the file you edit most
  app.js              Router + generic list/edit views
  admin.css           Dark CMS styling

assets/
  css/site.css        Public design system
  js/data.js          Seed data for every collection
  js/store.js         Data layer (localStorage today, API tomorrow)
  js/site.js          Header/footer, nav, accordions, forms
```

## Admin

Sign in at `/admin/` with **admin@lawgistics.my** / **lawgistics**.

Collections mirror the existing Payload setup:

| Group | Collections |
| --- | --- |
| Collections | Users, Media, Faqs, Insights, Insight Categories, Reviews, Contact Submissions, Enquiry Submissions, Newsletter Leads |
| Templates | Categories, Templates |
| Review Documents | Documents To Reviews |
| Settings | Pricing (global) |

Every list view has search, status filters, column sorting, row selection and
bulk delete. Every record has a generated edit form. Editing Pricing changes the
price blocks on the home and documents pages immediately.

### Adding a collection

Add an entry to `admin/schema.js` and a matching array in `assets/js/data.js`.
The sidebar, dashboard card, list view and edit form all appear automatically —
no other file needs touching.

Field types: `text`, `email`, `number`, `date`, `textarea`, `richtext`,
`select` (with `options`), `relationship` (with `relTo`). Add `half: true` to two
adjacent fields to put them side by side.

## Data layer

Everything reads and writes through `Store` in `assets/js/store.js`:

```js
Store.list('templates', { where: { status: 'published' }, sort: 'title' })
Store.get('insights', 'i3')
Store.create('newsletterLeads', { email, source, status, date })
Store.update('enquirySubmissions', 'es1', { status: 'matched' })
Store.remove('reviews', 'r5')
```

Right now those methods read seed data and persist to `localStorage`. To move to
a real backend, replace the bodies of `list/get/create/update/remove` with
`fetch()` calls. No page or view needs to change.

`Store.reset()` in the console restores the seed data.

## Known limits of this build

- Remote mode needs `serve.py` (or any reverse proxy mapping `/api` to
  lawgistics.my) — a bare static host without the proxy runs in demo mode only.
- Public-site form submissions only reach production if the matching Payload
  collection allows public `create` access; otherwise they stay local.
- The local demo login remains client-side only — it exists for offline demos
  and gates nothing real.
- "Continue with Google" is a stub.

## Document creator

`create.html?template=<slug>` is a guided document generator with a live
preview. Four templates are fully drafted (`employment-contract`, `nda-mutual`,
`service-agreement`, `letter-of-demand`); the rest show "coming soon" on the
documents page until their question sets are added to
[assets/js/doclib.js](assets/js/doclib.js).

- **Guided steps** with inline legal context (e.g. why non-competes are void
  under s.28 Contracts Act 1950 but non-solicitation isn't).
- **Voice input** — every text field has a mic button (Web Speech API; Chrome
  and Edge). Tap, talk, it types. Falls back silently where unsupported.
- **Live preview** re-drafts the document on every keystroke.
- **Edit text** — the drafted document is directly editable before download;
  manual edits persist, and changing answers afterwards offers a regenerate
  (which discards manual edits, with a warning).
- **Downloads** — Word (.doc) and Print/PDF. Drafts autosave per template in
  localStorage.
- Generated documents carry a "not legal advice — have it reviewed" notice.

To add a template: add an entry to `LG_DOCS` in `doclib.js` with `steps`
(question groups) and a `render(answers)` function — the documents page picks
it up automatically.

## Changes from the original site

- Pricing is a single source of truth in the admin rather than hard-coded per page.
- Templates and insights are filterable and searchable.
- Insight articles have full bodies and real article pages, not just cards.
- The "Trusted by 50,000+" line on the sign-in page contradicted "500+ businesses"
  elsewhere; both now read 500+, and the rating matches the 4.7/5 on the About page.
- The demo records are fictional — no real customer data is in this repo.
