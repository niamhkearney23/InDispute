#!/usr/bin/env python3
"""Mpwerempwer Aboriginal Corporation RNTBC v Minister [2026] HCA 23.
Largest groundwater licence in NT history quashed for want of procedural
fairness. Navy dominant, cream closer."""
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
body.light{background:#EDE7DC;color:#171D2B;}
.grain{position:absolute;inset:0;background-image:""" + GRAIN + """;pointer-events:none;opacity:.5;}
.light .grain{opacity:1;}

.page{position:absolute;inset:0;padding:98px 92px 88px;display:flex;flex-direction:column;}
.head{display:flex;justify-content:space-between;align-items:baseline;
  padding-bottom:26px;border-bottom:1px solid rgba(237,231,220,.16);}
.light .head{border-bottom-color:rgba(23,29,43,.14);}
.kicker{font-family:'TikTok Sans',sans-serif;font-size:18px;font-weight:500;
  letter-spacing:.3em;text-transform:uppercase;color:#8892A6;}
.light .kicker{color:#8C8577;}
.num{font-family:'Playfair',serif;font-size:26px;font-weight:400;letter-spacing:.06em;color:#6F7A90;}
.light .num{color:#A8A093;}

.well{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:46px;}

.statement{font-family:'Playfair',serif;font-weight:600;}
.lg{font-size:74px;line-height:1.18;letter-spacing:-.008em;max-width:880px;}
.md{font-size:56px;line-height:1.26;letter-spacing:-.004em;max-width:880px;}
.statement em{font-style:italic;font-weight:500;}

.sub{margin-top:52px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:34px;line-height:1.5;color:#A3ACC0;max-width:800px;}
.light .sub{color:#6E6858;}

.body{margin-top:52px;font-family:'TikTok Sans',sans-serif;font-size:30px;
  line-height:1.72;color:#A9B0C2;max-width:830px;}
.light .body{color:#4E4A3F;}
.body p+p{margin-top:30px;}
.body b{font-weight:600;color:#EDE7DC;}
.light .body b{color:#171D2B;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;
  padding-top:26px;border-top:1px solid rgba(237,231,220,.16);}
.light .foot{border-top-color:rgba(23,29,43,.14);}
.cite{font-family:'TikTok Sans',sans-serif;font-size:18px;line-height:1.6;
  font-weight:500;color:#7C8598;max-width:690px;}
.light .cite{color:#9A9384;}
.mark{font-family:'TikTok Sans',sans-serif;font-size:17px;font-weight:600;
  letter-spacing:.34em;color:#7C8598;white-space:nowrap;}
.light .mark{color:#9A9384;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:25px;color:#8892A6;white-space:nowrap;}
.light .swipe{color:#8C8577;}
"""

C = "Mpwerempwer Aboriginal Corporation RNTBC v Minister [2026] HCA 23 &middot; 5 August 2026"
TOTAL = 6

def slide(n, kicker, inner, cite="", light=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'light' if light else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"w{n:02d}.html").write_text(html)

slide(1, "A Case Study",
  '<div class="statement lg">40 gigalitres a year. Thirty years. <em>Set aside.</em></div>'
  '<div class="sub">Not on the science. On what happened before the decision was made.</div>',
  swipe=True)

slide(2, "The Facts",
  '<div class="statement md">Singleton Station, in the desert north of Alice Springs.</div>'
  '<div class="body"><p>Fortune Agribusiness was licensed to take up to <b>40 gigalitres of groundwater a year</b>, for thirty years.</p>'
  '<p>Anything beyond ten years required the Minister to be satisfied of <b>special circumstances.</b></p></div>',
  cite=C)

slide(3, "The Problem",
  '<div class="statement md">The company got two days. The native title holders were told <em>afterwards.</em></div>'
  '<div class="body"><p>A new condition required an assessment of the impact on Aboriginal cultural values. Fortune was notified and given two days to respond.</p>'
  '<p>Mpwerempwer Aboriginal Corporation heard nothing until the licence had already issued.</p></div>',
  cite=C)

slide(4, "The Ruling",
  '<div class="statement md">Licence set aside. Back to the Minister.</div>'
  '<div class="body"><p>The Court held the Corporation should have been <b>heard first.</b></p>'
  '<p>The application returns to the Minister to be decided again according to law. Thirty years of extraction, undone by the step before the decision.</p></div>',
  cite=C)

slide(5, "The Principle",
  '<div class="statement md">Procedural fairness is not a <em>courtesy.</em></div>'
  '<div class="body"><p>If a decision will affect your rights or interests, you are entitled to know what is proposed and to answer it, before it is made.</p>'
  '<p>Get that wrong and the decision can fall, however sound it looked.</p></div>',
  cite=C)

slide(6, "Why It Matters",
  '<div class="statement md">This is your admin law exam, in <em>real life.</em></div>'
  '<div class="body"><p>Natural justice, mandatory considerations, jurisdictional error. The doctrine you get drilled on in second year just unwound a thirty year water licence.</p></div>',
  light=True, cite="General information only, not legal advice.")

print("ok")
