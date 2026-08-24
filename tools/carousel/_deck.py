#!/usr/bin/env python3
"""Shared deck builder for the mixed-card-template case posts.

Card templates available (see reports/assets/templates/README.md):
  A  headline  .statement + .body           centred well
  B  number    .bignum + .numlabel + .numsub
  C  quote     .pqmark + .pq + .pqa
  D  air       .airline + .airsub           top weighted, empty below
  E  transcript .tx                         speaker labels in accent caps
  F  split     .split                       two states of mind, stacked, hairline
  G  ladder    .ladder                      numbered rungs, one marked skipped

Rule: never the same card twice in a row.
"""
import pathlib, subprocess, sys
import _case_head as H

BASE = pathlib.Path(__file__).parent
OUT = H.OUT

EXTRA = """
/* B: big number */
.bignum{font-family:'Playfair',serif;font-weight:600;font-size:290px;line-height:.86;
  letter-spacing:-.03em;}
.numlabel{margin-top:36px;font-family:'Playfair',serif;font-weight:600;font-size:58px;
  line-height:1.2;max-width:830px;}
.numlabel em{font-style:italic;font-weight:400;}
.numsub{margin-top:26px;font-family:'TikTok Sans',sans-serif;font-size:31px;
  line-height:1.6;color:#A9B0C2;max-width:800px;}
.light .numsub{color:#4E4A3F;}

/* C: pull quote */
.pqmark{font-family:'Playfair',serif;font-weight:600;font-size:120px;line-height:.6;
  color:#6E86C9;opacity:.55;margin-bottom:30px;}
.light .pqmark{color:#3A5697;opacity:.5;}
.pq{font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:58px;line-height:1.32;max-width:880px;}
.pqa{margin-top:48px;font-family:'TikTok Sans',sans-serif;font-size:25px;
  font-weight:500;line-height:1.5;color:#8892A6;}
.light .pqa{color:#8C8577;}

/* D: short line, top weighted, air underneath */
.airwell{flex:1;display:flex;flex-direction:column;justify-content:flex-start;padding-top:20px;}
.airline{font-family:'Playfair',serif;font-weight:600;font-size:74px;line-height:1.16;
  letter-spacing:-.008em;max-width:850px;}
.airline em{font-style:italic;font-weight:400;}
.airsub{margin-top:44px;font-family:'TikTok Sans',sans-serif;font-size:29px;
  line-height:1.6;color:#A9B0C2;max-width:770px;}
.light .airsub{color:#4E4A3F;}

/* E: transcript exchange */
.tx{margin-top:46px;max-width:860px;}
.tx div{font-family:'TikTok Sans',sans-serif;font-size:30px;line-height:1.55;
  color:#A9B0C2;padding-left:30px;border-left:2px solid rgba(110,134,201,.45);}
.light .tx div{color:#4E4A3F;border-left-color:rgba(58,86,151,.45);}
.tx div+div{margin-top:22px;}
.tx b{display:block;font-family:'TikTok Sans',sans-serif;font-size:16px;font-weight:600;
  letter-spacing:.22em;text-transform:uppercase;color:#6E86C9;margin-bottom:8px;}
.light .tx b{color:#3A5697;}

/* F: split, two states of mind stacked against hairlines */
.split{margin-top:52px;max-width:900px;}
.sprow{padding:38px 0;border-top:1px solid rgba(237,231,220,.18);}
.light .sprow{border-top-color:rgba(23,29,43,.16);}
.sprow:last-child{border-bottom:1px solid rgba(237,231,220,.18);}
.light .sprow:last-child{border-bottom-color:rgba(23,29,43,.16);}
.splab{font-family:'TikTok Sans',sans-serif;font-size:17px;font-weight:600;
  letter-spacing:.26em;text-transform:uppercase;color:#6E86C9;margin-bottom:16px;}
.light .splab{color:#3A5697;}
.sptxt{font-family:'Playfair',serif;font-weight:500;font-size:46px;line-height:1.26;}
.sptxt em{font-style:italic;font-weight:400;}
.spnote{margin-top:34px;font-family:'TikTok Sans',sans-serif;font-size:29px;
  line-height:1.58;color:#A9B0C2;max-width:820px;}
.light .spnote{color:#4E4A3F;}

/* G: ladder of rungs, one marked skipped */
.ladder{margin-top:48px;max-width:880px;}
.rung{display:flex;gap:30px;align-items:baseline;padding:27px 0;
  border-bottom:1px solid rgba(237,231,220,.14);}
.light .rung{border-bottom-color:rgba(23,29,43,.13);}
.rung:first-child{border-top:1px solid rgba(237,231,220,.14);}
.light .rung:first-child{border-top-color:rgba(23,29,43,.13);}
.rungn{flex:none;width:46px;font-family:'Playfair',serif;font-size:32px;
  font-weight:500;color:#6E86C9;}
.light .rungn{color:#3A5697;}
.rungt{font-family:'TikTok Sans',sans-serif;font-size:30px;line-height:1.45;color:#A9B0C2;}
.light .rungt{color:#4E4A3F;}
.rungt i{display:block;font-style:normal;font-size:16px;font-weight:600;
  letter-spacing:.24em;text-transform:uppercase;color:#C08A5E;margin-top:11px;}
.rung.on .rungt{color:#EDE7DC;font-weight:500;}
.light .rung.on .rungt{color:#171D2B;}
.laddernote{margin-top:40px;font-family:'TikTok Sans',sans-serif;font-size:29px;
  line-height:1.58;color:#A9B0C2;max-width:820px;}
.light .laddernote{color:#4E4A3F;}
"""

CSS = H.CSS.replace(".foot{margin-top:auto;", EXTRA + "\n.foot{margin-top:auto;")

_ARROW = ('<svg class="arw" width="58" height="50" viewBox="0 0 58 50">'
          '<path d="M54 46 C 40 42, 20 36, 10 9" stroke="COL" stroke-width="2.2" '
          'fill="none" stroke-linecap="round"/>'
          '<path d="M9 5 L 19 11 M9 5 L 7 17" stroke="COL" stroke-width="2.2" '
          'fill="none" stroke-linecap="round"/></svg>')


def gloss(term, defn, light=False):
    """Curved arrow pointing back up at an underlined .term, plus its definition."""
    arw = _ARROW.replace("COL", "#3A5697" if light else "#6E86C9")
    return f'<div class="gloss">{arw}<div class="glosstxt"><b>{term}</b>{defn}</div></div>'


def term(word):
    return f'<span class="term">{word}</span>'


def build(slug, slides, shoot=True):
    total = len(slides)
    paths = []
    for i, s in enumerate(slides, 1):
        sw = ('<div class="swipe">swipe &rarr;</div>' if s.get("swipe")
              else '<div class="mark">LAWGISTICS</div>')
        well = "airwell" if s.get("air") else "well"
        light = "light" if s.get("light") else ""
        html = (f'<!doctype html><html><head><meta charset="utf-8">'
                f'<style>{CSS}</style></head>\n'
                f'<body class="{light}"><div class="grain"></div><div class="page">\n'
                f'  <div class="head"><div class="kicker">{s["kicker"]}</div>'
                f'<div class="num">{i:02d} / {total:02d}</div></div>\n'
                f'  <div class="{well}">{s["inner"]}</div>\n'
                f'  <div class="foot"><div class="cite">{s["cite"]}</div>{sw}</div>\n'
                f'</div></body></html>')
        p = OUT / f"{slug}{i:02d}.html"
        p.write_text(html)
        paths.append(f"out/{slug}{i:02d}.html")
    print(f"built {total} slides for {slug}")
    if shoot:
        subprocess.run(["node", "shoot.mjs"] + paths, cwd=BASE, check=True)
