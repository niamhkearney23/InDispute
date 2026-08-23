# Products to create in Shopify admin

The theme cannot create products, only render them. Create these in admin, then
assign the templates listed against each one.

Prices on the pieces are **suggestions, not decisions.** They are set so the
range has a sensible ladder under the box and so Afterpay stays useful. Change
them freely: nothing in the theme hardcodes a price, every figure on the page is
read from the product, and the Afterpay instalment divides from the live price.

## Collection

**The bedside**, handle `the-bedside`. Template `the-bedside`. Add all four
pieces to it. The cross sell rows, the homepage grid and the shop page all read
this collection, so adding a fifth piece later puts it everywhere without a
theme edit.

## The box

**The Gift of Sleep Box**, handle `the-gift-of-sleep-box`, $149. Template
`gift-of-sleep-box`. The hero product. One option, Ribbon, values Clay rose and
Powder blue.

## The four pieces

Each piece is in the box and on the shelf. Every one needs a square hero image,
and alt text that describes the object rather than repeating the title.

| Product | Handle | Suggested price | Option | Values |
| --- | --- | --- | --- | --- |
| Silk Sleep Mask | `silk-sleep-mask` | $49 | Colour | Clay rose, Powder, Cocoa, Cream |
| Silk Pillowcase | `silk-pillowcase` | $89 | Colour | Clay rose, Powder, Cocoa, Cream |
| AM / PM Journal | `am-pm-journal` | $39 | none | |
| Lavender Sleep Wrap | `lavender-sleep-wrap` | $59 | none | |

Template for all four: `bedside-piece`. The template's colour picker appears
only on products with a single Colour option and stays out of the way on the
journal and the wrap.

### Descriptions

Written to the same rule as everything else: material, weight, dimensions, fit
and how to care for it. Nothing about what it does to a person. The tests fail
the build if a health claim appears, and product descriptions typed into admin
are not covered by those tests, so this is the one place the discipline is
manual.

**Silk Sleep Mask.** Grade 6A mulberry silk at 22 momme, on both faces rather
than silk on the front and polyester behind. The seam sits on the outside so
nothing rests against the eyelid, and the strap is covered along its whole
length. Cut from the same run as the pillowcase, so the colours match. Hand
wash cold, dry flat, out of the sun.

**Silk Pillowcase.** Standard 48 by 74 cm in the same 22 momme, grade 6A silk,
with a hidden zip. Heavy enough to drape properly and to survive being washed
for years. Silk holds far less moisture than cotton, which is why anything you
put on your face at night stays on your face. Hand wash cold or gentle cycle in
a bag, dry flat.

**AM / PM Journal.** Ninety-six pages, section-sewn so it lies flat on a
bedside table. A page for the end of the day and a page for the start of the
next one: the PM page is for whatever is still circling, the AM page is three
lines before the phone comes on. Unlined, letterpress cover on cotton board.

**Lavender Sleep Wrap.** Washed linen outside, Australian lavender and wheat
inside, with a good weight to it. It drapes across the shoulders or over the
eyes, warmed for a minute or straight off the shelf. The cover unbuttons and
washes on a gentle cycle; the inner is spot clean only.

## Pages

Create these pages and assign the matching template:

| Page | Handle | Template |
| --- | --- | --- |
| Sleep rituals | `sleep-rituals` | `sleep-rituals` |
| About | `about` | `about` |
| FAQ | `faq` | `faq` |
| Shipping and Delivery | `shipping` | `shipping` |
| Returns | `returns` | `returns` |
| Contact | `contact` | `contact` |
| Birthdays | `birthdays` | `birthdays` |

The rituals page links to the four pieces by handle, so create the products
first or the links 404.

## Metafield used by the cards

The grid shows an optional one line specification under each title. It reads
`descriptors.subtitle`, which is a metafield Shopify creates for you under
Settings, Custom data, Products, as **Subtitle**. Suggested values:

- Silk Sleep Mask: `22 momme silk, four colours`
- Silk Pillowcase: `22 momme silk, hidden zip`
- AM / PM Journal: `96 pages, sewn flat`
- Lavender Sleep Wrap: `Washed linen, Australian lavender`

Leave it empty and the card simply omits the line.

## Not yet, on purpose

Future occasion boxes (For Mum, the burnt-out friend, Birthday, New Mum, New
home, Thinking of you, Corporate) and future products (sleep light, acupressure
mat, pill case, diffuser, oil, alarm clock) are part of the vision, not the
launch. Nothing in the theme references them and nothing should be created for
them yet. The Birthdays landing page sells the one box; it is an occasion door,
not an occasion product.
