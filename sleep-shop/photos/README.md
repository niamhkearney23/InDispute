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

## The eleven shots

Square crop, subject centred, generous margin — the drawings show the framing.
Ground colour per shot is the brand plan's, and consistent grounds are what make
the set look expensive, more than camera quality does.

| File | Shot | Ground |
| --- | --- | --- |
| `box-closed.jpg` | The box, tied, straight overhead. **Shoot this one properly** — it is the hero, the ad and the grid anchor. | Powder |
| `box-open.jpg` | Lid off and propped behind, tissue folded back, contents visible | Cream |
| `card.jpg` | The card being written. Hand, pen, card at an angle — the most persuasive shot you own, because it is the thing a supermarket cannot do | Cocoa |
| `eye-mask.jpg` | Silk eye mask, flat, raking side light to catch the weave | Cocoa |
| `pillowcase.jpg` | Silk folded in thirds, close enough to see the fibre | Powder |
| `scrunchie.jpg` | Scrunchie beside a pillowcase corner, so the colour match reads | Cream |
| `bed-socks.jpg` | Both socks, loosely folded, cuffs showing | Oxblood |
| `pillow-mist.jpg` | Bottle upright, atomiser in focus | Cocoa |
| `tea.jpg` | Tin open, a small spill of leaf beside it | Stripe |
| `candle.jpg` | Candle unlit, from slightly above the rim | Powder |
| `journal.jpg` | Journal closed, cover light raking across the letterpress | Cream |

## Specs

- **Square, 1600 × 1600 minimum.** They are displayed square everywhere and
  `object-fit: cover` crops the overflow, so anything important near an edge
  will be lost on narrow screens.
- **JPEG at about 80%**, or WebP if you have it. Aim under 300 KB each — the
  whole site is currently under 200 KB, and one careless 4 MB photo undoes that.
- **One ground per shot, from the table.** Paint a board or buy card in the five
  colours; do not rely on correcting the background afterwards.
- **Hands and shoulders are fine, faces are not needed.** You do not need a
  model booked to launch.
- **No props from outside the box** — no coffee cups, no plants, no folded
  magazines. The box is the subject.

## Checked automatically

`npm test` fails if a `photo:` path points at a file that is not here, so a typo
or a renamed file cannot ship silently.
