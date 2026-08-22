#!/usr/bin/env python3
"""Lewis v HWL Ebsworth Lawyers [2026] VSC 514.
Strike out / summary dismissal application refused. Age discrimination claim
may proceed. Navy dominant, cream closer. Built from the judgment text.

GUARDRAIL: this is an interlocutory ruling. Nothing has been decided about
whether discrimination occurred. Slide 6 says so explicitly and the caption
repeats it. Do not let any wording imply the firm has been found liable."""
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

.learn{margin-top:44px;padding-left:30px;border-left:2px solid #6E86C9;
  font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:33px;line-height:1.46;color:#EDE7DC;max-width:800px;}
.light .learn{border-left-color:#3A5697;color:#171D2B;}

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

C = "Lewis v HWL Ebsworth Lawyers [2026] VSC 514 &middot; Ierodiaconou AsJ &middot; 12 August 2026"
TOTAL = 6

def slide(n, kicker, inner, cite="", light=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'light' if light else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"L{n:02d}.html").write_text(html)

slide(1, "A Case Study",
  '<div class="statement lg">A partner sued his own firm for <em>age discrimination.</em></div>'
  '<div class="sub">The firm tried to stop the case before it could be heard.</div>',
  swipe=True)

slide(2, "What Happened",
  '<div class="statement md">He was 66. The firm left him out of the float.</div>'
  '<div class="body"><p>HWL Ebsworth was planning to list. In August 2020 the managing partner told Gregory Lewis he was excluded, citing contribution, performance and overdrawing. <b>Age was not mentioned.</b></p>'
  '<p>In November the partners voted to expel him. The float never went ahead.</p></div>',
  cite=C, light=True)

slide(3, "Round One",
  '<div class="statement md">He sued in New South Wales, and lost.</div>'
  '<div class="body"><p>That case was about the partnership deed and fiduciary duty. <b>Discrimination was never the claim.</b></p>'
  '<p>The Court of Appeal dismissed him with costs. The High Court refused special leave.</p></div>',
  cite=C)

slide(4, "Round Two",
  '<div class="statement md">So he started again, in <em>Victoria.</em></div>'
  '<div class="body"><p>This time as an age discrimination claim under the Equal Opportunity Act.</p>'
  '<p>The firm said that was an abuse of process. He had his chance, and he should have run it the first time.</p></div>',
  cite=C, light=True)

slide(5, "The Ruling",
  '<div class="statement md">The firm&rsquo;s application <em>failed.</em></div>'
  '<div class="body"><p>No estoppel. No abuse of process. The New South Wales courts had <b>no power</b> to hear a claim under a Victorian statute, so he could not have run it there.</p></div>'
  '<div class="learn">Learn this: you are not shut out of a claim the earlier court had no power to decide.</div>',
  cite=C)

slide(6, "Read This Twice",
  '<div class="statement md">Nothing has been decided about the <em>discrimination.</em></div>'
  '<div class="body"><p>This ruling only decided that the case can be heard. It has not found that anything unlawful happened.</p>'
  '<p>Finality against access to justice. That is your civil procedure course, in one ruling.</p></div>',
  light=True, cite="Summary only. Read the judgment before relying on it. General information only, not legal advice.")

print("ok")
