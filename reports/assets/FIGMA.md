# Figma, Lawgistics court post templates

**File:** https://www.figma.com/design/JS4Q7YU4dm9zckfJ8HHuRA
Created 28 Aug 2026 in "niamhkearney23's team". The other team on the account, "Court Update", is a View seat only, so nothing can be built there.

## What is in it

**Nine colour variables** in a collection called `Lawgistics`. cream, navy, navy deep, accent, accent light, body cream, body navy, muted cream, muted navy. Every fill on every template is bound to one of these, so changing a variable moves every slide at once.

**Twelve text styles.** Kicker, Statement large / medium / italic, Roundup headline, Big number, Body, Body roundup, Learn this, Verdict chip, Citation, Wordmark. Playfair Display and TikTok Sans both exist in Figma, so the type matches the rendered decks exactly.

**Three components:**

| Component | What it is |
|---|---|
| Recently in Court / story, cream | The centred roundup slide, with the 800x420 image well |
| Recently in Court / story, navy | Same, dark ground |
| Case post / slide, cream | The left aligned house style, statement + body + Learn this line |

**A "How to use this file" panel** sitting to the left of the artboards, carrying the image well rules, the colour pairing rules, and the three editorial rules that are not design decisions.

## Relationship to the Python pipeline

The Python renderer in `tools/carousel/` is still the source of truth for anything built from a judgment, because that is where the verification tables and guardrails live. Figma is for when Niamh wants to make or adjust a slide herself without a session.

If the palette or type ramp changes in one, change it in the other. The values are in `tools/carousel/_case_head.py` and in the `Lawgistics` variable collection.

## Colour pairing, do not mix

- **Cream slides:** navy text, body cream, muted cream, accent
- **Navy slides:** cream text, body navy, muted navy, accent light
