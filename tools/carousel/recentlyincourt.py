#!/usr/bin/env python3
"""Recently in Court. Roundup of the High Court sitting of 5 August 2026.

Renamed from "The Day in Court." on 10 Aug 2026: the window is several days
back, so the older name overstated how current it was.

Confirmed only: holdings appear for the two matters whose outcomes are
verified. The other three appear by name and subject, with no holding stated.
"""
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
body{background:#EDE7DC;color:#171D2B;}
body.dark{background:#141A28;color:#EDE7DC;}
.grain{position:absolute;inset:0;background-image:""" + GRAIN + """;pointer-events:none;}
.dark .grain{opacity:.5;}

.page{position:absolute;inset:0;padding:98px 92px 88px;display:flex;flex-direction:column;}
.head{display:flex;justify-content:space-between;align-items:baseline;
  padding-bottom:26px;border-bottom:1px solid rgba(23,29,43,.14);}
.dark .head{border-bottom-color:rgba(237,231,220,.16);}
.kicker{font-family:'TikTok Sans',sans-serif;font-size:18px;font-weight:500;
  letter-spacing:.3em;text-transform:uppercase;color:#8C8577;}
.dark .kicker{color:#8892A6;}
.num{font-family:'Playfair',serif;font-size:26px;font-weight:400;letter-spacing:.06em;color:#A8A093;}
.dark .num{color:#6F7A90;}

.well{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:46px;}

/* cover */
.title{font-family:'Playfair',serif;font-weight:600;font-size:96px;line-height:1.04;
  letter-spacing:-.015em;}
.title em{font-style:italic;font-weight:400;}
.rule{width:112px;height:1px;background:rgba(23,29,43,.28);margin:56px 0 44px;}
.coversub{font-family:'TikTok Sans',sans-serif;font-size:29px;line-height:1.62;
  font-weight:400;color:#4E4A3F;max-width:760px;}

/* case slides */
.case{font-family:'Playfair',serif;font-weight:600;font-size:62px;line-height:1.2;
  letter-spacing:-.005em;max-width:880px;}
.case i{font-style:italic;font-weight:400;color:#3A5697;}
.dark .case i{color:#6E86C9;}
.holding{margin-top:46px;font-family:'TikTok Sans',sans-serif;font-size:32px;
  line-height:1.66;color:#4E4A3F;max-width:840px;}
.dark .holding{color:#A9B0C2;}
.holding b{font-weight:600;color:#171D2B;}
.dark .holding b{color:#EDE7DC;}

/* the learning line: what you actually take from the case */
.learn{margin-top:44px;padding-left:30px;border-left:2px solid #3A5697;
  font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:33px;line-height:1.46;color:#171D2B;max-width:800px;}
.dark .learn{border-left-color:#6E86C9;color:#EDE7DC;}

/* list slide */
.also{margin-top:8px;font-family:'TikTok Sans',sans-serif;font-size:29px;
  line-height:1.5;color:#4E4A3F;max-width:850px;}
.dark .also{color:#A9B0C2;}
.also div{padding:26px 0;border-bottom:1px solid rgba(23,29,43,.12);}
.dark .also div{border-bottom-color:rgba(237,231,220,.13);}
.also div:last-child{border-bottom:none;padding-bottom:0;}
.also b{font-weight:600;color:#171D2B;}
.dark .also b{color:#EDE7DC;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;
  padding-top:26px;border-top:1px solid rgba(23,29,43,.14);}
.dark .foot{border-top-color:rgba(237,231,220,.16);}
.cite{font-family:'TikTok Sans',sans-serif;font-size:18px;line-height:1.6;
  font-weight:500;color:#9A9384;max-width:690px;}
.dark .cite{color:#7C8598;}
.mark{font-family:'TikTok Sans',sans-serif;font-size:17px;font-weight:600;
  letter-spacing:.34em;color:#9A9384;white-space:nowrap;}
.dark .mark{color:#7C8598;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:25px;color:#8C8577;white-space:nowrap;}
"""

TOTAL = 5

def slide(n, kicker, inner, cite="", dark=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'dark' if dark else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"r{n:02d}.html").write_text(html)

slide(1, "Roundup",
  '<div class="title">Recently<br>in <em>Court.</em></div>'
  '<div class="rule"></div>'
  '<div class="coversub">The High Court delivered five judgments on Wednesday 5 August 2026. Two of them are worth your time.</div>',
  swipe=True)

slide(2, "No. 01",
  '<div class="case">Mpwerempwer Aboriginal Corporation <i>v</i> Minister</div>'
  '<div class="holding">A thirty year licence to take up to 40 gigalitres of groundwater a year was <b>set aside.</b> The native title holders were not given notice of the proposed conditions, or a chance to answer them.</div>'
  '<div class="learn">Learn this: procedural fairness is a condition of the power, not a courtesy added at the end.</div>',
  cite="[2026] HCA 23 &middot; 5 August 2026")

slide(3, "No. 02",
  '<div class="case">Potter (a pseudonym) <i>v</i> The King</div>'
  '<div class="holding">A complainant&rsquo;s covert recording of the accused was <b>lawful.</b> It was reasonably necessary to protect her bodily autonomy. Appeal dismissed, unanimous.</div>'
  '<div class="learn">Learn this: a secret recording is not automatically unlawful. Ask what lawful interest it protected.</div>',
  cite="[2026] HCA 25 &middot; 5 August 2026")

slide(4, "Also That Day",
  '<div class="case" style="font-size:54px;">Three more, in brief.</div>'
  '<div class="also">'
  '<div><b>The King v HCZ</b> [2026] HCA 24<br>Youth justice. Sentencing of a child for murder, and when release before 70 per cent of the term is available.</div>'
  '<div><b>Plaintiff M98/2025 v Minister</b> [2026] HCA 26<br>Migration. Protection visa, and whether a decision maker must address a claim not expressly made.</div>'
  '<div><b>Plaintiff S32/2026 v Minister</b> [2026] HCA 27<br>Migration.</div>'
  '</div>')

slide(5, "The Point",
  '<div class="case">Five judgments. <i>One sitting day.</i></div>'
  '<div class="holding">Two of them turned on whether the right person was heard at the right time. That is not a technicality. It is most of administrative law.</div>',
  dark=True, cite="Holdings above are summaries. Check the judgments before relying on them. General information only, not legal advice.")

print("ok")
