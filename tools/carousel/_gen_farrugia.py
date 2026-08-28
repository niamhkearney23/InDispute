#!/usr/bin/env python3
"""Lewis v HWL Ebsworth Lawyers [2026] VSC 514.
Strike out / summary dismissal application refused. Age discrimination claim
may proceed. Navy dominant, cream closer. Built from the judgment text.

GUARDRAIL: this is an interlocutory ruling. Nothing has been decided about
whether discrimination occurred. Slide 6 says so explicitly and the caption
repeats it. Do not let any wording imply the firm has been found liable."""
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
.lg{font-size:88px;line-height:1.12;letter-spacing:-.012em;max-width:900px;}
.md{font-size:66px;line-height:1.2;letter-spacing:-.008em;max-width:900px;}
.statement em{font-style:italic;font-weight:500;}

.sub{margin-top:52px;font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:38px;line-height:1.44;color:#A3ACC0;max-width:830px;}
.light .sub{color:#6E6858;}

.body{margin-top:50px;font-family:'TikTok Sans',sans-serif;font-size:33px;
  line-height:1.62;color:#A9B0C2;max-width:860px;}
.light .body{color:#4E4A3F;}
.body p+p{margin-top:30px;}
.body b{font-weight:600;color:#EDE7DC;}
.light .body b{color:#171D2B;}

.learn{margin-top:44px;padding-left:30px;border-left:2px solid #6E86C9;
  font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:36px;line-height:1.42;color:#EDE7DC;max-width:830px;}
.light .learn{border-left-color:#3A5697;color:#171D2B;}

/* jargon annotation: term underlined, arrow pointing back up to it */
.term{border-bottom:2px solid #6E86C9;padding-bottom:2px;font-weight:600;color:#EDE7DC;}
.light .term{border-bottom-color:#3A5697;color:#171D2B;}
.gloss{margin-top:38px;margin-left:30px;display:flex;gap:16px;align-items:flex-start;max-width:800px;}
.gloss .arw{flex:none;margin-top:-4px;}
.glosstxt{font-family:'TikTok Sans',sans-serif;font-size:25px;line-height:1.5;color:#8892A6;}
.light .glosstxt{color:#6E6858;}
.glosstxt b{display:block;font-size:17px;font-weight:600;letter-spacing:.22em;
  text-transform:uppercase;color:#6E86C9;margin-bottom:9px;}
.light .glosstxt b{color:#3A5697;}


/* B: big number */
.bignum{font-family:'Playfair',serif;font-weight:600;font-size:290px;line-height:.86;
  letter-spacing:-.03em;}
.numlabel{margin-top:36px;font-family:'Playfair',serif;font-weight:600;font-size:58px;
  line-height:1.2;max-width:830px;}
.numlabel em{font-style:italic;font-weight:400;}
.numsub{margin-top:26px;font-family:'TikTok Sans',sans-serif;font-size:31px;
  line-height:1.6;color:#A9B0C2;max-width:800px;}
.light .numsub{color:#4E4A3F;}

/* C: pull quote */
.pqmark{font-family:'Playfair',serif;font-weight:600;font-size:120px;line-height:.6;
  color:#6E86C9;opacity:.55;margin-bottom:30px;}
.light .pqmark{color:#3A5697;opacity:.5;}
.pq{font-family:'Playfair',serif;font-style:italic;font-weight:400;
  font-size:58px;line-height:1.32;max-width:880px;}
.pqa{margin-top:48px;font-family:'TikTok Sans',sans-serif;font-size:25px;
  font-weight:500;line-height:1.5;color:#8892A6;}
.light .pqa{color:#8C8577;}

/* D: short line, top weighted, air underneath */
.airwell{flex:1;display:flex;flex-direction:column;justify-content:flex-start;padding-top:20px;}
.airline{font-family:'Playfair',serif;font-weight:600;font-size:74px;line-height:1.16;
  letter-spacing:-.008em;max-width:850px;}
.airline em{font-style:italic;font-weight:400;}
.airsub{margin-top:44px;font-family:'TikTok Sans',sans-serif;font-size:29px;
  line-height:1.6;color:#A9B0C2;max-width:770px;}
.light .airsub{color:#4E4A3F;}

/* transcript exchange */
.tx{margin-top:46px;max-width:860px;}
.tx div{font-family:'TikTok Sans',sans-serif;font-size:30px;line-height:1.55;
  color:#A9B0C2;padding-left:30px;border-left:2px solid rgba(110,134,201,.45);}
.light .tx div{color:#4E4A3F;border-left-color:rgba(58,86,151,.45);}
.tx div+div{margin-top:22px;}
.tx b{display:block;font-family:'TikTok Sans',sans-serif;font-size:16px;font-weight:600;
  letter-spacing:.22em;text-transform:uppercase;color:#6E86C9;margin-bottom:8px;}
.light .tx b{color:#3A5697;}

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
TOTAL = 6

def slide(n, kicker, inner, cite="", light=False, swipe=False):
    sw = '<div class="swipe">swipe &rarr;</div>' if swipe else '<div class="mark">LAWGISTICS</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'light' if light else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{kicker}</div><div class="num">{n:02d} / {TOTAL:02d}</div></div>
  <div class="well">{inner}</div>
  <div class="foot"><div class="cite">{cite}</div>{sw}</div>
</div></body></html>"""
    (OUT / f"{SLUG}{n:02d}.html").write_text(html)

SLUG = "farrugia"

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class=""><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">THE QUESTION</div><div class="num">01 / 06</div></div>
  <div class="well"><div class="pqmark">&ldquo;</div><div class="pq">Can counsel represent two offenders in sentencing where it is open to argue that either offender should receive a more substantial penalty than the other? &hellip; The simple answer is &ldquo;no&rdquo;.</div><div class="pqa">EDELMAN J, IN DISSENT<br>The majority of the High Court reached the opposite result.</div></div>
  <div class="foot"><div class="cite">Farrugia v The King [2026] HCA 28, Edelman J at [66]</div><div class="swipe">swipe &rarr;</div></div>
</div></body></html>"""
(OUT / "farrugia01.html").write_text(html)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class=""><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">THE FACTS</div><div class="num">02 / 06</div></div>
  <div class="well"><div class="statement md">One barrister. Two co-offenders. <em>One sentencing hearing.</em></div><div class="body"><p>Frank Farrugia and Deniz Kanmaz both pleaded guilty to conspiring to traffic a commercial quantity of drugs. The same Senior Counsel appeared for both of them in the District Court of New South Wales.</p><p>There is no rule against it.</p></div><div class="gloss"><svg class="arw" width="58" height="50" viewBox="0 0 58 50"><path d="M54 46 C 40 42, 20 36, 10 9" stroke="#6E86C9" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M9 5 L 19 11 M9 5 L 7 17" stroke="#6E86C9" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg><div class="glosstxt"><b>CO-OFFENDER</b>Someone charged over the same criminal enterprise. Courts sentence them against each other so the punishments make sense side by side. That comparison is called parity.</div></div></div>
  <div class="foot"><div class="cite">Farrugia v The King [2026] HCA 28, High Court of Australia, 12 August 2026</div><div class="mark">LAWGISTICS</div></div>
</div></body></html>"""
(OUT / "farrugia02.html").write_text(html)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="light"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">THE NUMBERS</div><div class="num">03 / 06</div></div>
  <div class="well"><div class="bignum">11</div><div class="numlabel">years for Farrugia. <em>Nine for Kanmaz.</em></div><div class="numsub">Non parole periods of seven and a half years and six and a half. The Crown had submitted in writing that it should be the other way around.</div></div>
  <div class="foot"><div class="cite">Farrugia v The King [2026] HCA 28, High Court of Australia, 12 August 2026</div><div class="mark">LAWGISTICS</div></div>
</div></body></html>"""
(OUT / "farrugia03.html").write_text(html)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class=""><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">THE EXCHANGE</div><div class="num">04 / 06</div></div>
  <div class="well"><div class="statement md">His own counsel said <em>the opposite.</em></div><div class="tx"><div><b>His Honour</b>You agree, though, that Mr Kanmaz is more culpable than Mr Farrugia, don&rsquo;t you?</div><div><b>Counsel</b>No, I say the opposite.</div></div><div class="body"><p>The Crown then conceded he was right.</p></div></div>
  <div class="foot"><div class="cite">Farrugia v The King [2026] HCA 28, High Court of Australia, 12 August 2026</div><div class="mark">LAWGISTICS</div></div>
</div></body></html>"""
(OUT / "farrugia04.html").write_text(html)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class=""><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">THE RULING</div><div class="num">05 / 06</div></div>
  <div class="well"><div class="statement md">Appeal <em>dismissed.</em></div><div class="body"><p>Farrugia put on no evidence of what he was advised or what he instructed, and kept <span class="term">legal professional privilege</span> over it. Without that, the Court held, no conflict was proved. He carried the onus and did not discharge it.</p></div><div class="gloss"><svg class="arw" width="58" height="50" viewBox="0 0 58 50"><path d="M54 46 C 40 42, 20 36, 10 9" stroke="#6E86C9" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M9 5 L 19 11 M9 5 L 7 17" stroke="#6E86C9" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg><div class="glosstxt"><b>LEGAL PROFESSIONAL PRIVILEGE</b>Your conversations with your lawyer stay confidential and no court can make you reveal them. Only you can give that up.</div></div><div class="learn">Learn this: the party alleging error carries the onus, so claiming privilege over the very evidence that would prove the error is a choice with a price.</div></div>
  <div class="foot"><div class="cite">Farrugia v The King [2026] HCA 28, High Court of Australia, 12 August 2026</div><div class="mark">LAWGISTICS</div></div>
</div></body></html>"""
(OUT / "farrugia05.html").write_text(html)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="light"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">WHY IT MATTERS</div><div class="num">06 / 06</div></div>
  <div class="airwell"><div class="airline">Had it been proved, it <em>would have mattered.</em></div><div class="airsub">The Court set the test: an irregularity vitiates a sentence if it could realistically have affected the sentencing judge&rsquo;s reasoning. This one would have. It just was not established on the evidence before the Court.</div></div>
  <div class="foot"><div class="cite">Farrugia v The King [2026] HCA 28. Appeal dismissed. Edelman J and Jagot J would have allowed it. Summary only, read the judgment. General information, not legal advice.</div><div class="mark">LAWGISTICS</div></div>
</div></body></html>"""
(OUT / "farrugia06.html").write_text(html)
print("built", TOTAL)
