# Visual QA: does it work on a phone?

Renders every page of the real app at real device viewports and reports layout
problems. Used to verify iPhone, Android and laptop rendering without a device
lab and without a Supabase project.

## What it checks

For each page × device it asserts:

- **no horizontal scrolling**: the single most common mobile defect
- **no element extending past the viewport**
- **tap targets at least 32px tall**
- **no text input, select or textarea below 16px**: below that, iOS Safari
  zooms the page when the field is focused, which is disorienting mid-form
- **no console or page errors**

and writes a full-page screenshot of each combination.

## Devices

| Device | Viewport | Why |
| --- | --- | --- |
| iPhone SE | 375×667 | the smallest iPhone still in wide use |
| iPhone 15 Pro | 393×852 | current mainstream iPhone |
| Galaxy S24 | 360×780 | 360px is the narrowest common Android width |
| Galaxy S24 Ultra | 412×915 | large Android |
| Laptop | 1440×900 | desktop |

Some findings are expected on the laptop row only: the admin forms deliberately
drop to compact 14px controls from the `sm:` breakpoint upwards, where iOS zoom
does not apply.

## Running it

The app needs something to talk to, so `mock-supabase.mjs` stands in for a real
project. It speaks the slice of GoTrue and PostgREST the app uses and serves
fixtures; it is for rendering pages, and deliberately does **not** validate
query correctness. The schema contract tests do that.

```bash
# once
npm install
npx playwright install chromium

# terminal 1: the stand-in backend
node tools/visual-qa/mock-supabase.mjs

# terminal 2: the app, built against it
cat > .env.local <<'ENV'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key
SUPABASE_SERVICE_ROLE_KEY=mock-service-role-key
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
AI_PROVIDER=none
ENV
npm run build && npx next start -p 3000

# terminal 3
node tools/visual-qa/device-check.mjs
```

Screenshots and a `report.json` land in `/tmp/lawgistics-qa` (override with
`QA_OUT`).

> Use a **production build**, not `next dev`. The dev server's HMR client can
> fail to load in sandboxed environments. When it does, React never hydrates
> and every interactive control silently falls back to a native form submit, which
> looks exactly like a broken app.

The script signs in through the real login form rather than injecting a cookie,
so the auth flow is exercised too.
