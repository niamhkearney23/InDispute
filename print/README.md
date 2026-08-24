# Sleep Shop, print pack

The three cards that go in the Gift of Sleep Box, as print ready PDFs with
3 mm bleed. Type is vector and the brand faces embed, read from
`shopify-theme/assets/` so there is one definition of what Sleep Shop is set
in. Run `npm run fonts` in `shopify-theme` first on a fresh checkout.

| Piece | Size | Printed |
| --- | --- | --- |
| Gift card | 148 x 105 mm | Blanks in bulk, the message written on in pen per order |
| Ritual card | 105 x 148 mm | One design, in bulk. The first thing under the lid. |
| Care card | 90 x 55 mm | One design, in bulk |

The ritual card carries the same 15-minute night reset the site teaches, and a
test fails if the two drift apart, so a reprint happens knowingly.

- `npm run print` writes the PDFs into `artwork/`
- `npm run proof` writes 300 dpi PNGs with trim and safe guides drawn on.
  Never send a proof to a printer.
- `npm test` lints the copy: no outcome claims, no promises, no em dashes,
  Australian spelling, and the "none of this is a prescription" line must stay.

**The copy is DRAFT until Niamh signs it off.** Print is the one place a
claims mistake cannot be edited after the fact.
