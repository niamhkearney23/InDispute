# One case, one post

Eight single-case carousels from the Supreme Court of Victoria judgments of 19 to 21 August 2026. Five slides each, built from the judgment texts.

**Structure of every deck:** hook / the facts / the question / the ruling with a "Learn this" line / why it matters, inverted.

## Jargon annotations

Every deck glosses the legal terms a non-lawyer would trip over. The term is underlined in accent blue in the body copy, and a small curved arrow points back up to it from a plain English definition underneath.

This is what makes the decks work for two audiences at once. A law student reads past the gloss. Someone who just finds the law interesting gets let in instead of shut out, which is most of the potential audience and almost none of the usual legal content.

**Terms glossed:** contempt, suspended sentence, manslaughter, non-parole period, hearing de novo, no conviction recorded, unincorporated association, struck out, VCAT, liquidators, part heard, discovery, class action, writ.

Definitions are written to be true without being technical. "A writ is only good for a year" rather than "r 5.12 provides for validity for service". If a definition ever needs to be more precise, tell me which and I will tighten it.

Type is larger than earlier decks: statements 88px on the hook, 66px elsewhere, body 33px. Posts alternate navy and cream so the grid keeps its checkerboard.

| Folder | Case | Colour | Hook |
|---|---|---|---|
| `guss/` | Victorian Legal Services Board v Guss (Penalty) [2026] VSC 529 | navy | "He is 88. He is going to prison for seven days." |
| `bogo/` | DPP v Bogojevska [2026] VSC 534 | cream | "She pleaded guilty to manslaughter. The sentence turned on what came after." |
| `rm/` | RM v DPP [2026] VSC 544 | navy | "Ten months in detention. Set aside." |
| `marriott/` | Marriott v Grigorovitch [2026] VSC 535 | cream | "She says she was assaulted at a branch meeting." |
| `keycon/` | Keycon Pty Ltd v Modi [2026] VSC 533 | navy | "He asked for an adjournment at 6:06pm the night before." |
| `coolbreeze/` | Re Cool Breeze Clothing (No 1) [2026] VSC 530 | cream | "They served the expert report during the trial." |
| `lam/` | Lam v Leung (Costs) [2026] VSC 540 | navy | "Both sides won. Both sides paid." |
| `doran/` | Doran v Astrazeneca [2026] VSC 536 | cream | "Three class actions. Writs filed, never served." |

That is eight weekdays of case posts, all verified against the judgments.

## Suggested order

Lead with the ones that carry a story: **guss**, **rm**, **bogo**, **marriott**. Then the procedure four: **keycon**, **coolbreeze**, **doran**, **lam**. Alternating them navy, cream, navy, cream also keeps the grid right.

## ⚠️ Accuracy, per deck

**marriott** — interlocutory only. The assault is **alleged** and slide 1 says "she says". Slide 5 is given over entirely to the point that nothing has been decided. Do not let a caption or reply turn it into a finding.

**rm** — child offender under a pseudonym. Section 534 of the Children, Youth and Families Act prohibits identifying him. The deck uses only the Court's initials and carries no location, school, family or other identifying detail. Do not add any.

**bogo** — the victim is named in the judgment but deliberately not named on the slides. Her son died days before the plea hearing.

**guss** — the contemnor is named, convicted, and the facts are as the judgment states them. Fine as written.

## Captions

Each deck follows the same caption shape: hook, facts, the question, the ruling, the learning line spelled out, then the sign-off from `reports/assets/SIGN-OFF.md`, then the disclaimer and hashtags. The roundup kit at `reports/assets/2026-08-21/POSTING-KIT.md` already contains the long-form paragraph for guss, bogo, rm and marriott, which can be lifted straight into the individual captions.

## Rebuilding

Content lives in `tools/carousel/_cases.py` as data. `tools/carousel/buildcases.py` generates and renders all eight. Edit the data, rerun the builder.
