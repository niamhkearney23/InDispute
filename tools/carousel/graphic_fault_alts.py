#!/usr/bin/env python3
"""Three alternative templates for the fault elements graphic.

Same content, same sources (s 307.1(1) Criminal Code; fault elements as set
out in The King v Ko [2026] HCA 29 at [12] to [13]). Nothing here is new
material, only new layout.

  B  THE DESCENT   navy. Three blocks that narrow as the required state of
                   mind weakens. The shrinking is the point.
  C  THE STACK     three full bleed colour bands. Loudest, best thumbnail,
                   least text. The one that survives being seen small.
  D  THE CARD      editorial reference card. Hairlines, air, small precise
                   type. The most premium and the least scroll stopping.

Renders faultB.png, faultC.png, faultD.png.
"""
import pathlib, subprocess
import _case_head as H

OUT = H.OUT
BASE = pathlib.Path(__file__).parent

EXTRA = """
/* ---------- B, the descent ---------- */
.dwell{flex:1;display:flex;flex-direction:column;justify-content:center;}
.dtitle{font-family:'Playfair',serif;font-weight:600;font-size:56px;line-height:1.14;
  letter-spacing:-.01em;max-width:860px;}
.dtitle em{font-style:italic;font-weight:500;}
.dsub{margin-top:20px;font-family:'TikTok Sans',sans-serif;font-size:25px;
  line-height:1.55;color:#8892A6;max-width:760px;}
.step{margin-top:22px;padding:30px 34px;border-radius:3px;}
.step:first-of-type{margin-top:46px;}
.s1{width:100%;background:#EDE7DC;color:#141A28;}
.s2{width:80%;background:transparent;color:#EDE7DC;border:2px solid #6E86C9;}
.s3{width:60%;background:transparent;color:#7C8598;border:1px dashed #4A5468;}
.stitle{font-family:'Playfair',serif;font-weight:600;font-size:52px;
  line-height:1.1;letter-spacing:-.01em;}
.smeta{margin-top:14px;font-family:'TikTok Sans',sans-serif;font-size:22px;
  line-height:1.45;opacity:.72;}
.dfoot{margin-top:42px;font-family:'Playfair',serif;font-style:italic;
  font-size:31px;line-height:1.4;color:#EDE7DC;max-width:840px;
  padding-left:26px;border-left:2px solid #6E86C9;}

/* ---------- C, the stack ---------- */
.cwell{flex:1;display:flex;flex-direction:column;margin:0 -92px;}
.chead{padding:0 92px 30px;}
.ctitle{font-family:'Playfair',serif;font-weight:600;font-size:60px;line-height:1.1;
  letter-spacing:-.015em;color:#171D2B;}
.ctitle em{font-style:italic;font-weight:500;}
.cband{flex:1;padding:0 92px;display:flex;flex-direction:column;justify-content:center;}
.k1{background:#141A28;color:#EDE7DC;}
.k2{background:#3A5697;color:#EDE7DC;}
.k3{background:#DCD4C4;color:#171D2B;}
.csec{font-family:'TikTok Sans',sans-serif;font-size:17px;font-weight:600;
  letter-spacing:.24em;text-transform:uppercase;opacity:.62;margin-bottom:12px;}
.cfault{font-family:'Playfair',serif;font-weight:600;font-size:68px;line-height:1;
  letter-spacing:-.02em;}
.cel{margin-top:16px;font-family:'TikTok Sans',sans-serif;font-size:25px;
  line-height:1.4;opacity:.8;max-width:800px;}

/* ---------- D, the card ---------- */
.rwell{flex:1;display:flex;flex-direction:column;justify-content:center;}
.rtitle{font-family:'Playfair',serif;font-weight:600;font-size:50px;line-height:1.16;
  letter-spacing:-.008em;max-width:800px;}
.rtitle em{font-style:italic;font-weight:500;}
.rsub{margin-top:18px;font-family:'TikTok Sans',sans-serif;font-size:23px;
  line-height:1.55;color:#8C8577;max-width:720px;}
.rtab{margin-top:58px;width:100%;border-collapse:collapse;}
.rtab th{text-align:left;font-family:'TikTok Sans',sans-serif;font-size:15px;
  font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#A8A093;
  padding-bottom:16px;border-bottom:1px solid rgba(23,29,43,.22);}
.rtab td{vertical-align:top;padding:30px 0;border-bottom:1px solid rgba(23,29,43,.13);}
.rtab td:first-child{padding-right:44px;}
.rel{font-family:'Playfair',serif;font-weight:500;font-size:33px;line-height:1.24;
  color:#171D2B;}
.rref{margin-top:9px;font-family:'TikTok Sans',sans-serif;font-size:16px;
  font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#A8A093;}
.rf{font-family:'Playfair',serif;font-style:italic;font-weight:500;font-size:33px;
  line-height:1.24;color:#3A5697;white-space:nowrap;}
.rfn{margin-top:9px;font-family:'TikTok Sans',sans-serif;font-size:19px;
  line-height:1.4;color:#8C8577;}
.rkey{margin-top:46px;font-family:'TikTok Sans',sans-serif;font-size:23px;
  line-height:1.6;color:#4E4A3F;max-width:800px;}
.rkey b{font-weight:600;color:#171D2B;}
"""

CSS = H.CSS.replace(".foot{margin-top:auto;", EXTRA + "\n.foot{margin-top:auto;")

CITE = ("s 307.1(1) Criminal Code (Cth). Fault elements as set out in "
        "The King v Ko [2026] HCA 29 at [12] to [13]. Not legal advice.")


def page(slug, light, kicker, right, well_cls, inner, cite=CITE):
    html = (f'<!doctype html><html><head><meta charset="utf-8">'
            f'<style>{CSS}</style></head>\n'
            f'<body class="{"light" if light else ""}"><div class="grain"></div>'
            f'<div class="page">\n'
            f'  <div class="head"><div class="kicker">{kicker}</div>'
            f'<div class="num">{right}</div></div>\n'
            f'  <div class="{well_cls}">{inner}</div>\n'
            f'  <div class="foot"><div class="cite">{cite}</div>'
            f'<div class="mark">LAWGISTICS</div></div>\n'
            f'</div></body></html>')
    (OUT / f"{slug}.html").write_text(html)
    return f"out/{slug}.html"


# ---------------------------------------------------------------- B, descent
b = (
    '<div class="dtitle">One offence. <em>Three states of mind.</em></div>'
    '<div class="dsub">Importing a commercial quantity of a border controlled '
    'drug. Each element carries its own fault element, and they weaken as you '
    'go down.</div>'
    '<div class="step s1"><div class="stitle">Intention</div>'
    '<div class="smeta">s 307.1(1)(a) &nbsp;&middot;&nbsp; that he imports a '
    'substance. He meant to.</div></div>'
    '<div class="step s2"><div class="stitle">Recklessness</div>'
    '<div class="smeta">s 307.1(1)(b) &nbsp;&middot;&nbsp; that it is a border '
    'controlled drug. He saw the risk.</div></div>'
    '<div class="step s3"><div class="stitle">Absolute liability</div>'
    '<div class="smeta">s 307.1(1)(c) &nbsp;&middot;&nbsp; that the quantity is '
    'commercial. Nothing required.</div></div>'
    '<div class="dfoot">An offence does not have one fault element. Each '
    'physical element has its own.</div>'
)

# ------------------------------------------------------------------ C, stack
c = (
    '<div class="chead"><div class="ctitle">Three elements. '
    '<em>Three states of mind.</em></div></div>'
    '<div class="cband k1"><div class="csec">s 307.1(1)(a)</div>'
    '<div class="cfault">Intention</div>'
    '<div class="cel">That he imports a substance. He meant to.</div></div>'
    '<div class="cband k2"><div class="csec">s 307.1(1)(b)</div>'
    '<div class="cfault">Recklessness</div>'
    '<div class="cel">That it is a border controlled drug. He saw the risk and '
    'ran it.</div></div>'
    '<div class="cband k3"><div class="csec">s 307.1(1)(c)</div>'
    '<div class="cfault">Absolute liability</div>'
    '<div class="cel">That the quantity is commercial. No state of mind at '
    'all.</div></div>'
)

# ------------------------------------------------------------------- D, card
d = (
    '<div class="rtitle">Every element has <em>its own</em> fault '
    'element.</div>'
    '<div class="rsub">Importing a commercial quantity of a border controlled '
    'drug, s 307.1(1) of the Criminal Code.</div>'
    '<table class="rtab"><tr><th>The element</th><th>His state of mind</th></tr>'
    '<tr><td><div class="rel">He imports a substance.</div>'
    '<div class="rref">s 307.1(1)(a)</div></td>'
    '<td><div class="rf">Intention</div>'
    '<div class="rfn">He meant to import it.</div></td></tr>'
    '<tr><td><div class="rel">The substance is a border controlled drug.</div>'
    '<div class="rref">s 307.1(1)(b)</div></td>'
    '<td><div class="rf">Recklessness</div>'
    '<div class="rfn">He saw the risk and ran it.</div></td></tr>'
    '<tr><td><div class="rel">The quantity is a commercial quantity.</div>'
    '<div class="rref">s 307.1(1)(c)</div></td>'
    '<td><div class="rf">Nothing</div>'
    '<div class="rfn">Absolute liability.</div></td></tr></table>'
    '<div class="rkey">Never ask what the fault element is. Break the offence '
    'into its physical elements first, <b>then</b> ask what attaches to each '
    'one.</div>'
)

paths = [
    page("faultB", False, "CRIMINAL LAW", "SAVE THIS", "dwell", b),
    page("faultC", True, "CRIMINAL LAW", "SAVE THIS", "cwell", c),
    page("faultD", True, "CRIMINAL LAW", "REFERENCE", "rwell", d),
]
subprocess.run(["node", "shoot.mjs"] + paths, cwd=BASE, check=True)
print("done")
