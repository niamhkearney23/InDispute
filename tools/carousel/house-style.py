#!/usr/bin/env python3
"""Potter carousel rebuilt in Niamh's OWN house style, matching her existing grid:
serif display with italic emphasis, small-caps letterspaced kicker, LAWGISTICS
wordmark bottom right, cream/navy."""
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
body{background:#EDE7DC;color:#171D2B;}
body.dark{background:#141A28;color:#EDE7DC;}
.page{position:absolute;inset:0;padding:88px 84px 76px;display:flex;flex-direction:column;}

.kicker{font-family:'TikTok Sans',sans-serif;font-size:19px;font-weight:500;
  letter-spacing:.28em;text-transform:uppercase;color:#8C8577;}
.dark .kicker{color:#8892A6;}

.statement{font-family:'Playfair',serif;font-weight:600;color:inherit;}
.lg{margin-top:120px;font-size:78px;line-height:1.14;letter-spacing:-.005em;max-width:900px;}
.md{margin-top:110px;font-size:60px;line-height:1.2;max-width:900px;}
.statement em{font-style:italic;font-weight:500;}
.statement p+p{margin-top:38px;}

.sub{margin-top:44px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:36px;line-height:1.45;color:#6E6858;max-width:820px;}
.dark .sub{color:#A3ACC0;}

.body{margin-top:44px;font-family:'TikTok Sans',sans-serif;font-size:33px;
  line-height:1.55;font-weight:400;color:#4E4A3F;max-width:860px;}
.dark .body{color:#A9B0C2;}
.body p+p{margin-top:26px;}
.body b{font-weight:600;color:#171D2B;}
.dark .body b{color:#EDE7DC;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;}
.cite{font-family:'TikTok Sans',sans-serif;font-size:19px;line-height:1.55;
  font-weight:500;color:#9A9384;max-width:680px;}
.cite b{color:#5E5A4F;font-weight:600;}
.dark .cite{color:#7C8598;}
.dark .cite b{color:#C4CBDA;}
.mark{font-family:'TikTok Sans',sans-serif;font-size:18px;font-weight:600;
  letter-spacing:.34em;color:#9A9384;white-space:nowrap;}
.dark .mark{color:#7C8598;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:26px;color:#8C8577;}
.dark .swipe{color:#8892A6;}
"""

CITE = '<b>Potter (a pseudonym) v The King</b> [2026] HCA 25<br>High Court of Australia &middot; 5 August 2026 &middot; unanimous'

def slide(slug, kicker, inner, cite=CITE, dark=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'dark' if dark else ''}"><div class="page">
  <div class="kicker">{kicker}</div>
  {inner}
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"{slug}.html").write_text(html)

slide("h1", "The High Court &middot; 5 August",
  '<div class="statement lg">She recorded him admitting it.<br>The High Court says she <em>broke no law.</em></div>'
  '<div class="sub">One of the most significant evidence rulings in years.</div>', swipe=True)

slide("h2", "The Facts",
  '<div class="statement md">A phone on the bench.</div>'
  '<div class="body"><p>In South Australia, a man was convicted of raping his wife twice while she slept. He is serving nine and a half years.</p>'
  '<p>A month before the last of those offences, she recorded herself confronting him. <b>He admitted it.</b></p></div>')

slide("h3", "The Issue",
  '<div class="statement md">Recording is <em>generally</em> unlawful.</div>'
  '<div class="body"><p>Surveillance devices laws prohibit recording a private conversation without consent.</p>'
  '<p>Unless it is <b>reasonably necessary to protect the lawful interests</b> of the person making it.</p></div>')

slide("h4", "The Reasoning",
  '<div class="statement md">She made it to convince herself <em>never to go back.</em></div>'
  '<div class="body"><p>The Court, unanimous: replaying it reminded her to avoid <b>the real risk of being raped.</b></p>'
  '<p>That is a lawful interest.</p></div>')

slide("h5", "The Words",
  '<div class="statement lg">&ldquo;An interest deserving of the <em>very strongest protection.</em>&rdquo;</div>'
  '<div class="sub">Appeal dismissed. The convictions stand.</div>')

slide("h6", "Why It Matters",
  '<div class="statement md">Lawful interests reach <em>beyond litigation.</em></div>'
  '<div class="body"><p>For family and criminal practice, this changes the advice on a question clients ask constantly.</p>'
  '<p>Covert recordings by victims may be both lawful and admissible.</p></div>',
  dark=True)

print("ok")
