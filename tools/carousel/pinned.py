#!/usr/bin/env python3
"""Pinned post: evergreen. Status led, not education led.

Framing rules applied here:
  - what is in it for them, stated as a gain, never as a shortage at home
  - no pedagogy. Nobody applies to an internship to "learn". They apply to be
    somewhere other people are not.
  - not desperate. Fewer words, no over-explaining, no pleading CTA.
  - carries no dates, prices or intake numbers, so it can stay pinned forever.

SLIDES 4 AND 6 ARE PLACEHOLDER TESTIMONIALS. The bracketed text is deliberate
so the deck cannot be posted before real quotes replace it.
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
.md{font-size:58px;line-height:1.24;letter-spacing:-.004em;max-width:880px;}
.statement em{font-style:italic;font-weight:500;}

.sub{margin-top:54px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:34px;line-height:1.5;color:#A3ACC0;max-width:800px;}
.light .sub{color:#6E6858;}

.body{margin-top:52px;font-family:'TikTok Sans',sans-serif;font-size:31px;
  line-height:1.7;color:#A9B0C2;max-width:830px;}
.light .body{color:#4E4A3F;}
.body p+p{margin-top:30px;}
.body b{font-weight:600;color:#EDE7DC;}
.light .body b{color:#171D2B;}

/* testimonial slides */
.quote{position:relative;margin-left:8px;font-family:'Playfair',serif;
  font-style:italic;font-weight:400;font-size:52px;line-height:1.36;
  color:#EDE7DC;max-width:850px;}
.light .quote{color:#171D2B;}
.quote::before{content:'\\201C';position:absolute;left:-52px;top:-22px;
  font-size:104px;line-height:1;color:#6E86C9;opacity:.55;}
.light .quote::before{color:#3A5697;opacity:.45;}
.attrib{margin-top:52px;margin-left:8px;font-family:'TikTok Sans',sans-serif;
  font-size:24px;font-weight:500;letter-spacing:.02em;line-height:1.5;color:#8892A6;}
.light .attrib{color:#8C8577;}

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

slide(1, "Kuala Lumpur",
  '<div class="statement lg">Your cohort is doing a moot. You are in a <em>real courtroom.</em></div>'
  '<div class="sub">Legal internships for Australian law students.</div>',
  swipe=True)

slide(2, "The Program",
  '<div class="statement md">Placed with practising lawyers, in a city that <em>runs on ambition.</em></div>'
  '<div class="body"><p>Not a study tour. Not a conference. You are in the room where the work happens, for the length of the placement.</p></div>',
  light=True)

slide(3, "The City",
  '<div class="statement md">Court in the morning. <em>Kuala Lumpur</em> the rest of the time.</div>'
  '<div class="body"><p>One of Asia&rsquo;s legal and financial hubs. Thirty degrees in February.</p>'
  '<p>And a cohort of people who also decided <b>not to wait.</b></p></div>')

# PLACEHOLDER. Replace with a real quote from a real intern before posting.
slide(4, "In Their Words",
  '<div class="quote">[Intern quote goes here. One or two sentences, in their own words, about something specific they saw or did.]</div>'
  '<div class="attrib">[First name], [year] Law, [University]<br>[Intake]</div>',
  light=True, cite="PLACEHOLDER, DO NOT POST")

slide(5, "The Return",
  '<div class="statement md">International exposure, years ahead of <em>your cohort.</em></div>'
  '<div class="body"><p>It shows up in interviews, in applications, and in what you get trusted with once you are hired.</p></div>')

# PLACEHOLDER. Replace with a real quote from a real intern before posting.
slide(6, "In Their Words",
  '<div class="quote">[Second intern quote. Ideally about the city or the people, so it does a different job from the first.]</div>'
  '<div class="attrib">[First name], [year] Law, [University]<br>[Intake]</div>',
  light=True, cite="PLACEHOLDER, DO NOT POST")

slide(7, "Applications",
  '<div class="statement md">Link in <em>bio.</em></div>',
  cite="@lawgisticsaustralia")

print("ok")
