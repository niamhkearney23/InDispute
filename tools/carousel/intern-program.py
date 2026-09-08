#!/usr/bin/env python3
"""Intern program carousel in the Lawgistics house style.
Serif with italic emphasis, letterspaced kicker, wordmark bottom right."""
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

CSS = "\n".join([pf(w) for w in (400,500,600,700)] +
                [pf(w,"italic") for w in (400,500,600,700)] +
                [ts(w) for w in (400,500,600)]) + """
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;}
body{background:#141A28;color:#EDE7DC;}
body.light{background:#EDE7DC;color:#171D2B;}
.page{position:absolute;inset:0;padding:88px 84px 76px;display:flex;flex-direction:column;}

.kicker{font-family:'TikTok Sans',sans-serif;font-size:19px;font-weight:500;
  letter-spacing:.28em;text-transform:uppercase;color:#8892A6;}
.light .kicker{color:#8C8577;}

.statement{font-family:'Playfair',serif;font-weight:600;}
.lg{margin-top:118px;font-size:76px;line-height:1.15;letter-spacing:-.005em;max-width:900px;}
.md{margin-top:108px;font-size:58px;line-height:1.2;max-width:900px;}
.statement em{font-style:italic;font-weight:500;}

.sub{margin-top:42px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:35px;line-height:1.45;color:#A3ACC0;max-width:820px;}
.light .sub{color:#6E6858;}

.list{margin-top:46px;font-family:'TikTok Sans',sans-serif;font-size:33px;
  line-height:1.5;font-weight:400;color:#A9B0C2;max-width:860px;list-style:none;}
.light .list{color:#4E4A3F;}
.list li{padding-left:44px;position:relative;margin-top:26px;}
.list li:first-child{margin-top:0;}
.list li::before{content:'';position:absolute;left:2px;top:20px;width:20px;height:1.5px;background:#6E86C9;}
.light .list li::before{background:#3A5697;}
.list b{font-weight:600;color:#EDE7DC;}
.light .list b{color:#171D2B;}

.body{margin-top:44px;font-family:'TikTok Sans',sans-serif;font-size:33px;
  line-height:1.55;color:#A9B0C2;max-width:860px;}
.light .body{color:#4E4A3F;}
.body p+p{margin-top:26px;}
.body b{font-weight:600;color:#EDE7DC;}
.light .body b{color:#171D2B;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;}
.note{font-family:'TikTok Sans',sans-serif;font-size:19px;line-height:1.55;
  font-weight:500;color:#7C8598;max-width:660px;}
.light .note{color:#9A9384;}
.mark{font-family:'TikTok Sans',sans-serif;font-size:18px;font-weight:600;
  letter-spacing:.34em;color:#7C8598;white-space:nowrap;}
.light .mark{color:#9A9384;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:26px;color:#8892A6;}
.light .swipe{color:#8C8577;}
"""

def slide(slug, kicker, inner, note="", light=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'light' if light else ''}"><div class="page">
  <div class="kicker">{kicker}</div>
  {inner}
  <div class="foot"><div class="note">{note}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"{slug}.html").write_text(html)

K = "The Intern Program &middot; Kuala Lumpur"

slide("i1", K,
  '<div class="statement lg">You will read <em>judgments.</em><br>Not photocopy them.</div>'
  '<div class="sub">Applications are open.</div>',
  note="Lawgistics internships for Australian law students", swipe=True)

slide("i2", "What you will actually do",
  '<div class="statement md">Real decisions. Real writing.</div>'
  '<ul class="list">'
  '<li>Sit in <b>real courtrooms</b> and watch matters run</li>'
  '<li>Read judgments and summarise them in <b>plain English</b></li>'
  '<li>Pitch which cases matter, and <b>defend the pitch</b></li>'
  '</ul>', light=True)

slide("i3", "What you will not do",
  '<div class="statement md">No coffee runs.</div>'
  '<ul class="list">'
  '<li>Not three months of <b>document review</b></li>'
  '<li>Not sitting silently at the back of meetings</li>'
  '<li>Not photocopying, which we have already mentioned, because it matters</li>'
  '</ul>')

slide("i4", "Where",
  '<div class="statement md">Kuala Lumpur.</div>'
  '<div class="body"><p>Courtroom access, practical experience and career insight, in a legal system close enough to ours to make sense and different enough to <b>teach you something.</b></p></div>', light=True)

slide("i5", "Who it suits",
  '<div class="statement md">The one who explains it to <em>everyone else</em> the night before the exam.</div>'
  '<div class="body"><p>If you are already the person who makes the case make sense, this is the program.</p></div>')

slide("i6", "Applications open",
  '<div class="statement lg">Come and be <em>useful.</em></div>'
  '<div class="sub">Details and application link in bio.</div>',
  note="lawgistics.com.au", light=True)

print("ok")
