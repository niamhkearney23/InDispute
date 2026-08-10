# Sleep Shop, Shopify theme customisation

Sections, snippets and templates that drop on top of **Dawn (latest)**. Nothing here
replaces Dawn's own files, so Dawn can still be updated underneath.

Australian English throughout, no em dashes in customer facing copy, and no therapeutic
or health claims anywhere. Those three rules are enforced by `npm test` rather than left
to review. See "What the tests block" below.

## Installing

1. In Shopify admin, duplicate your live Dawn theme so you have something to roll back to.
2. Copy the folders in this directory over the duplicated theme, keeping the structure:

```
assets/     sleep-shop.css, gift-message.js, arrives-by.js
config/     settings_schema.json  (merge, see below)
sections/   the Sleep Shop sections
snippets/   the Sleep Shop snippets
templates/  product.signature-sleep-box.json, page.*.json
```

3. `config/settings_schema.json` here contains **only the Sleep Shop block**. Paste that
   object into Dawn's existing `settings_schema.json` array rather than overwriting the
   file, or you will lose Dawn's own settings.
4. Assign the template: Products, The Signature Sleep Box, Theme template,
   `signature-sleep-box`.
5. Create the pages (About, FAQ, Shipping and Delivery, Returns, Contact, Birthdays) and
   assign each its matching template.
6. Fill in the settings listed below. Several are deliberately blank and the theme hides
   the block rather than inventing a value.

## Settings you must fill before launch

Online store, Themes, Customise, Theme settings, **Sleep Shop**.

| Setting | Why it is blank |
| --- | --- |
| Dispatch cut-off time | You are supplying the real time. Until it is set, the cut-off line does not render anywhere. |
| Metro delivery window | Same. Feeds the "arrives by" line. |
| Regional delivery window | Same. |
| Express delivery window | Same. |
| Studio address, email, phone | Real contact details, used on Contact and in the footer. |

Nothing invents a delivery promise. If the settings are empty the announcement bar falls
back to the shipping message alone, and the "arrives by" line is omitted rather than
guessed.

## Structure of the product page

Top to bottom, matching the brief:

| Order | Section or snippet |
| --- | --- |
| 1 | `sections/announcement-shipping.liquid`, shipping message and dispatch cut-off |
| 2 | `sections/main-product-sleep-box.liquid`, gallery of 8 to 10 images plus unboxing video |
| 3 | Title, subtitle, price, `snippets/price-afterpay.liquid` |
| 4 | `snippets/gift-message-field.liquid`, 250 characters with a live counter |
| 5 | `snippets/dispatch-estimate.liquid`, arrives by and cut-off, beside the button |
| 6 | Single add to cart, no competing buttons |
| 7 | `snippets/reassurance-row.liquid` |
| 8 | `sections/product-whats-inside.liquid`, all eight items |
| 9 | `sections/product-keepsake.liquid` |
| 10 | `sections/founder-teaser.liquid`, links to About |
| 11 | `snippets/accordion.liquid` x5 inside the main section |
| 12 | `sections/trust-strip.liquid`, `sections/product-reviews.liquid`, payment badges in footer |

The gift message is submitted as a line item property named `Gift message`, so it appears
on the order, the packing slip and in Klaviyo without any extra app.

## Judge.me

`sections/product-reviews.liquid` renders the Judge.me widget div and nothing else. With
no reviews the section shows a short honest line and no star rating, no count, no
placeholder cards. Delete `blocks: []` from the template only once real reviews exist.

## Klaviyo

The popup is added in the Klaviyo app, not in theme code, so it can be changed without a
theme deploy. `snippets/klaviyo-embed.liquid` carries only the onsite script tag; paste
your public API key into the theme setting.

## Performance

- Every image uses Shopify's CDN sizing with `srcset`, `loading="lazy"` below the fold,
  `fetchpriority="high"` on the first gallery image only.
- `sleep-shop.css` is one file, roughly 14 KB, no framework.
- Two small scripts, both deferred, both no dependency. Total JavaScript under 3 KB.
- Alt text is required on gallery images. The test suite fails the build if an image in a
  section default is missing one.

## What the tests block

`npm test` from this directory. It reads the Liquid and JSON as text and fails on:

- **Therapeutic or health claims.** "improves sleep", "aids sleep", "reduces stress",
  "relieves", "promotes deep sleep", "wellness", "therapeutic" and similar. This is a TGA
  and ACCC requirement, not a style preference, so it fails the build.
- **Em dashes** anywhere in customer facing copy.
- **American spelling** in copy.
- **Testimonials or review counts** in markup, so nothing fake can ship before Judge.me
  has real ones.
- **Savings or value claims**, for example "valued at", "save $", "RRP".
- **Returns copy** that says "no refunds" or "all sales final", and the absence of the
  Australian Consumer Law sentence on the returns page.

## Not built

"Build Your Own Box" is deliberately absent, as instructed. The homepage template is
waiting on your nine sections of copy.
