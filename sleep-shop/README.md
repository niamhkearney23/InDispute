# Hush — sleep shop storefront

A complete storefront for a fictional Melbourne sleep shop: mattresses, pillows, bedding,
sleepwear and quiet sleep tech. Static HTML, CSS and vanilla JavaScript — **no build step,
no dependencies, no network calls at runtime.**

## Running it

```bash
cd sleep-shop
npm run dev     # http://localhost:4321 (node's http module, nothing to install)
npm test        # 17 checks over the catalogue, cart maths and page markup
```

`index.html` also opens straight from the filesystem — every script is a classic
`<script>` tag, so there is no module/CORS problem with `file://`.

## Pages

| File | What it does |
| --- | --- |
| `index.html` | Hero, category tiles, featured products, trial explainer, reviews, newsletter |
| `shop.html` | Full catalogue with category / price / search filters, sorting, URL-synced state |
| `product.html` | Detail page driven by `?id=`, with size variants, quantity, specs and related items |
| `quiz.html` | Four-question fit quiz that ranks the catalogue and shows its reasoning |
| `cart.html` | Editable cart, promo codes, validated checkout and an order confirmation |
| `guides.html` | Six sleep guides, each linking to the products it mentions |
| `about.html` | Story, materials, the 100-night trial in full, delivery and returns |
| `contact.html` | Validated contact form, shop details and an FAQ |
| `404.html` | Not-found page with a way back and the popular products |

## How it fits together

```
assets/js/data.js    catalogue + config (products, categories, shipping, promo codes)
assets/js/store.js   cart state and all pricing maths — no DOM, so node can test it
assets/js/art.js     every image on the site, generated as SVG from a per-product palette
assets/js/ui.js      shared chrome: header, footer, cart drawer, theme, toasts, product cards
assets/js/*.js       one small script per page (home, shop, product, quiz, cart-page, contact)
```

**No image files.** Product photography is generated SVG: `art.js` holds eleven scene
templates (mattress, pillow, sheets, duvet, blanket, sleepwear, lamp, sound, mask, bottle,
curtain) and each product supplies a three-colour palette, so the catalogue has distinct
artwork with nothing to download.

**Cart** lives in `localStorage` under `hush.cart.v1` and survives reloads. Corrupt JSON,
quota errors and products that no longer exist are all handled by dropping the bad lines
rather than throwing. Everything subscribes to one store, so the header badge, the drawer
and the cart page never disagree.

**Theme** follows `prefers-color-scheme` by default and can be toggled; the choice is
stored and applied by a small inline script before first paint, so there is no flash.

**Accessibility.** Skip link and a `main` landmark on every page, a visible focus ring,
`prefers-reduced-motion` honoured, and the cart drawer behaves as a modal dialog — Tab and
Shift+Tab cycle inside it, Escape closes it, and focus returns to whatever opened it (or to
the cart button if that element has since been re-rendered).

## Deploying

It is a folder of static files, so any static host will do. `vercel.json` is included with
cache and security headers; on Vercel, set the project root to `sleep-shop` and use no
build command. `404.html` is picked up automatically by Vercel, Netlify and GitHub Pages.

Before going live, replace the placeholder host `https://hush.example` in `robots.txt` and
`sitemap.xml`. There is no `og:image` — Open Graph images need an absolute URL, which
depends on the domain you deploy to.

## Adding a product

Append an object to `PRODUCTS` in `assets/js/data.js`. `art` picks a scene template, `tone`
is `[background, accent, subject]`, and `sizes` is optional — supply it and the price
becomes `price + delta` per size, with the zero-delta size treated as the advertised one.
`match` tags feed the quiz. The test suite fails loudly if a required field is missing, if
a category has no stock, or if any page links to a product id that does not exist.

## Testing

`tests/site.test.mjs` loads the real browser sources under `node:vm` with a stub
`localStorage`, so the cart is tested exactly as the pages run it. It covers catalogue
integrity, SVG generation and escaping, line merging, variant pricing, the free-delivery
threshold (including a discount that pushes an order back under it), promo codes,
persistence and recovery from junk in storage, plus markup, share-metadata, sitemap and
internal-link checks across every page.

The sitemap check is deliberately two-way: adding a page without listing it fails, and so
does listing a page that no longer exists.

## Notes and limitations

- Checkout, the contact form and the newsletter are **demonstrations**: they validate
  input and confirm on screen, but nothing is transmitted and no payment is taken. This is
  stated on the page, not just here.
- The catalogue, reviews, addresses and phone numbers are fictional.
- Product grids, the cart and the quiz require JavaScript; each page carries a `<noscript>`
  note and the prose pages (about, guides, contact) read fine without it.
