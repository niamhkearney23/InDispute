# Sleep Shop — storefront

A storefront for a Melbourne studio selling one thing: the Signature Sleep Box, AU$149,
eight pieces, packed by hand with a message written on the card. Static HTML, CSS and
vanilla JavaScript — **no build step and no dependencies.**

Built to the brand plan: cocoa, oxblood, powder blue, cream and a cream-on-cream stripe;
Playfair Display for display type, Cormorant Garamond italic as a single script accent,
Inter tracked wide and small for utility labels. No moons, no icons.

## Running it

```bash
cd sleep-shop
npm run dev     # http://localhost:4321 (node's http module, nothing to install)
npm test        # 26 checks: catalogue, cart maths, brand compliance, markup
```

`index.html` also opens straight from the filesystem — every script is a classic
`<script>` tag, so there is no module/CORS problem with `file://`.

## Pages

| File | What it does |
| --- | --- |
| `index.html` | Hero, the nine-tile grid, the eight pieces, gifting, occasions, the studio |
| `box.html` | The product: ribbon, quantity, gift message, add to cart |
| `inside.html` | One section per piece, with the material and why it is in there |
| `gifting.html` | How gifting works, the card, delivery, returns, larger orders |
| `about.html` | The studio, materials, how a box gets packed |
| `contact.html` | Validated contact form, studio details, FAQ |
| `cart.html` | Editable boxes and messages, delivery choice, validated demo checkout |
| `404.html` | Not-found page with a route back |

## How it fits together

```
assets/js/data.js    the box, the eight pieces, the five grounds, shop config
assets/js/store.js   cart state and pricing maths — no DOM, so node can test it
assets/js/art.js     every image, generated as SVG on one of the five grounds
assets/js/ui.js      shared chrome: header, footer, cart drawer, theme, toasts
assets/js/*.js       one small script per page (home, box, inside, gifting, cart, contact)
```

**No image files.** All artwork is generated SVG: eleven scene templates (the box closed
and open, mask, pillowcase, scrunchie, socks, bottle, tea, candle, journal, card, ribbon)
drawn on one of the five brand grounds, square because the whole visual system is built
around square tiles. Consistent grounds are what make the set look composed, so a scene
picks its object colours from the ground rather than carrying its own.

**The cart is message-shaped.** A line is one box, a ribbon, and the message we write on
the card — so two boxes going to two different people are two lines even though the
product is identical. Editing a message keeps the box in place, and merges it if the edit
collides with another line that already carries that message. State lives in
`localStorage` under `sleepshop.cart.v1` and recovers from corrupt JSON or an unknown
ribbon by dropping the bad lines.

**Theme** follows `prefers-color-scheme` and can be toggled. Dark mode is cocoa-grounded
so it stays inside the brand palette rather than inventing a second one. The five grounds
themselves are brand constants and do not change with the theme.

**Accessibility.** Skip link and a `main` landmark on every page, a visible focus ring,
`prefers-reduced-motion` honoured, and the cart drawer behaves as a modal dialog — Tab and
Shift+Tab cycle inside it, Escape closes it, and focus returns to whatever opened it.

## What the tests guard

`tests/site.test.mjs` loads the real browser sources under `node:vm` with a stub
`localStorage`, so the cart is tested exactly as the pages run it. Alongside the usual
catalogue, pricing, persistence and markup checks, three tests encode constraints from the
brand plan:

- **No therapeutic or outcome claims.** Every page and script is scanned for language like
  "sleep quality", "stress relief", "wellbeing" or "clinically". That vocabulary is what
  turns a gift box into a therapeutic good in the eyes of the TGA, so it fails the build
  rather than being caught in review.
- **No invented testimonials.** No blockquotes, star glyphs, quote captions or review
  counts. A mocked-up review is a straightforward Australian Consumer Law problem, so
  there is nothing to accidentally ship. Add these only when they are real and you have
  written permission — and delete this test when you do.
- **The script accent stays an accent.** Any `.script` run longer than eight words fails.
  It is for one phrase at a time, not a paragraph.

There is also a check that no page mentions a dollar figure that is not a real price, and
a two-way sitemap check: an unlisted page fails, and so does a listed page that no longer
exists.

## Deploying

A folder of static files, so any static host will do. `vercel.json` carries cache and
security headers; on Vercel, set the project root to `sleep-shop` and use no build command.
`404.html` is picked up automatically by Vercel, Netlify and GitHub Pages.

Before going live:

- Replace the placeholder host `https://sleepshop.example` in `robots.txt` and `sitemap.xml`,
  and the placeholder contact details in `assets/js/data.js`.
- There is no `og:image` — Open Graph images need an absolute URL, which depends on the
  domain. The obvious candidate is the hero box shot on powder.
- Fonts load from Google Fonts. If you licence Canela Deck as the plan suggests, swap
  `--display` in `styles.css`. Without the network the page falls back to Didot and
  Georgia, which is close enough that the layout does not move.

## Notes and limitations

- Checkout, the contact form and the signup are **demonstrations**: they validate input and
  confirm on screen, but nothing is transmitted and no payment is taken. Each page says so.
- The studio, address, phone number and email are fictional.
- The catalogue, the cart and the tile grid require JavaScript; each page carries a
  `<noscript>` note and the prose pages read fine without it.
