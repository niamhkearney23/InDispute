#!/usr/bin/env python3
"""Puleo v Bendigo and Adelaide Bank Ltd [2026] VSC 513.
Debanking of a lawful brothel operator. All four causes of action dismissed.
Cream dominant, navy closer. Built from the judgment text supplied by Niamh."""
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

C = "Puleo v Bendigo and Adelaide Bank Ltd [2026] VSC 513 &middot; Matthews J &middot; 14 August 2026"
TOTAL = 6

def slide(n, kicker, inner, cite="", dark=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'dark' if dark else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"d{n:02d}.html").write_text(html)

slide(1, "A Case Study",
  '<div class="statement lg">His business is legal. The bank closed his accounts <em>anyway.</em></div>'
  '<div class="sub">Supreme Court of Victoria, 14 August 2026.</div>',
  swipe=True)

slide(2, "What Happened",
  '<div class="statement md">A brothel in South Melbourne, running since 2001.</div>'
  '<div class="body"><p>It is a lawful business. Bendigo and Adelaide Bank closed the company accounts <b>and the owner&rsquo;s personal accounts.</b></p>'
  '<p>The judgment calls that the Exit Decision.</p></div>',
  cite=C)

slide(3, "The Claim",
  '<div class="statement md">He sued the bank <em>four</em> different ways.</div>'
  '<div class="body"><p>That closing the accounts was discrimination. That it broke the account terms. That the clause letting the bank close them was unfair. And that the bank failed to act <b>efficiently, honestly and fairly.</b></p></div>',
  cite=C)

slide(4, "The Distinction",
  '<div class="statement md">His industry is why the bank <em>checked</em> him. It is not why the bank <em>closed</em> him.</div>'
  '<div class="body"><p>The Court agreed his industry was a real reason the bank ran extra checks on the accounts.</p>'
  '<p>It found it was <b>not</b> a real reason for the decision to close them.</p></div>'
  '<div class="learn">Learn this: causation is tested at the decision you are challenging, not at the step before it.</div>',
  cite=C)

slide(5, "The Reason",
  '<div class="statement md">The accounts were closed over <em>cash.</em></div>'
  '<div class="body"><p>The Court found the bank acted on money laundering risk: unusual transactions, a cash heavy business, and big cash withdrawals used to fill private ATMs.</p></div>'
  '<div class="learn">Learn this: the bank did not have to prove money laundering happened. The risk of it was enough.</div>',
  cite=C)

slide(6, "The Result",
  '<div class="statement md">All four claims <em>failed.</em></div>'
  '<div class="body"><p>One decision, attacked four ways, and none of them landed.</p>'
  '<p>If you are studying discrimination, contract, unfair terms or financial services law, this is how they fit together.</p></div>',
  dark=True, cite="Summary only. Read the judgment before relying on it. General information only, not legal advice.")

print("ok")
