#!/usr/bin/env python3
"""The snail and the underpants: Donoghue v Stevenson + Grant v Australian
Knitting Mills. House style, cream dominant, navy closer."""
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

.statement{font-family:'Playfair',serif;font-weight:600;}
.lg{margin-top:122px;font-size:72px;line-height:1.16;letter-spacing:-.005em;max-width:900px;}
.md{margin-top:104px;font-size:56px;line-height:1.22;max-width:900px;}
.statement em{font-style:italic;font-weight:500;}

.sub{margin-top:42px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:35px;line-height:1.45;color:#6E6858;max-width:820px;}
.dark .sub{color:#A3ACC0;}

.body{margin-top:42px;font-family:'TikTok Sans',sans-serif;font-size:32px;
  line-height:1.55;color:#4E4A3F;max-width:860px;}
.dark .body{color:#A9B0C2;}
.body p+p{margin-top:24px;}
.body b{font-weight:600;color:#171D2B;}
.dark .body b{color:#EDE7DC;}

.quote{margin-top:42px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:40px;line-height:1.4;color:#171D2B;max-width:860px;
  border-left:3px solid #3A5697;padding-left:34px;}
.dark .quote{color:#EDE7DC;border-left-color:#6E86C9;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;}
.cite{font-family:'TikTok Sans',sans-serif;font-size:19px;line-height:1.55;
  font-weight:500;color:#9A9384;max-width:680px;}
.dark .cite{color:#7C8598;}
.mark{font-family:'TikTok Sans',sans-serif;font-size:18px;font-weight:600;
  letter-spacing:.34em;color:#9A9384;white-space:nowrap;}
.dark .mark{color:#7C8598;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:26px;color:#8C8577;}
"""

D = "Donoghue v Stevenson [1932] AC 562 &middot; House of Lords"
G = "Grant v Australian Knitting Mills [1936] AC 85 &middot; Privy Council"

def slide(slug, kicker, inner, cite="", dark=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'dark' if dark else ''}"><div class="page">
  <div class="kicker">{kicker}</div>
  {inner}
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"{slug}.html").write_text(html)

slide("g1", "A Case Study",
  '<div class="statement lg">Modern negligence law was built on a snail and a pair of <em>underpants.</em></div>'
  '<div class="sub">Two cases, four years apart. You will meet both in first year.</div>',
  swipe=True)

slide("g2", "The Snail",
  '<div class="statement md">Paisley, August 1928.</div>'
  '<div class="body"><p>Mrs May Donoghue&rsquo;s friend bought her a ginger beer at the Wellmeadow Cafe. The bottle was <b>dark opaque glass.</b></p>'
  '<p>She drank about half. When the rest was poured out, the decomposed remains of a snail came with it.</p></div>',
  cite=D)

slide("g3", "The Problem",
  '<div class="statement md">She had no contract with <em>anyone.</em></div>'
  '<div class="body"><p>Her friend bought the drink, so she could not sue the cafe in contract.</p>'
  '<p>And the accepted rule was that a manufacturer owed nothing to a stranger. So she sued the manufacturer anyway.</p></div>',
  cite=D)

slide("g4", "The Neighbour Principle",
  '<div class="statement md">Lord Atkin, 1932.</div>'
  '<div class="quote">You must take reasonable care to avoid acts or omissions which you can reasonably foresee would be likely to injure your neighbour.</div>'
  '<div class="body"><p>Your neighbour: anyone so closely and directly affected that you ought to have them in mind. The House of Lords agreed, <b>by a bare majority.</b></p></div>',
  cite=D)

slide("g5", "The Twist",
  '<div class="statement md">Nobody ever proved there was a <em>snail.</em></div>'
  '<div class="body"><p>The Lords decided a preliminary question of law: <b>if</b> the facts were true, was there a claim?</p>'
  '<p>The trial never happened. Stevenson died, and his executors settled for a reported two hundred pounds. No witnesses. No evidence. Just the principle.</p></div>',
  cite=D)

slide("g6", "The Open Question",
  '<div class="statement md">How far did it go?</div>'
  '<div class="body"><p>Food and drink only? Sealed containers only? Or <b>anything a factory makes?</b></p>'
  '<p>Nobody knew. Then a doctor in Adelaide put on a new pair of underpants.</p></div>',
  cite=D)

slide("g7", "The Underpants",
  '<div class="statement md">Adelaide, June 1931.</div>'
  '<div class="body"><p>Dr Richard Grant bought woollen underwear. The maker had left <b>excess sulphite</b> in the fabric and never washed it out. Invisible.</p>'
  '<p>Itching by evening. Then dermatitis over his whole body, and <b>seventeen weeks in bed.</b></p></div>',
  cite=G)

slide("g8", "The Holding",
  '<div class="statement md">Any product. Any maker.</div>'
  '<div class="body"><p>The Privy Council applied <em>Donoghue</em> to goods reaching the consumer <b>in the form they left the manufacturer</b>, with no reasonable chance of inspection along the way.</p>'
  '<p>Grant never proved how the sulphite got there. He did not need to. <b>The defect itself was enough.</b></p></div>',
  cite=G)

slide("g9", "Why It Still Matters",
  '<div class="statement md">Every product you own is covered by <em>this.</em></div>'
  '<div class="body"><p>A manufacturer owes you a duty even though you never met, never contracted, and cannot explain what went wrong on the factory floor.</p>'
  '<p>It started with a snail nobody saw and a rash nobody expected.</p></div>',
  dark=True, cite="General information only, not legal advice.")

print("ok")
