# Photography

Drop the files in this folder and set the matching `photo:` path in
`assets/js/data.js`. Nothing else changes — the illustrations are placeholders
holding the exact crop each photograph needs to fill.

```js
// assets/js/data.js
photo: 'photos/box-closed.jpg',
```

Leave `photo` empty and the drawing stays. You can go one image at a time; a
half-shot site does not look broken, it looks like a site with some photography
in it.

## The brief for every shot

The photography should make people want to crawl into bed. Close, warm and a
little dim: rumpled linen, silk catching lamp light, the journal open on a
bedside table, hands on the ribbon. Evening light or one warm lamp, never
daylight-white. No faces needed — hands and shoulders are fine.

## The eleven shots

Square crop, subject centred, generous margin — the drawings show the framing.
The first eight fill the slots declared in `data.js`; the last three are for
the rituals section, social and the story pages, and do not need a slot to be
worth shooting on the same day.

| File | Shot | Ground / setting |
| --- | --- | --- |
| `box-closed.jpg` | The box, tied, straight overhead. **Shoot this one properly** — it is the hero, the ad and the grid anchor. | Powder board |
| `box-open.jpg` | Lid off and propped behind, tissue folded back, ritual card visible on top | Cream board |
| `card.jpg` | The card being written. Hand, pen, card at an angle — the most persuasive shot you own, because it is the thing a supermarket cannot do | Cocoa board |
| `eye-mask.jpg` | Silk sleep mask, flat, raking lamp light to catch the weave | Cocoa board |
| `pillowcase.jpg` | Silk folded in thirds on rumpled linen, close enough to see the fibre | Bed, powder tones |
| `journal.jpg` | The journal open on a bedside table, pen across it, lamp on | Bedside |
| `wrap.jpg` | The wrap loosely folded, a few lavender stems beside it | Clay rose board |
| `bedside.jpg` | The whole bedside: lamp on, journal closed, mask on top, the last thing before the light goes off | Bedside, dusk |
| `linen.jpg` | Rumpled linen and the corner of the silk pillowcase, nothing else | Bed |
| `hands-opening.jpg` | Two hands lifting the lid, ribbon already loose | Table, cream |
| `wrapping.jpg` | Ribbon being tied, mid-bow | Bench, cocoa |

## Specs

- **Square, 1600 × 1600 minimum.** They are displayed square everywhere and
  `object-fit: cover` crops the overflow, so anything important near an edge
  will be lost on narrow screens.
- **JPEG at about 80%**, or WebP if you have it. Aim under 300 KB each — the
  whole site is currently under 200 KB, and one careless 4 MB photo undoes that.
- **One warm light source.** A lamp or window at dusk. Cool white light makes
  silk look like polyester.
- **No props from outside the box** — no coffee cups, no plants, no folded
  magazines. A cup of tea is allowed on the bedside shots only.

## Checked automatically

`npm test` fails if a `photo:` path points at a file that is not here, so a typo
or a renamed file cannot ship silently.
