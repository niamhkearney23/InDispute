#!/usr/bin/env python3
"""Pinned post: Start Here. Evergreen explainer for @lawgisticsaustralia.

Deliberately carries no dates, no deadlines, no prices, so it never goes stale
sitting at the top of the grid. Navy dominant, so it sits against the cream
case posts in the checkerboard.
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
.num{font-family:'Playfair',serif;font-size:26px;font-weight:400;
  letter-spacing:.06em;color:#6F7A90;}
.light .num{color:#A8A093;}

.well{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:46px;}

.statement{font-family:'Playfair',serif;font-weight:600;}
.lg{font-size:72px;line-height:1.2;letter-spacing:-.006em;max-width:880px;}
.md{font-size:56px;line-height:1.26;letter-spacing:-.004em;max-width:880px;}
.statement em{font-style:italic;font-weight:500;}

.sub{margin-top:54px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:34px;line-height:1.5;color:#A3ACC0;max-width:800px;}
.light .sub{color:#6E6858;}

.body{margin-top:56px;font-family:'TikTok Sans',sans-serif;font-size:30px;
  line-height:1.72;color:#A9B0C2;max-width:840px;}
.light .body{color:#4E4A3F;}
.body p+p{margin-top:32px;}
.body b{font-weight:600;color:#EDE7DC;}
.light .body b{color:#171D2B;}

/* the three-line list on the what-you-do slide */
.list{margin-top:56px;font-family:'TikTok Sans',sans-serif;font-size:31px;
  line-height:1.5;color:#A9B0C2;max-width:840px;}
.light .list{color:#4E4A3F;}
.list div{padding:24px 0;border-bottom:1px solid rgba(237,231,220,.13);}
.light .list div{border-bottom-color:rgba(23,29,43,.12);}
.list div:first-child{padding-top:0;}
.list div:last-child{border-bottom:none;padding-bottom:0;}
.list b{font-weight:600;color:#EDE7DC;}
.light .list b{color:#171D2B;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;
  padding-top:26px;border-top:1px solid rgba(237,231,220,.16);}
.light .foot{border-top-color:rgba(23,29,43,.14);}
.cite{font-family:'TikTok Sans',sans-serif;font-size:18px;line-height:1.6;
  font-weight:500;color:#7C8598;max-width:680px;}
.light .cite{color:#9A9384;}
.mark{font-family:'TikTok Sans',sans-serif;font-size:17px;font-weight:600;
  letter-spacing:.34em;color:#7C8598;white-space:nowrap;}
.light .mark{color:#9A9384;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:25px;color:#8892A6;white-space:nowrap;}
.light .swipe{color:#8C8577;}
"""

TOTAL = 7

def slide(n, kicker, inner, cite="", light=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'light' if light else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"pin{n:02d}.html").write_text(html)

slide(1, "Start Here",
  '<div class="statement lg">Law school teaches you the law. It does not teach you <em>the room.</em></div>'
  '<div class="sub">Legal internships for Australian law students. Kuala Lumpur.</div>',
  swipe=True)

slide(2, "Who We Are",
  '<div class="statement md">Lawgistics places Australian law students in legal internships in <em>Malaysia.</em></div>'
  '<div class="body"><p>Not a study tour. Not a conference. You are placed with lawyers, in a working legal environment, for the length of the program.</p></div>',
  light=True)

slide(3, "What You Do",
  '<div class="statement md">Three things you cannot get from a textbook.</div>'
  '<div class="list">'
  '<div><b>Courtroom access.</b> You sit in on real proceedings, not moots.</div>'
  '<div><b>Practical experience.</b> Work alongside practising lawyers on live matters.</div>'
  '<div><b>Career insight.</b> Ask the questions your lecturers cannot answer.</div>'
  '</div>')

slide(4, "What You Get",
  '<div class="statement md">International legal exposure, years ahead of <em>your cohort.</em></div>'
  '<div class="body"><p>The profession gets more cross border every year. Getting that on your record early is the kind of thing that compounds.</p>'
  '<p>In interviews, in applications, and in what you are trusted with once you are hired.</p></div>',
  light=True)

slide(5, "Why It Matters",
  '<div class="statement md">Grad applications ask what you have <em>done.</em></div>'
  '<div class="body"><p>Everyone applying has a transcript. Very few have watched a matter run in a foreign jurisdiction and can say something intelligent about it.</p>'
  '<p>That is an interview answer nobody else in the room has.</p></div>')

slide(6, "Who It Is For",
  '<div class="statement md">Students who want to be <em>ahead</em> of where they are.</div>'
  '<div class="body"><p>Open from first year through to final year, and to recent graduates. No prior legal experience needed, and no connection in the profession required.</p></div>',
  light=True)

slide(7, "Apply",
  '<div class="statement md">Applications and dates are in the <em>link in bio.</em></div>'
  '<div class="body"><p>Questions about placements, eligibility or timing, send us a DM. We answer all of them.</p></div>',
  cite="@lawgisticsaustralia")

print("ok")
