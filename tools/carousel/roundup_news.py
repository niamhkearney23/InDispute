#!/usr/bin/env python3
"""RECENTLY IN COURT, restyled in the weekly-news-roundup shape.

Reference: @friendsthatinvest. What that format actually does, stripped of
its surface:
  - centred layout, not left aligned
  - small brand mark top centre
  - ONE story per slide, big serif headline with italics on the emphasis
  - a visual object in the middle of the slide
  - three or four lines of plain copy underneath, centred
  - a positioning line plus a follow prompt on the closer
  - a letterspaced keyword rail on the cover

Adapted to house style rather than copied:
  - NO PHOTOS. They use press shots of Zuckerberg and Altman. This account
    cannot: no licence, and putting a litigant's face on a slide is a very
    different risk from putting a CEO's face on a finance post. The visual
    object in the middle is a typographic verdict chip instead, which does
    the same layout job.
  - Cream and navy, Playfair and TikTok Sans, unchanged.
  - The window is named honestly on the cover. The roundup was renamed
    "Recently in Court" precisely so it stops claiming to be today's news.

All four decisions are already built and verified in reports/assets/cases/.
Nothing new is asserted here.
"""
import pathlib, subprocess
import _case_head as H

OUT = H.OUT
BASE = pathlib.Path(__file__).parent

EXTRA = """
.nwell{flex:1;display:flex;flex-direction:column;justify-content:center;
  align-items:center;text-align:center;padding-bottom:10px;}
.brand{font-family:'TikTok Sans',sans-serif;font-size:17px;font-weight:600;
  letter-spacing:.34em;text-transform:uppercase;color:#A8A093;
  margin-top:14px;margin-bottom:52px;}
.dark .brand{color:#7C8598;}
.nhead{font-family:'Playfair',serif;font-weight:600;font-size:70px;line-height:1.1;
  letter-spacing:-.015em;max-width:880px;}
.nhead em{font-style:italic;font-weight:500;}
.chipwrap{margin:48px 0;}
.verdict{display:inline-block;font-family:'TikTok Sans',sans-serif;font-size:21px;
  font-weight:600;letter-spacing:.2em;text-transform:uppercase;
  padding:18px 38px;border:2px solid #3A5697;color:#3A5697;border-radius:2px;
  max-width:640px;}
.dark .verdict{border-color:#6E86C9;color:#6E86C9;}
.big{display:block;font-family:'Playfair',serif;font-weight:600;font-size:104px;
  line-height:1;letter-spacing:-.03em;color:#171D2B;margin-bottom:14px;}
.dark .big{color:#EDE7DC;}
.nbody{font-family:'TikTok Sans',sans-serif;font-size:30px;line-height:1.58;
  color:#4E4A3F;max-width:770px;}
.dark .nbody{color:#A9B0C2;}
.ncase{margin-top:30px;font-family:'Playfair',serif;font-style:italic;
  font-size:26px;color:#8C8577;}
.dark .ncase{color:#7C8598;}

.rail{font-family:'TikTok Sans',sans-serif;font-size:19px;font-weight:500;
  letter-spacing:.4em;text-transform:uppercase;color:#A8A093;}
.dark .rail{color:#6F7A90;}
.railtop{margin-bottom:auto;padding-top:10px;}
.railbot{margin-top:auto;padding-bottom:10px;}
.covwell{flex:1;display:flex;flex-direction:column;justify-content:space-between;
  align-items:center;text-align:center;}
.covmid{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;}
.covhead{font-family:'Playfair',serif;font-weight:600;font-size:82px;line-height:1.06;
  letter-spacing:-.02em;max-width:900px;}
.covhead em{font-style:italic;font-weight:500;}
.covsub{margin-top:34px;font-family:'TikTok Sans',sans-serif;font-size:27px;
  line-height:1.5;color:#6E6858;}
.dark .covsub{color:#8892A6;}
.follow{margin-top:44px;font-family:'Playfair',serif;font-style:italic;
  font-size:34px;color:#3A5697;}
.dark .follow{color:#6E86C9;}
"""

CSS = H.CSS.replace(".foot{margin-top:auto;", EXTRA + "\n.foot{margin-top:auto;")

RAIL = "judgments &nbsp;&middot;&nbsp; penalties &nbsp;&middot;&nbsp; appeals"


def page(n, total, dark, inner, cite, swipe=False, well="nwell"):
    sw = ('<div class="swipe">swipe &rarr;</div>' if swipe
          else '<div class="mark">LAWGISTICS</div>')
    body = "dark" if dark else "light"
    html = (f'<!doctype html><html><head><meta charset="utf-8">'
            f'<style>{CSS}</style></head>\n'
            f'<body class="{body}"><div class="grain"></div><div class="page">\n'
            f'  <div class="head"><div class="kicker">RECENTLY IN COURT</div>'
            f'<div class="num">{n:02d} / {total:02d}</div></div>\n'
            f'  <div class="{well}">{inner}</div>\n'
            f'  <div class="foot"><div class="cite">{cite}</div>{sw}</div>\n'
            f'</div></body></html>')
    (OUT / f"news{n:02d}.html").write_text(html)
    return f"out/news{n:02d}.html"


def story(head, chip, big, body, case):
    feature = (f'<span class="verdict"><span class="big">{big}</span>{chip}</span>'
               if big else f'<span class="verdict">{chip}</span>')
    return ('<div class="brand">Lawgistics</div>'
            f'<div class="nhead">{head}</div>'
            f'<div class="chipwrap">{feature}</div>'
            f'<div class="nbody">{body}</div>'
            f'<div class="ncase">{case}</div>')


TOTAL = 6
paths = []

# 1. COVER
paths.append(page(1, TOTAL, False, well="covwell", swipe=True,
    cite="Four Australian decisions, August 2026. Not legal advice.",
    inner=(
        f'<div class="rail railtop">{RAIL}</div>'
        '<div class="covmid">'
        '<div class="covhead">Did you miss what happened '
        '<em>in court?</em></div>'
        '<div class="covsub">Four decisions. August 2026. '
        'The ones actually worth knowing.</div>'
        '</div>'
        f'<div class="rail railbot">{RAIL}</div>'
    )))

# 2. HARVEY NORMAN
paths.append(page(2, TOTAL, True,
    cite="ASIC v Latitude Finance Australia and Harvey Norman Holdings, Federal Court, 28 July 2026",
    inner=story(
        'Harvey Norman just lost <em>$55 million</em>',
        "in penalties", "$55m",
        'Sixty months interest free, no deposit. All true. What the ads did '
        'not say is that you had to take out a credit card, with an '
        'establishment fee and monthly account service fees. At least $537 in '
        'fees on the interest free deal.',
        'ASIC v Latitude Finance and Harvey Norman')))

# 3. KO
paths.append(page(3, TOTAL, False,
    cite="The King v Ko [2026] HCA 29, High Court of Australia, 12 August 2026",
    inner=story(
        'A conviction was quashed over <em>one missing sentence</em>',
        "Retrial ordered", None,
        'The jury was told that if it found he saw a real chance of drugs in '
        'the shipment, it could infer he meant to import them. It was never '
        'told it still had to decide whether he actually meant to. Awareness '
        'of a risk is not intention.',
        'The King v Ko [2026] HCA 29')))

# 4. FARRUGIA
paths.append(page(4, TOTAL, True,
    cite="Farrugia v The King [2026] HCA 28, High Court of Australia, 12 August 2026",
    inner=story(
        'His own barrister said he was <em>the worse one</em>',
        "Appeal dismissed", None,
        'One barrister acted for two co-offenders at the same sentencing. He '
        'told the judge his own client was more culpable. Eleven years, '
        'against nine. He appealed and lost, because he never put on evidence '
        'of what he was advised.',
        'Farrugia v The King [2026] HCA 28')))

# 5. S32
paths.append(page(5, TOTAL, False,
    cite="Plaintiff S32/2026 v Minister for Immigration and Citizenship [2026] HCA 27, 5 August 2026",
    inner=story(
        'He went straight to the High Court. <em>It backfired.</em>',
        "Abuse of process", None,
        'Days from removal, he applied for constitutional writs. But there was '
        'a court he never asked first. Skipping a rung of the review ladder '
        'was not a shortcut, it was an abuse of process. Dismissed with costs.',
        'Plaintiff S32/2026 v Minister [2026] HCA 27')))

# 6. CLOSER
paths.append(page(6, TOTAL, True, well="covwell",
    cite=("Summaries only. Ko's conviction is quashed and a retrial ordered. "
          "Read the judgments before relying on them. Not legal advice."),
    inner=(
        f'<div class="rail railtop">{RAIL}</div>'
        '<div class="covmid">'
        '<div class="covhead">Australian judgments, <em>in plain '
        'English.</em></div>'
        '<div class="follow">follow @lawgisticsaustralia</div>'
        '<div class="covsub">Lawgistics places Australian law students in '
        'legal internships in Kuala Lumpur.<br>Applications via the link in '
        'bio.</div>'
        '</div>'
        f'<div class="rail railbot">{RAIL}</div>'
    )))

subprocess.run(["node", "shoot.mjs"] + paths, cwd=BASE, check=True)
print("done")
