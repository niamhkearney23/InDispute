#!/usr/bin/env python3
"""Recently in Court: Supreme Court of Victoria, 19 to 21 August 2026.

Eight judgments supplied by Niamh from AustLII. Four get case slides, four go
in brief. Every outcome below is stated in the judgment itself."""
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

TOTAL = 7

def slide(n, kicker, inner, cite="", dark=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'dark' if dark else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"v{n:02d}.html").write_text(html)

slide(1, "Roundup",
  '<div class="title">Recently<br>in <em>Court.</em></div>'
  '<div class="rule"></div>'
  '<div class="coversub">Supreme Court of Victoria. Eight judgments handed down between 19 and 21 August 2026.</div>',
  swipe=True)

slide(2, "No. 01",
  '<div class="case">Victorian Legal Services Board <i>v</i> Guss</div>'
  '<div class="holding">A former solicitor refused to give the regulator&rsquo;s appointed manager the password to the email account he ran his practice from. He is <b>88.</b> He got 45 days, and will serve seven.</div>'
  '<div class="learn">Learn this: an appeal does not stay an order. Until it is set aside, you obey it.</div>',
  cite="[2026] VSC 529 &middot; Finanzio J &middot; 20 August 2026")

slide(3, "No. 02",
  '<div class="case">DPP <i>v</i> Bogojevska</div>'
  '<div class="holding">Manslaughter of an 85 year old neighbour. She then hid the body for a day, stole from the deceased, used her bank card, and dumped her by a river. <b>Eight years, six non-parole.</b></div>'
  '<div class="learn">Learn this: what an offender does after a death can aggravate the offence itself.</div>',
  cite="[2026] VSC 534 &middot; Forbes J &middot; 20 August 2026")

slide(4, "No. 03",
  '<div class="case">RM <i>v</i> DPP</div>'
  '<div class="holding">A seventeen year old was given ten months detention. On a fresh hearing that was <b>set aside.</b> Six month supervision order, no conviction, and a TAFE place starting next month.</div>'
  '<div class="learn">Learn this: for children, a court cannot reach for a heavier sentence if a lighter one will do.</div>',
  cite="[2026] VSC 544 &middot; Croucher J &middot; 21 August 2026")

slide(5, "No. 04",
  '<div class="case">Marriott <i>v</i> Grigorovitch</div>'
  '<div class="holding">A woman says she was assaulted at a political party branch meeting, and sued two fellow members for not protecting her. One claim was <b>thrown out.</b> The other survives.</div>'
  '<div class="learn">Learn this: belonging to the same club creates no duty of care by itself. You have to build one.</div>',
  cite="[2026] VSC 535 &middot; Goulden AsJ &middot; 21 August 2026")

slide(6, "Also That Week",
  '<div class="case" style="font-size:52px;">Four more, in brief.</div>'
  '<div class="also">'
  '<div><b>Re Cool Breeze Clothing (No 1)</b> [2026] VSC 530<br>Leave to file an expert report <i>during</i> the trial. Refused.</div>'
  '<div><b>Keycon Pty Ltd v Modi</b> [2026] VSC 533<br>A refused adjournment was not a denial of procedural fairness. Leave to appeal refused.</div>'
  '<div><b>Lam v Leung (Costs)</b> [2026] VSC 540<br>Costs split: each side paid for the part of the fight it lost.</div>'
  '<div><b>Doran v Astrazeneca</b> [2026] VSC 536<br>Class action writs kept alive for another twelve months.</div>'
  '</div>')

slide(7, "The Point",
  '<div class="case">Eight judgments. Half turned on <i>procedure.</i></div>'
  '<div class="holding">Late reports, refused adjournments, orders ignored. Cases are lost on process far more often than on the law.</div>',
  dark=True, cite="Summaries only. Read the judgments before relying on them. General information only, not legal advice.")

print("ok")
