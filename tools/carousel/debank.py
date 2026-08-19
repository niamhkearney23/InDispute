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
  '<div class="statement lg">His business is lawful. The bank closed the accounts <em>anyway.</em></div>'
  '<div class="sub">Supreme Court of Victoria, judgment delivered 14 August 2026.</div>',
  swipe=True)

slide(2, "The Facts",
  '<div class="statement md">Gotham City, South Melbourne.</div>'
  '<div class="body"><p>Franco Puleo and his two companies have operated a lawful brothel there <b>since 2001.</b></p>'
  '<p>Bendigo and Adelaide Bank closed the business accounts and his personal accounts. The judgment calls it the <b>Exit Decision.</b></p></div>',
  cite=C)

slide(3, "The Claim",
  '<div class="statement md">Four causes of action, in one proceeding.</div>'
  '<div class="body"><p>Discrimination under the <b>Equal Opportunity Act.</b> Breach of the account terms. An unfair contract term under the <b>ASIC Act.</b> And a failure to act efficiently, honestly and fairly under <b>s 912A</b> of the Corporations Act.</p></div>',
  cite=C)

slide(4, "The Distinction",
  '<div class="statement md">The trade got him <em>screened.</em> It did not get him <em>closed.</em></div>'
  '<div class="body"><p>The Court accepted his attributes were a reason of substance for the enhanced due diligence being run on the accounts.</p>'
  '<p>It found they were <b>not</b> a reason of substance for the decision to close them.</p></div>'
  '<div class="learn">Learn this: causation is tested at the decision you are challenging, not at the step that led to it.</div>',
  cite=C)

slide(5, "The Ruling",
  '<div class="statement md">All four claims dismissed.</div>'
  '<div class="body"><p>The closure was made on money laundering risk: unusual transactions, a cash intensive business, and large cash withdrawals feeding private ATMs.</p>'
  '<p>Managing that risk was a <b>legitimate interest</b> the bank was entitled to protect.</p></div>'
  '<div class="learn">Learn this: a contractual power to act on a risk does not require proof the risk crystallised.</div>',
  cite=C)

slide(6, "Why It Matters",
  '<div class="statement md">Debanking is now a <em>litigated</em> subject.</div>'
  '<div class="body"><p>Equal opportunity, contract, unfair terms and financial services obligations, argued together over one bank decision.</p>'
  '<p>If you are studying any of the four, this is the case that shows you how they interact.</p></div>',
  dark=True, cite="Summary only. Read the judgment before relying on it. General information only, not legal advice.")

print("ok")
