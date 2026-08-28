#!/usr/bin/env python3
"""How to read a judgment without reading all of it. Study method post.

Student and study content outperforms case analysis roughly fifteen to one on
this grid, and this one is drawn from the actual research method used for the
daily briefs, including the submissions-versus-findings trap that caught a
draft of the Puleo post. Cream dominant, navy closer."""
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

.statement{font-family:'Playfair',serif;font-weight:600;}
.lg{font-size:74px;line-height:1.18;letter-spacing:-.008em;max-width:880px;}
.md{font-size:56px;line-height:1.26;letter-spacing:-.004em;max-width:880px;}
.statement em{font-style:italic;font-weight:500;}

.sub{margin-top:52px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:34px;line-height:1.5;color:#6E6858;max-width:800px;}
.dark .sub{color:#A3ACC0;}

.body{margin-top:52px;font-family:'TikTok Sans',sans-serif;font-size:30px;
  line-height:1.72;color:#4E4A3F;max-width:830px;}
.dark .body{color:#A9B0C2;}
.body p+p{margin-top:30px;}
.body b{font-weight:600;color:#171D2B;}
.dark .body b{color:#EDE7DC;}

.learn{margin-top:44px;padding-left:30px;border-left:2px solid #3A5697;
  font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:33px;line-height:1.46;color:#171D2B;max-width:800px;}
.dark .learn{border-left-color:#6E86C9;color:#EDE7DC;}

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

C = ""
TOTAL = 7

def slide(n, kicker, inner, cite="", dark=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'dark' if dark else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"r{n:02d}.html").write_text(html)

slide(1, "Study Method",
  '<div class="statement lg">You do not have to read the <em>whole</em> judgment.</div>'
  '<div class="sub">Five steps to get a case properly, in about ten minutes.</div>',
  swipe=True)

slide(2, "Step One",
  '<div class="statement md">Start at the <em>end.</em></div>'
  '<div class="body"><p>Go straight to the orders. What did the court actually do? Dismissed, allowed, set aside, sent back.</p>'
  '<p>Everything else in the judgment is the explanation for that one line.</p></div>')

slide(3, "Step Two",
  '<div class="statement md">Read the catchwords.</div>'
  '<div class="body"><p>The block at the top between the dashes. Area of law, the issue, the sections, the key cases.</p>'
  '<p>It is the judgment&rsquo;s own summary of itself, and almost nobody reads it.</p></div>')

slide(4, "Step Three",
  '<div class="statement md">Find the <em>questions.</em></div>'
  '<div class="body"><p>Judges usually name the issues in the first few paragraphs. Two or three questions decide the whole case.</p>'
  '<p>Write them down before you read anything else.</p></div>')

slide(5, "Step Four",
  '<div class="statement md">Read only what answers them.</div>'
  '<div class="body"><p>You can skip most of the middle. Use the section headings, find the ones that match your questions, and read those.</p></div>')

slide(6, "Step Five",
  '<div class="statement md">Know who is <em>talking.</em></div>'
  '<div class="body"><p>&ldquo;The Bank submits&rdquo; is not a finding. Neither is &ldquo;the plaintiff contends&rdquo;.</p>'
  '<p>Look for <b>I find. I am satisfied. I reject.</b> That is the judge. Everything else is argument.</p></div>'
  '<div class="learn">Learn this: quoting a submission as though it were the holding is the easiest way to get a case note wrong.</div>')

slide(7, "The Point",
  '<div class="statement md">Ten minutes gets you the case. An hour gets you the <em>detail.</em></div>'
  '<div class="body"><p>Do the ten minutes first. You will read the hour far better for it.</p></div>',
  dark=True, cite="General information only, not legal advice.")

print("ok")
