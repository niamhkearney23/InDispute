#!/usr/bin/env python3
"""SINGLE GRAPHIC, not a carousel.

One offence, three physical elements, three different fault elements.
Section 307.1(1) of the Criminal Code (Cth), as set out in The King v Ko
[2026] HCA 29 at [12] and [13].

This is the thing students actually get wrong: they learn "the fault element"
as though an offence has one. It does not. Each physical element has its own,
and here they descend from intention to recklessness to nothing at all.

Every word is confirmed at [12] and [13] of Ko. Nothing is inferred.

Cream, 1080x1350, house style. Diagrammatic rather than typographic: three
bands, each pairing a physical element with its fault element, with the
strength of the required state of mind shown by the weight of the chip.
"""
import pathlib, subprocess
import _case_head as H

OUT = H.OUT
BASE = pathlib.Path(__file__).parent

EXTRA = """
.gwell{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:20px;}
.gtitle{font-family:'Playfair',serif;font-weight:600;font-size:58px;line-height:1.14;
  letter-spacing:-.01em;max-width:880px;}
.gtitle em{font-style:italic;font-weight:500;}
.gsub{margin-top:20px;font-family:'TikTok Sans',sans-serif;font-size:28px;
  line-height:1.55;color:#6E6858;max-width:800px;}

.band{margin-top:26px;display:flex;align-items:stretch;gap:0;}
.band:first-of-type{margin-top:40px;}
.bleft{flex:1;padding:20px 30px 20px 0;border-top:1px solid rgba(23,29,43,.16);}
.bsec{font-family:'TikTok Sans',sans-serif;font-size:17px;font-weight:600;
  letter-spacing:.2em;text-transform:uppercase;color:#A8A093;margin-bottom:12px;}
.btxt{font-family:'Playfair',serif;font-weight:500;font-size:40px;line-height:1.22;
  color:#171D2B;}
.bright{flex:none;width:330px;padding:20px 0 20px 30px;
  border-top:1px solid rgba(23,29,43,.16);border-left:1px solid rgba(23,29,43,.16);
  display:flex;flex-direction:column;justify-content:center;}
.chip{display:inline-block;font-family:'TikTok Sans',sans-serif;font-size:19px;
  font-weight:600;letter-spacing:.16em;text-transform:uppercase;
  padding:13px 20px;border-radius:2px;text-align:center;}
.c1{background:#171D2B;color:#EDE7DC;}
.c2{background:transparent;color:#3A5697;border:2px solid #3A5697;}
.c3{background:transparent;color:#A8A093;border:1px dashed #C3BCAD;}
.bnote{margin-top:11px;font-family:'TikTok Sans',sans-serif;font-size:20px;
  line-height:1.4;color:#8C8577;}

.rule{margin-top:0;border-top:1px solid rgba(23,29,43,.16);}
.gkey{margin-top:34px;padding-left:26px;border-left:2px solid #3A5697;
  font-family:'Playfair',serif;font-style:italic;font-weight:400;font-size:32px;
  line-height:1.4;color:#171D2B;max-width:840px;}
"""

CSS = H.CSS.replace(".foot{margin-top:auto;", EXTRA + "\n.foot{margin-top:auto;")


def band(sec, txt, chip, cls, note):
    return (f'<div class="band"><div class="bleft">'
            f'<div class="bsec">{sec}</div><div class="btxt">{txt}</div></div>'
            f'<div class="bright"><div><span class="chip {cls}">{chip}</span>'
            f'<div class="bnote">{note}</div></div></div></div>')


inner = (
    '<div class="gtitle">One offence. Three elements. '
    '<em>Three different states of mind.</em></div>'
    '<div class="gsub">Importing a commercial quantity of a border controlled '
    'drug, section 307.1(1) of the Criminal Code.</div>'
    + band("s 307.1(1)(a)", "The person imports a substance.",
           "Intention", "c1", "He meant to import it.")
    + band("s 307.1(1)(b)", "The substance is a border controlled drug.",
           "Recklessness", "c2", "He saw the risk and ran it.")
    + band("s 307.1(1)(c)", "The quantity is a commercial quantity.",
           "Absolute liability", "c3", "No state of mind required.")
    + '<div class="rule"></div>'
    + '<div class="gkey">An offence does not have one fault element. '
      'Each physical element has its own.</div>'
)

html = (f'<!doctype html><html><head><meta charset="utf-8">'
        f'<style>{CSS}</style></head>\n'
        f'<body class="light"><div class="grain"></div><div class="page">\n'
        f'  <div class="head"><div class="kicker">CRIMINAL LAW</div>'
        f'<div class="num">SAVE THIS</div></div>\n'
        f'  <div class="gwell">{inner}</div>\n'
        f'  <div class="foot"><div class="cite">Elements and fault elements as '
        f'set out in The King v Ko [2026] HCA 29 at [12] to [13]. '
        f'General information, not legal advice.</div>'
        f'<div class="mark">LAWGISTICS</div></div>\n'
        f'</div></body></html>')

(OUT / "faultelements.html").write_text(html)
subprocess.run(["node", "shoot.mjs", "out/faultelements.html"], cwd=BASE, check=True)
print("done")
