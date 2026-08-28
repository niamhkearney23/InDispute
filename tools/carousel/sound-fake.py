#!/usr/bin/env python3
"""5 more legal cases that sound fake. Sequel to the 427-view post.
House style: serif with italic emphasis, kicker, wordmark. Navy dominant."""
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
.cover{margin-top:150px;font-size:82px;line-height:1.12;letter-spacing:-.005em;max-width:900px;}
.hook{margin-top:104px;font-size:56px;line-height:1.22;max-width:900px;}
.statement em{font-style:italic;font-weight:500;}

.sub{margin-top:42px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:35px;line-height:1.45;color:#A3ACC0;max-width:820px;}
.light .sub{color:#6E6858;}

.body{margin-top:42px;font-family:'TikTok Sans',sans-serif;font-size:31px;
  line-height:1.55;color:#A9B0C2;max-width:860px;}
.light .body{color:#4E4A3F;}
.body p+p{margin-top:24px;}
.body b{font-weight:600;color:#EDE7DC;}
.light .body b{color:#171D2B;}

.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:50px;}
.cite{font-family:'TikTok Sans',sans-serif;font-size:19px;line-height:1.55;
  font-weight:500;color:#7C8598;max-width:680px;}
.light .cite{color:#9A9384;}
.mark{font-family:'TikTok Sans',sans-serif;font-size:18px;font-weight:600;
  letter-spacing:.34em;color:#7C8598;white-space:nowrap;}
.light .mark{color:#9A9384;}
.swipe{font-family:'Playfair',serif;font-style:italic;font-size:26px;color:#8892A6;}
.light .swipe{color:#8C8577;}
"""

def slide(slug, kicker, inner, cite="", light=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'light' if light else ''}"><div class="page">
  <div class="kicker">{kicker}</div>
  {inner}
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"{slug}.html").write_text(html)

slide("k1", "A Field Guide",
  '<div class="statement cover">5 <em>more</em> legal cases that sound fake.</div>'
  '<div class="sub">Every single one is real. Again.</div>',
  cite="", swipe=True)

slide("k2", "No. 01",
  '<div class="statement hook">A doctor sued over his <em>underpants</em> and changed negligence law forever.</div>'
  '<div class="body"><p>Adelaide, 1931. Dr Grant bought woollen underwear. The manufacturer had left <b>excess sulphite</b> in the fabric.</p>'
  '<p>Severe dermatitis. Seventeen weeks in bed. The Privy Council held the manufacturer liable, extending the snail-in-the-bottle principle <b>beyond food.</b></p></div>',
  cite="Grant v Australian Knitting Mills [1936] AC 85", light=True)

slide("k3", "No. 02",
  '<div class="statement hook">A brewery made a beer that only existed in <em>a cartoon.</em> It got sued.</div>'
  '<div class="body"><p>In 1995 South Australian Brewing put <b>Duff Beer</b> on the shelves. The name belonged to Homer Simpson.</p>'
  '<p>Twentieth Century Fox and Matt Groening sued. Justice Tamberlin found the brewers had exploited an association with the show. <b>Passing off made out.</b></p></div>',
  cite="Twentieth Century Fox v South Australian Brewing Co (1996), Federal Court")

slide("k4", "No. 03",
  '<div class="statement hook">Cadbury went to court to try to own <em>a colour.</em></div>'
  '<div class="body"><p>It argued Darrell Lea&rsquo;s purple packaging misled chocolate buyers.</p>'
  '<p>Justice Heerey: <b>Cadbury does not own the colour purple.</b> Cadbury appealed, won a retrial, and lost again.</p></div>',
  cite="Cadbury Schweppes v Darrell Lea Chocolate Shops (No 8) [2008] FCA 470", light=True)

slide("k5", "No. 04",
  '<div class="statement hook">Kraft lost the right to sell peanut butter in <em>its own jar.</em></div>'
  '<div class="body"><p>Kraft sold its Australian peanut butter business to Bega in 2017, then tried to re-enter using the same <b>yellow lid and yellow label.</b></p>'
  '<p>The Full Federal Court: unregistered trade dress travels with the goodwill. The jar is Bega&rsquo;s. The High Court refused leave.</p></div>',
  cite="Kraft Foods Group Brands LLC v Bega Cheese Ltd [2020] FCAFC 65")

slide("k6", "No. 05",
  '<div class="statement hook">An Australian company was told it <em>cannot</em> call ugg boots ugg boots.</div>'
  '<div class="body"><p>Deckers owns the UGG trade mark in the United States. Australian Leather argued the word is <b>generic in Australia</b>, so it should be generic there too.</p>'
  '<p>The US courts disagreed. Generic here does not mean generic there. <b>$450,000</b> in damages. The Supreme Court declined to hear it.</p></div>',
  cite="Deckers Outdoor Corp v Australian Leather Pty Ltd, US courts, 2018 to 2021", light=True)

slide("k7", "The Point",
  '<div class="statement hook">You will read at least three of these <em>at law school.</em></div>'
  '<div class="sub">The weird ones are usually the ones that changed something.</div>',
  cite="Citations in the caption. General information only, not legal advice.")

print("ok")
