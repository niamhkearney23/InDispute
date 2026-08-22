#!/usr/bin/env python3
"""How to summarise a case: the five line case note. Study method post.

Companion to the how-to-read-a-judgment carousel. Navy dominant to alternate
against it. Worked example uses Donoghue v Stevenson, already verified for the
negligence post, so nothing new needs checking."""
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

C = ""
TOTAL = 8

def slide(n, kicker, inner, cite="", light=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'light' if light else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"n{n:02d}.html").write_text(html)

slide(1, "Study Method",
  '<div class="statement lg">A case note is <em>five lines.</em></div>'
  '<div class="sub">Not five pages. Here is the shape of it.</div>',
  swipe=True)

slide(2, "Line One",
  '<div class="statement md">Name, court, year.</div>'
  '<div class="body"><p><b>Donoghue v Stevenson [1932] AC 562, House of Lords.</b></p>'
  '<p>Put it first, every time. Which court decided it tells you how much weight it carries before you read a word of the reasoning.</p></div>')

slide(3, "Line Two",
  '<div class="statement md">Only the facts that <em>mattered.</em></div>'
  '<div class="body"><p>Not the whole story. The two or three facts the outcome actually turned on.</p>'
  '<p>If you can remove a fact and the answer stays the same, it does not belong in the note.</p></div>')

slide(4, "Line Three",
  '<div class="statement md">The issue, written as a <em>question.</em></div>'
  '<div class="body"><p>Not &ldquo;this case is about duty of care&rdquo;. That is a topic, not an issue.</p>'
  '<p>A real issue ends in a question mark and can be answered yes or no.</p></div>')

slide(5, "Line Four",
  '<div class="statement md">The answer. One sentence.</div>'
  '<div class="body"><p>What the court held, and which way it went. Allowed, dismissed, set aside.</p>'
  '<p>If you cannot say it in one sentence, you have not finished reading.</p></div>')

slide(6, "Line Five",
  '<div class="statement md">The rule you can <em>use again.</em></div>'
  '<div class="body"><p>The part that decides the next case, not the part about this one.</p>'
  '<p>Everything else the judge said in passing is interesting, and it is not binding.</p></div>')

slide(7, "Worked Example",
  '<div class="statement md" style="font-size:44px;">Donoghue v Stevenson, in five lines.</div>'
  '<div class="body" style="font-size:27px;line-height:1.6;"><p><b>1.</b> Donoghue v Stevenson [1932] AC 562, House of Lords.</p>'
  '<p><b>2.</b> A woman drank ginger beer bought for her by a friend. The bottle was opaque. It contained a decomposed snail.</p>'
  '<p><b>3.</b> Does a manufacturer owe a duty to a consumer it has no contract with?</p>'
  '<p><b>4.</b> Yes.</p>'
  '<p><b>5.</b> You owe a duty to those so closely and directly affected that you ought to have them in contemplation.</p></div>',
  light=True)

slide(8, "The Point",
  '<div class="statement md">Five lines you understand beat five pages you <em>copied.</em></div>'
  '<div class="body"><p>Save this next to the one on how to read a judgment. Read it that way, write it up this way.</p></div>',
  cite="General information only, not legal advice.")

print("ok")
