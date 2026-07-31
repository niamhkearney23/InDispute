#!/usr/bin/env python3
"""The Docket: daily carousel, cover + one slide per decision. Minimal style."""
import pathlib

BASE = pathlib.Path(__file__).parent
F = BASE / "node_modules" / "@fontsource"
OUT = BASE / "out"
OUT.mkdir(exist_ok=True)

def font(w):
    return f"@font-face{{font-family:'TikTok Sans';font-weight:{w};src:url('file://{F}/tiktok-sans/files/tiktok-sans-latin-{w}-normal.woff2') format('woff2');}}"

CSS = "\n".join(font(w) for w in (400,500,600,700)) + """
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;}
body{font-family:'TikTok Sans',sans-serif;background:#EDE7DC;color:#171D2B;}
body.dark{background:#171D2B;color:#EDE7DC;}
.page{position:absolute;inset:0;padding:84px;display:flex;flex-direction:column;}
.top{display:flex;justify-content:flex-end;}
.pg{font-size:23px;font-weight:500;color:#8C8577;}
.dark .pg{color:#8B93A8;}
.title{margin-top:160px;font-size:96px;font-weight:600;line-height:1.12;}
.cover-sub{margin-top:40px;font-size:38px;line-height:1.5;font-weight:400;color:#6E6858;max-width:820px;}
.date{margin-top:20px;font-size:26px;font-weight:500;color:#8C8577;letter-spacing:.06em;}
.case{margin-top:150px;font-size:58px;font-weight:600;line-height:1.22;max-width:900px;}
.case span{color:#3A5697;}
.hold{margin-top:40px;font-size:35px;font-weight:400;line-height:1.5;color:#4E4A3F;max-width:880px;}
.hold p+p{margin-top:26px;}
.why{margin-top:34px;font-size:35px;line-height:1.5;font-weight:400;color:#4E4A3F;max-width:880px;}
.why b{font-weight:600;color:#3A5697;}
.dark .why{color:#A9B0C2;}
.dark .why b{color:#6E86C9;}
.hold b{font-weight:600;color:#171D2B;}
.dark .hold{color:#A9B0C2;}
.dark .hold b{color:#EDE7DC;}
.u{border-bottom:4px solid #3A5697;padding-bottom:4px;box-decoration-break:clone;-webkit-box-decoration-break:clone;}
.bottom{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:60px;}
.cite{font-size:21px;line-height:1.55;font-weight:500;color:#8C8577;max-width:700px;}
.cite b{color:#4E4A3F;font-weight:600;}
.swipe{font-size:21px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#171D2B;white-space:nowrap;}
.note{font-size:18px;line-height:1.5;color:#8C8577;max-width:660px;margin-top:18px;}
"""

def write(slug, body):
    (OUT / f"{slug}.html").write_text(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>')

N = 6
write("docket-1", f"""<div class="page">
  <div class="top"><div class="pg">1 / {N}</div></div>
  <div class="title">The Day<br>in Court.</div>
  <div class="cover-sub">Every decision that moved in the courts, one slide each.</div>
  <div class="date">30.07.26</div>
  <div class="bottom"><div class="cite">Compiled from published listings and reports.</div><div class="swipe">Swipe &rarr;</div></div>
</div>""")

cases = [
 ("White Oak <span>v</span> Insurance Australia",
  '<p>Greensill fallout. The insurer demanded twelve messages and a draft term sheet created while the parties circled a settlement.</p><p>Held: chat about a &ldquo;general approach&rdquo;, with <b>no element of compromise</b>, is not a negotiation. No privilege.</p>',
  '<b>Why it matters:</b> a &ldquo;without prejudice&rdquo; label alone protects nothing. The negotiation has to be real.',
  '<b>[2026] FCA 769</b> &middot; Federal Court of Australia &middot; Thawley J'),
 ("Elvin <span>v</span> Fair Work Ombudsman",
  '<p>Massage therapists underpaid. An individual personally on the hook. Then the employer struck a deed of company arrangement with its creditors.</p><p>The Full Court allowed the appeal <b>in part</b> and aired a live question: is the FWO a creditor bound by a DOCA?</p>',
  '<b>Why it matters:</b> corporate rescue does not switch off workplace risk, especially personal liability.',
  '<b>[2026] FCAFC 92</b> &middot; Full Court of the Federal Court'),
 ("Smithbridge Guam <span>v</span> Swire Shipping",
  '<p>A cargo dispute was headed for arbitration. Smithbridge asked the Court to stop it, arguing the <b>Carriage of Goods by Sea Act</b> rendered the arbitration clause in the booking note ineffective.</p>',
  '<b>Why it matters:</b> Australian cargo law can trump arbitration agreements. Check s 11 before you draft.',
  '<b>[2026] FCA 884</b> &middot; Federal Court of Australia &middot; S Derrington J'),
 ("Marsden, re Empire Consortium (in&nbsp;liq)",
  '<p>The liquidator of the collapsed Empire Consortium group pursued <b>Nationwide Plant Hire</b> in the Federal Court.</p>',
  '<b>Why it matters:</b> liquidator recovery actions are running hot. Counterparties of failed groups are in the firing line.',
  '<b>[2026] FCA 911</b> &middot; Federal Court of Australia'),
]
for i,(c,h,w,m) in enumerate(cases, start=2):
    write(f"docket-{i}", f"""<div class="page">
  <div class="top"><div class="pg">{i} / {N}</div></div>
  <div class="case">{c}</div>
  <div class="hold">{h}</div>
  <div class="why">{w}</div>
  <div class="bottom"><div class="cite">{m}</div></div>
</div>""")

write(f"docket-{N}", f"""<body class="dark"><div class="page">
  <div class="top"><div class="pg">{N} / {N}</div></div>
  <div class="case">Grofski <span>v</span> Peabody Energy</div>
  <div class="hold"><p>A leave-to-appeal fight in an employment dispute with the coal miner&rsquo;s operator.</p><p>Most appeals die at the leave gate. Getting past it is half the battle.</p></div>
  <div class="why"><b>High Court watch:</b> winter recess. Next judgments expected from August.</div>
  <div class="bottom"><div><div class="cite"><b>[2026] FCA 921</b> &middot; Federal Court of Australia</div>
  <div class="note">General information only, not legal advice. Check details against the full judgments.</div></div></div>
</div></body>""")
print("ok")
