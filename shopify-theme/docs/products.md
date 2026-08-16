# Products to create in Shopify admin

The theme cannot create products, only render them. Create these in admin, then
assign the templates listed against each one.

Prices below are **suggestions, not decisions.** They are set so the range has a
sensible ladder under the box and so Afterpay stays useful. Change them freely:
nothing in the theme hardcodes a price, every figure on the page is read from
the product, and the Afterpay instalment divides from the live price.

## Collection

**Sleep masks**, handle `sleep-masks`. Template `sleep-masks`. Add all four
masks to it. The cross sell rows and the range page both read this collection,
so adding a fifth mask later puts it everywhere without a theme edit.

## The four masks

All four use the same covered strap. Every one needs a square hero image, and
alt text that describes the object rather than repeating the title.

| Product | Handle | Suggested price | Option | Values |
| --- | --- | --- | --- | --- |
| Mulberry Silk Sleep Mask | `mulberry-silk-sleep-mask` | $49 | Colour | Oxblood, Powder, Cocoa, Cream |
| Weighted Sleep Mask | `weighted-sleep-mask` | $69 | Colour | Cocoa, Powder |
| Contoured Sleep Mask | `contoured-sleep-mask` | $59 | Colour | Cocoa, Cream |
| Travel Sleep Mask | `travel-sleep-mask` | $45 | Colour | Oxblood, Cocoa |

Template for all four: `sleep-mask`.

### Descriptions

Written to the same rule as everything else: material, weight, dimensions, fit
and how to wash it. Nothing about what it does to a person. The tests fail the
build if a health claim appears, and product descriptions typed into admin are
not covered by those tests, so this is the one place the discipline is manual.

**Mulberry Silk Sleep Mask.** Grade 6A mulberry silk at 22 momme, on both faces
rather than silk on the front and polyester behind. The seam sits on the outside
so nothing rests against the eyelid, and the strap is covered along its whole
length. Cut from the same run as the pillowcase in the Signature Sleep Box, so
the colours match. Hand wash cold, dry flat, out of the sun.

**Weighted Sleep Mask.** 180 grams of glass microbeads in eight stitched
channels, so the weight sits evenly rather than sliding to one side. Silk face,
brushed cotton lining, same covered strap. It is heavier than it looks in a
photograph, which is the point. Spot clean, or remove the inner and wash the
cover on a gentle cycle.

**Contoured Sleep Mask.** Moulded cups that arch over the eye socket, so you can
open your eyes underneath it and nothing touches your lashes. Blocks light at
the nose, which is where flat masks leak. Silk outer over a light moulded foam.
Wipe clean.

**Travel Sleep Mask.** Folds to the size of a passport and holds its shape after
being sat on. Silk outer, packable inner, and a strap that lies flat so it does
not press when your head is against a seat. Comes in a small silk pouch. Hand
wash cold.

## The box

**The Signature Sleep Box**, handle `the-signature-sleep-box`, $149. Template
`signature-sleep-box`. Already built.

Add the masks collection to the cross sell row on the box template if you want
the range shown there too. It is a section setting, no code needed.

## Metafield used by the cards

The range grid shows an optional one line specification under each title. It
reads `descriptors.subtitle`, which is a metafield Shopify creates for you under
Settings, Custom data, Products, as **Subtitle**. Suggested values:

- Mulberry Silk: `22 momme silk, four colours`
- Weighted: `180 g, glass microbead`
- Contoured: `Moulded cups, zero lash contact`
- Travel: `Folds to passport size`

Leave it empty and the card simply omits the line.
