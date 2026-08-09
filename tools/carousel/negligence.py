#!/usr/bin/env python3
"""The snail and the underpants: Donoghue v Stevenson + Grant v Australian
Knitting Mills.

Design notes, v2:
  - content optically centred in a well, not jammed to the top
  - numbered 01 to 09 in the masthead, so sequence is legible on the slide itself
  - hairline rule under the masthead gives structure without decoration
  - very fine paper grain on the cream, so it reads printed rather than screen
  - hanging quotation mark on the pull quote
  - generous leading, 1.68 on body copy
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

# fine paper grain, kept below the threshold of conscious notice
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

/* masthead: kicker left, numeral right, hairline under */
.head{display:flex;justify-content:space-between;align-items:baseline;
  padding-bottom:26px;border-bottom:1px solid rgba(23,29,43,.14);}
.dark .head{border-bottom-color:rgba(237,231,220,.16);}
.kicker{font-family:'TikTok Sans',sans-serif;font-size:18px;font-weight:500;
  letter-spacing:.3em;text-transform:uppercase;color:#8C8577;}
.dark .kicker{color:#8892A6;}
.num{font-family:'Playfair',serif;font-size:26px;font-weight:400;
  letter-spacing:.06em;color:#A8A093;}
.dark .num{color:#6F7A90;}

.well{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:46px;}

.statement{font-family:'Playfair',serif;font-weight:600;}
.lg{font-size:70px;line-height:1.22;letter-spacing:-.006em;max-width:880px;}
.md{font-size:54px;line-height:1.28;letter-spacing:-.004em;max-width:880px;}
.statement em{font-style:italic;font-weight:500;}

.sub{margin-top:54px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:34px;line-height:1.5;color:#6E6858;max-width:800px;}
.dark .sub{color:#A3ACC0;}

.body{margin-top:58px;font-family:'TikTok Sans',sans-serif;font-size:30px;
  line-height:1.72;color:#4E4A3F;max-width:840px;}
.dark .body{color:#A9B0C2;}
.body p+p{margin-top:32px;}
.body b{font-weight:600;color:#171D2B;}
.dark .body b{color:#EDE7DC;}

/* pull quote with a hanging open mark */
.quote{position:relative;margin-top:56px;margin-left:6px;
  font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:39px;line-height:1.48;color:#171D2B;max-width:840px;}
.dark .quote{color:#EDE7DC;}
.quote::before{content:'\\201C';position:absolute;left:-46px;top:-16px;
  font-size:86px;line-height:1;color:#3A5697;opacity:.5;}
.dark .quote::before{color:#6E86C9;opacity:.6;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;
  padding-top:26px;border-top:1px solid rgba(23,29,43,.14);}
.dark .foot{border-top-color:rgba(237,231,220,.16);}
.cite{font-family:'TikTok Sans',sans-serif;font-size:18px;line-height:1.6;
  font-weight:500;color:#9A9384;max-width:680px;}
.dark .cite{color:#7C8598;}
.mark{font-family:'TikTok Sans',sans-serif;font-size:17px;font-weight:600;
  letter-spacing:.34em;color:#9A9384;white-space:nowrap;}
.dark .mark{color:#7C8598;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:25px;color:#8C8577;white-space:nowrap;}
"""

D = "Donoghue v Stevenson [1932] AC 562 &middot; House of Lords"
G = "Grant v Australian Knitting Mills [1936] AC 85 &middot; Privy Council"

TOTAL = 9

def slide(n, kicker, inner, cite="", dark=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'dark' if dark else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"g{n:02d}.html").write_text(html)

slide(1, "A Case Study",
  '<div class="statement lg">Modern negligence law was built on a snail and a pair of <em>underpants.</em></div>'
  '<div class="sub">Two cases, four years apart. You will meet both in first year.</div>',
  swipe=True)

slide(2, "The Snail",
  '<div class="statement md">Paisley, August 1928.</div>'
  '<div class="body"><p>Mrs May Donoghue&rsquo;s friend bought her a ginger beer at the Wellmeadow Cafe. The bottle was <b>dark opaque glass.</b></p>'
  '<p>She drank about half. When the rest was poured out, the decomposed remains of a snail came with it.</p></div>',
  cite=D)

slide(3, "The Problem",
  '<div class="statement md">She had no contract with <em>anyone.</em></div>'
  '<div class="body"><p>Her friend bought the drink, so she could not sue the cafe in contract.</p>'
  '<p>And the rule of the day was that a manufacturer owed nothing to a stranger.</p></div>',
  cite=D)

slide(4, "The Neighbour Principle",
  '<div class="statement md">Lord Atkin, 1932.</div>'
  '<div class="quote">You must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure your neighbour.</div>'
  '<div class="body"><p>Your neighbour being anyone so closely and directly affected that you ought to have them in mind.</p></div>',
  cite=D)

slide(5, "The Twist",
  '<div class="statement md">Nobody ever proved there was a <em>snail.</em></div>'
  '<div class="body"><p>The Lords answered a preliminary question of law. <b>If</b> the facts were true, was there a claim?</p>'
  '<p>The trial never happened. Stevenson died, his executors settled for a reported two hundred pounds, and the facts were never tried.</p></div>',
  cite=D)

slide(6, "The Open Question",
  '<div class="statement md">How far did it go?</div>'
  '<div class="body"><p>Food and drink only? Sealed containers only? Or <b>anything a factory makes?</b></p>'
  '<p>Then a doctor in Adelaide put on a new pair of underpants.</p></div>',
  cite=D)

slide(7, "The Underpants",
  '<div class="statement md">Adelaide, June 1931.</div>'
  '<div class="body"><p>Dr Richard Grant bought woollen underwear. The maker had left <b>excess sulphite</b> in the fabric and never washed it out.</p>'
  '<p>Itching by evening. Then dermatitis across his whole body, and <b>seventeen weeks in bed.</b></p></div>',
  cite=G)

slide(8, "The Holding",
  '<div class="statement md">Any product. Any maker.</div>'
  '<div class="body"><p>The principle reaches goods that arrive <b>in the form they left the manufacturer</b>, with no reasonable chance of inspection along the way.</p>'
  '<p>Grant never proved how the sulphite got there. <b>The defect itself was enough.</b></p></div>',
  cite=G)

slide(9, "Why It Still Matters",
  '<div class="statement md">Every product you own is covered by <em>this.</em></div>'
  '<div class="body"><p>A duty owed by someone you never met, never contracted with, and cannot cross-examine about the factory floor.</p>'
  '<p>It began with a snail nobody saw.</p></div>',
  dark=True, cite="General information only, not legal advice.")

print("ok")
