#!/usr/bin/env python3
"""RECENTLY IN COURT, news-roundup format, built for images.

Changes from the first news-format trial (roundup_news.py):

  1. IMAGE WELL. Every story slide has an 800x460 bordered block sitting where
     the reference account puts its photo. It is postable as it stands, because
     the verdict sits inside it, AND it is an exact drop target: put an 800x460
     picture over that block and the layout does not move.

  2. FUNNIER. Headlines are written to be enjoyed, not just understood. The
     cover is "Court had a month", which is dry rather than chatty, because the
     house voice is premium and "Girl, did you miss the tea" is not it.

  3. Four stories chosen for entertainment as much as for law. Commercial
     leads, per the standing preference.

Every fact is already verified in an existing posting kit. Nothing new is
asserted here.

GUARDRAILS
  - Ko: conviction quashed, retrial ordered. On the slide.
  - Lewis: INTERLOCUTORY. Nothing decided about whether discrimination
    happened. The strike out application simply failed. On the slide.
  - Guss: real, named, convicted. Stated exactly as the judgment does.
  - Harvey Norman: no "highest penalty" line, no class action.
"""
import pathlib, subprocess
import _case_head as H

OUT = H.OUT
BASE = pathlib.Path(__file__).parent

EXTRA = """
.nwell{flex:1;display:flex;flex-direction:column;justify-content:center;
  align-items:center;text-align:center;}
.brand{font-family:'TikTok Sans',sans-serif;font-size:16px;font-weight:600;
  letter-spacing:.34em;text-transform:uppercase;color:#A8A093;margin-bottom:26px;}
.dark .brand{color:#7C8598;}
.nhead{font-family:'Playfair',serif;font-weight:600;font-size:62px;line-height:1.1;
  letter-spacing:-.015em;max-width:880px;}
.nhead em{font-style:italic;font-weight:500;}

/* the image well. 800x460. drop a picture straight over it. */
.imgwell{width:800px;height:420px;margin:34px 0 30px;
  border:1px solid rgba(23,29,43,.22);border-radius:2px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:rgba(23,29,43,.03);}
.dark .imgwell{border-color:rgba(237,231,220,.22);background:rgba(237,231,220,.04);}
.wbig{font-family:'Playfair',serif;font-weight:600;font-size:118px;line-height:.92;
  letter-spacing:-.035em;color:#171D2B;}
.dark .wbig{color:#EDE7DC;}
.wverdict{margin-top:20px;font-family:'TikTok Sans',sans-serif;font-size:21px;
  font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#3A5697;}
.dark .wverdict{color:#6E86C9;}
.wonly{font-family:'TikTok Sans',sans-serif;font-size:26px;font-weight:600;
  letter-spacing:.26em;text-transform:uppercase;color:#3A5697;}
.dark .wonly{color:#6E86C9;}

.nbody{font-family:'TikTok Sans',sans-serif;font-size:27px;line-height:1.52;
  color:#4E4A3F;max-width:790px;}
.dark .nbody{color:#A9B0C2;}
.ncase{margin-top:22px;font-family:'Playfair',serif;font-style:italic;
  font-size:24px;color:#8C8577;}
.dark .ncase{color:#7C8598;}

.rail{font-family:'TikTok Sans',sans-serif;font-size:19px;font-weight:500;
  letter-spacing:.4em;text-transform:uppercase;color:#A8A093;}
.dark .rail{color:#6F7A90;}
.railtop{margin-bottom:auto;padding-top:10px;}
.railbot{margin-top:auto;padding-bottom:10px;}
.covwell{flex:1;display:flex;flex-direction:column;justify-content:space-between;
  align-items:center;text-align:center;}
.covmid{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;}
.covhead{font-family:'Playfair',serif;font-weight:600;font-size:118px;line-height:1;
  letter-spacing:-.03em;}
.covhead em{font-style:italic;font-weight:500;}
.covsub{margin-top:36px;font-family:'TikTok Sans',sans-serif;font-size:28px;
  line-height:1.5;color:#6E6858;max-width:740px;}
.dark .covsub{color:#8892A6;}
.follow{margin-top:40px;font-family:'Playfair',serif;font-style:italic;
  font-size:34px;color:#3A5697;}
.dark .follow{color:#6E86C9;}
"""

CSS = H.CSS.replace(".foot{margin-top:auto;", EXTRA + "\n.foot{margin-top:auto;")
RAIL = "judgments &nbsp;&middot;&nbsp; penalties &nbsp;&middot;&nbsp; appeals"


def page(n, total, dark, inner, cite, swipe=False, well="nwell"):
    sw = ('<div class="swipe">swipe &rarr;</div>' if swipe
          else '<div class="mark">LAWGISTICS</div>')
    html = (f'<!doctype html><html><head><meta charset="utf-8">'
            f'<style>{CSS}</style></head>\n'
            f'<body class="{"dark" if dark else "light"}"><div class="grain"></div>'
            f'<div class="page">\n'
            f'  <div class="head"><div class="kicker">RECENTLY IN COURT</div>'
            f'<div class="num">{n:02d} / {total:02d}</div></div>\n'
            f'  <div class="{well}">{inner}</div>\n'
            f'  <div class="foot"><div class="cite">{cite}</div>{sw}</div>\n'
            f'</div></body></html>')
    (OUT / f"today{n:02d}.html").write_text(html)
    return f"out/today{n:02d}.html"


def story(head, big, verdict, body, case):
    fill = (f'<div class="wbig">{big}</div><div class="wverdict">{verdict}</div>'
            if big else f'<div class="wonly">{verdict}</div>')
    return ('<div class="brand">Lawgistics</div>'
            f'<div class="nhead">{head}</div>'
            f'<div class="imgwell">{fill}</div>'
            f'<div class="nbody">{body}</div>'
            f'<div class="ncase">{case}</div>')


TOTAL, paths = 6, []

# 1. COVER
paths.append(page(1, TOTAL, False, well="covwell", swipe=True,
    cite="Four Australian decisions, August 2026. Not legal advice.",
    inner=(f'<div class="rail railtop">{RAIL}</div>'
           '<div class="covmid">'
           '<div class="covhead">Court had <em>a month.</em></div>'
           '<div class="covsub">A password that cost seven days. A dough mixer '
           'with a secret. And an ad you have definitely seen.</div>'
           '</div>'
           f'<div class="rail railbot">{RAIL}</div>')))

# 2. HARVEY NORMAN. Commercial leads.
paths.append(page(2, TOTAL, True,
    cite="ASIC v Latitude Finance Australia and Harvey Norman Holdings, Federal Court, 28 July 2026",
    inner=story(
        'That ad just cost Harvey Norman <em>$55 million</em>',
        "$55m", "in penalties",
        'Sixty months interest free, no deposit. All of it true. What it did '
        'not mention is that you had to take out a credit card, with an '
        'establishment fee and monthly account service fees. At least $537 in '
        'fees, on the interest free deal.',
        'ASIC v Latitude Finance and Harvey Norman')))

# 3. GUSS. The funny one.
paths.append(page(3, TOTAL, False,
    cite="Victorian Legal Services Board v Guss (Penalty) [2026] VSC 529, Finanzio J, 20 August 2026",
    inner=story(
        'A password cost him <em>seven days in jail.</em>',
        "7", "days to serve",
        'A former solicitor was ordered to give the regulator’s manager the '
        'password to the email account he ran his practice from. He refused, '
        'through two judges and a failed appeal. At the penalty hearing his own '
        'IT consultant said it would take ten minutes. He handed it over that '
        'afternoon. He is 88.',
        'Victorian Legal Services Board v Guss [2026] VSC 529')))

# 4. KO. The visual one.
paths.append(page(4, TOTAL, True,
    cite="The King v Ko [2026] HCA 29, High Court of Australia, 12 August 2026",
    inner=story(
        '101 packages of drugs. <em>Inside a dough mixer.</em>',
        "101", "packages, 1kg each",
        'Canada found them before it shipped, swapped in an inert substance '
        'and let the mixer sail to Sydney anyway. The conviction that followed '
        'has now been quashed, over one sentence a judge did not say to the '
        'jury. New trial ordered. Nothing decided against him.',
        'The King v Ko [2026] HCA 29')))

# 5. LEWIS. The juicy one.
paths.append(page(5, TOTAL, False,
    cite="Lewis v HWL Ebsworth Lawyers [2026] VSC 514, Ierodiaconou AsJ, 12 August 2026",
    inner=story(
        'A partner sued <em>his own law firm.</em>',
        None, "Strike out refused",
        'He was 66 and was told he would be left out of the firm’s '
        'proposed float. Months later the partners voted to expel him. He sued '
        'for age discrimination. The firm tried to have it thrown out before '
        'trial and failed. Nothing has been decided about whether any '
        'discrimination happened.',
        'Lewis v HWL Ebsworth Lawyers [2026] VSC 514')))

# 6. CLOSER
paths.append(page(6, TOTAL, True, well="covwell",
    cite=("Summaries only. Ko’s conviction is quashed and a retrial "
          "ordered. Lewis is an interlocutory ruling and no findings have been "
          "made. Read the judgments. Not legal advice."),
    inner=(f'<div class="rail railtop">{RAIL}</div>'
           '<div class="covmid">'
           '<div class="covhead">Court news, <em>in English.</em></div>'
           '<div class="follow">follow @lawgisticsaustralia</div>'
           '<div class="covsub">Lawgistics places Australian law students in '
           'legal internships in Kuala Lumpur.<br>Applications via the link in '
           'bio.</div>'
           '</div>'
           f'<div class="rail railbot">{RAIL}</div>')))

subprocess.run(["node", "shoot.mjs"] + paths, cwd=BASE, check=True)
print("done")
