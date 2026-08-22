# Sleep Shop, social

Instagram first, because that is what the brand plan is built around. Everything
here ports to TikTok and Pinterest with the same captions and the same grounds.

## The taglines, and one to avoid

| Line | Use it |
| --- | --- |
| **Rest is the greatest gift** | Yes. The anchor. Already on the site. |
| **Give the most important thing** | Yes. Good secondary, works as a launch line and on the Birthdays page. |
| ~~Give the gift of sleep~~ | **No.** See below. |

"Give the gift of sleep" is the obvious line and half the category uses it. It is
also the one that turns a box of silk and tea into a product that claims to
deliver sleep. That is a performance claim about the goods, which is exactly what
the TGA and ACCC rules in the brief rule out, and a tagline is the worst place to
have one because it ends up on the bio, the ads and the packaging.

The difference is small and it matters:

- "Rest is the greatest gift" is a statement about rest. No promise attached.
- "Give the most important thing" is a statement about the gesture. Same warmth,
  no promise.
- "Give the gift of sleep" says buying this gives someone sleep.

The linter blocks the third one, so it cannot quietly reappear in a caption in
six months when somebody is writing posts in a hurry.

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

## The calendar

`calendar.json` holds four weeks, sixteen posts, Monday Wednesday Friday Sunday.
Each entry has the format, the ground, the caption and what to shoot. It differs
from the original plan in one way: the mask range now exists, so week three
introduces the masks as the way in rather than being purely about occasions.

Four a week is the most a founder packing boxes can sustain, and it is enough.
Stories on the three days between.

## Profile setup

**Handle** `sleepshop.com.au` if it is free, otherwise `sleepshopmelbourne`.
Match it everywhere so the link in bio is guessable.

**Name field** Sleep Shop, Melbourne. The name field is searchable, the handle
is not, so it carries the location.

**Bio**

```
Rest is the greatest gift.
One box, eight pieces, packed by hand in Melbourne.
Silk masks from $49.
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
