# Sleep Shop, social

Instagram first, because that is what the brand plan is built around. Everything
here ports to TikTok and Pinterest with the same captions and the same grounds.

## The taglines

| Line | Use it |
| --- | --- |
| **Give the gift of sleep** | Yes. The brand line, chosen by the founder. See the decision record below. |
| **Rest is the greatest gift** | Yes. Secondary, still true, still on the ritual card. |
| **Give the most important thing** | Yes. Works as a launch line and for occasions. |

### The decision record, so nobody re-litigates it by accident

"Give the gift of sleep" was blocked here originally: read strictly, it says the
product delivers sleep, and the brief's TGA and ACCC rules exclude performance
claims about the goods. That reasoning was put to the founder, twice, and the
line was chosen anyway as the core of the brand. That is a legitimate call to
make: as a tagline it sits close to puffery, the kind of aspirational line a
reasonable customer reads as sentiment rather than as a promise that a silk
mask administers sleep. Half the category uses it for exactly that reason.

What the decision does **not** change: the line is the ceiling, not a licence.
Everything underneath it stays inside rest, ritual, comfort, care and the
object. The linter still fails any caption that promises an outcome, and it
also blocks the escalations of the tagline itself: "delivers sleep",
"guarantees sleep", "the gift of better sleep". If a regulator or a lawyer
ever pushes back on the line, it is one string in `calendar.json`, one in the
site data, and this section to update.

## Caption rules

Every caption stays inside **rest, ritual, comfort, care, and the object itself**.
Describe the silk, the weight, the bench, the ribbon, the person receiving it.
Never describe an outcome in the recipient's body or mind.

Fails the linter:

- Health or outcome claims, including the tagline above
- Em dashes
- American spelling
- Testimonials or review counts before real ones exist
- Discount and urgency language, since we do not run sales

Run it: `npm test` in this directory.

## The grid

Nine tile rhythm from the brand plan, read down the columns. Every third tile is
type led on a solid ground, and no two tiles on the same ground touch. Post in
that order and the profile composes itself.

Five grounds only: cocoa, rose, powder, cream, cream stripe. Consistency of
ground is what makes a feed look expensive, more than camera quality does.

## Type tiles, ready to post

`npm run tiles` writes 1080 by 1080 PNGs into `tiles/`, built from the brand
palette and type. Four of the nine tiles in every cycle are type on a solid
ground, so this is a third of your posting load done without a camera.

Change the lines in `calendar.json` and run it again.

The typefaces are read out of `shopify-theme/assets/` and embedded in each SVG,
so the tiles are set in exactly what the shop is set in and there is only one
place that decides. Run `npm run fonts` in `shopify-theme` first if you have a
fresh checkout, or the tile build stops rather than quietly rendering in
whatever serif your machine happens to have. It stopped being theoretical once:
the first run of these tiles went out in Chromium's default serif.

## The calendar

`calendar.json` holds four weeks, sixteen posts, Monday Wednesday Friday Sunday.
Each entry has the format, the ground, the caption and what to shoot. Week one
builds the world, week two reveals the box, week three is the rituals, week
four is the launch. The rituals week is the editorial spine: content that is
useful on its own, with the pieces underneath it.

Four a week is the most a founder packing boxes can sustain, and it is enough.
Stories on the three days between.

## Profile setup

**Handle** `sleepshop.com.au` if it is free, otherwise `sleepshopmelbourne`.
Match it everywhere so the link in bio is guessable.

**Name field** Sleep Shop, Melbourne. The name field is searchable, the handle
is not, so it carries the location.

**Bio**

```
Give the gift of sleep.
One box, four pieces, packed by hand in Melbourne.
Instead of flowers.
```

Then the link. Do not put a phone number in the bio: it turns the profile into a
support channel and nobody staffs it.

**Highlights**, three only, covers are cocoa tiles with display type:
What's inside, Gifting, Melbourne.

## What to do first

1. Register the handle. Even if you post nothing for a fortnight.
2. Run `npm run tiles` and post the week one Monday tile.
3. Shoot the eleven images in `sleep-shop/photos/README.md`. One shoot day
   covers three cycles if you change the ground and move the props.
4. Post four a week for four weeks. Do not start daily. You cannot keep it up
   and a feed that slows down looks worse than one that was always steady.
