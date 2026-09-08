# Finding judgments on AustLII

AustLII is free, no login, works fine on a phone. Two ways in.

## Method 1: type the citation straight into the URL (fastest)

Every AustLII case has a predictable address. Take the citation apart:

**[2026] HCA 25** becomes year `2026`, court `HCA`, number `25`:

```
https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/HCA/2026/25.html
```

Swap in the court code and numbers for anything else. Court codes you will use:

| Court | Code |
|---|---|
| High Court of Australia | `HCA` |
| Federal Court | `FCA` |
| Full Court of the Federal Court | `FCAFC` |
| Supreme Court of Victoria | `VSC` (path uses `vic` not `cth`) |
| Victorian Court of Appeal | `VSCA` (path uses `vic`) |
| County Court of Victoria | `VCC` (path uses `vic`) |

Commonwealth courts sit under `/au/cases/cth/`. Victorian courts sit under `/au/cases/vic/`. So a Victorian one looks like:

```
https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/vic/VSC/2026/123.html
```

## Method 2: search or browse (when you do not know the number)

- **Search box:** go to austlii.edu.au and search the case name in quotes, for example `"Hanson v Faruqi"`. Narrow to Australia, Case Law.
- **Browse a whole year:** replace `viewdoc` with `viewtoc` and drop the number. This lists every judgment that court published that year, newest at the bottom:

```
https://www.austlii.edu.au/cgi-bin/viewtoc/au/cases/cth/FCAFC/2026/
```

That browse view is the reliable way to find a citation number when reporting has not published one yet.

## Faster alternatives for two courts

- **High Court:** hcourt.gov.au → Cases and judgments → Judgments. The Court publishes a short judgment summary PDF for most decisions. Far quicker than reading 80 paragraphs.
- **Federal Court:** search.fedcourt.gov.au, or the Latest judgments page. Catchwords at the top of each judgment give you the issues in about thirty seconds.

## What to grab when verifying a case for a post

1. **Citation** exactly as written, including the year in square brackets.
2. **Date** of delivery.
3. **Bench** (which judges, and whether the decision was unanimous).
4. **Catchwords**, the italic keyword list at the very top. This is the fastest summary of what the case is actually about.
5. **The orders** at the end. This is where you confirm "appeal dismissed" or "allowed in part".
6. **Any sentence you plan to quote**, copied exactly, with the paragraph number.

---

# Open items to verify

Tick these off and send me anything you find, and I will correct the assets.

| Case | What is missing | Where to look |
|---|---|---|
| **Potter (a pseudonym) v The King** [2026] HCA 25 | The section of the SA surveillance devices legislation the Court applied. Look in the catchwords or the first few paragraphs. | `.../au/cases/cth/HCA/2026/25.html` |
| **Hanson v Faruqi** (Full Court, 27 July 2026) | The FCAFC citation number and the names of the three judges. | Browse `.../viewtoc/au/cases/cth/FCAFC/2026/` and look for late July |
| **MacInnes v Wilson** (Raper J, 22 July 2026) | The FCA citation number. | Browse `.../viewtoc/au/cases/cth/FCA/2026/` and look for late July |
| **Smithbridge Guam v Swire Shipping** [2026] FCA 884 | The outcome. Was the anti-arbitration injunction granted or refused? | `.../au/cases/cth/FCA/2026/884.html`, read the orders |
| **Marsden, re Empire Consortium** [2026] FCA 911 | The outcome and what the claim actually was. | `.../au/cases/cth/FCA/2026/911.html` |
| **Grofski v Peabody Energy** [2026] FCA 921 | Whether leave to appeal was granted or refused. | `.../au/cases/cth/FCA/2026/921.html` |

Already confirmed and needing nothing: [2026] FCA 530, [2026] FCA 769, [2026] FCAFC 92, [2026] FCA 871.

## Note on why this is manual

This workflow cannot reach austlii.edu.au, hcourt.gov.au, fedcourt.gov.au or jade.io. They are blocked by the environment's network policy, re-tested 7 August 2026. Allowlisting those four domains would let the daily run verify against the judgment itself instead of news reporting, and would remove this checklist entirely.
