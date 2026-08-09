#!/usr/bin/env python3
"""Three cover directions for the pinned post. Same design system, different job."""
import pathlib

BASE = pathlib.Path(__file__).parent
F = BASE / "node_modules" / "@fontsource"
OUT = BASE / "out"
OUT.mkdir(exist_ok=True)

def pf(w, style="normal"):
    it = "italic" if style == "italic" else "normal"
    return (f"@font-face{{font-family:'Playfair';font-weight:{w};font-style:{style};"
            f"src:url('file://{F}/playfair-display/files/playfair-display-latin-{w}-{it}.woff2') format('woff2');}}")

def ts(w):
    return (f"@font-face{{font-family:'TikTok Sans';font-weight:{w};"
            f"src:url('file://{F}/tiktok-sans/files/tiktok-sans-latin-{w}-normal.woff2') format('woff2');}}")

GRAIN = ("url(\"data:image/svg+xml;utf8,"
         "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>"
         "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/>"
         "<feColorMatrix type='saturate' values='0'/></filter>"
         "<rect width='180' height='180' filter='url(%23n)' opacity='0.035'/></svg>\")")

CSS = "\n".join([pf(w) for w in (400,500,600,700)] +
                [pf(w,"italic") for w in (400,500,600,700)] +
                [ts(w) for w in (400,500,600)]) + """
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;}
body{background:#141A28;color:#EDE7DC;}
.grain{position:absolute;inset:0;background-image:""" + GRAIN + """;pointer-events:none;opacity:.5;}
.page{position:absolute;inset:0;padding:98px 92px 88px;display:flex;flex-direction:column;}
.head{display:flex;justify-content:space-between;align-items:baseline;
  padding-bottom:26px;border-bottom:1px solid rgba(237,231,220,.16);}
.kicker{font-family:'TikTok Sans',sans-serif;font-size:18px;font-weight:500;
  letter-spacing:.3em;text-transform:uppercase;color:#8892A6;}
.num{font-family:'Playfair',serif;font-size:26px;font-weight:400;letter-spacing:.06em;color:#6F7A90;}
.well{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:46px;}
.statement{font-family:'Playfair',serif;font-weight:600;font-size:72px;line-height:1.2;
  letter-spacing:-.006em;max-width:880px;}
.statement em{font-style:italic;font-weight:500;}
.sub{margin-top:54px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:34px;line-height:1.5;color:#A3ACC0;max-width:800px;}

/* direction C, editorial destination cover */
.dest{font-family:'Playfair',serif;font-weight:600;font-size:132px;line-height:.98;
  letter-spacing:-.018em;}
.dest em{font-style:italic;font-weight:400;}
.rule{width:112px;height:1px;background:rgba(237,231,220,.32);margin:60px 0 46px;}
.destsub{font-family:'TikTok Sans',sans-serif;font-size:29px;line-height:1.6;
  font-weight:400;color:#A9B0C2;max-width:700px;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;
  padding-top:26px;border-top:1px solid rgba(237,231,220,.16);}
.cite{font-family:'TikTok Sans',sans-serif;font-size:18px;line-height:1.6;font-weight:500;color:#7C8598;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:25px;color:#8892A6;white-space:nowrap;}
"""

def cover(slug, kicker, inner):
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">01 / 07</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite"></div><div class="swipe">swipe &rarr;</div></div>
</div></body></html>"""
    (OUT / f"{slug}.html").write_text(html)

# A. States the offer. No cleverness, no comparison. Confidence by understatement.
cover("covA", "Lawgistics",
  '<div class="statement">Legal internships in <em>Kuala Lumpur.</em></div>'
  '<div class="sub">For Australian law students.</div>')

# B. Concrete image of the experience. Puts the reader in the room.
cover("covB", "Kuala Lumpur",
  '<div class="statement">Spend your summer inside a <em>working courtroom.</em></div>'
  '<div class="sub">Legal internships for Australian law students.</div>')

# C. Editorial destination cover. Makes no argument at all, the place does the work.
cover("covC", "Lawgistics",
  '<div class="dest">Kuala<br><em>Lumpur.</em></div>'
  '<div class="rule"></div>'
  '<div class="destsub">Legal internships for Australian law students.</div>')

print("ok")
