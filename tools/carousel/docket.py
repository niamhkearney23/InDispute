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
.title{margin-top:190px;font-size:96px;font-weight:600;}
.cover-sub{margin-top:40px;font-size:38px;line-height:1.5;font-weight:400;color:#6E6858;max-width:820px;}
.date{margin-top:20px;font-size:26px;font-weight:500;color:#8C8577;letter-spacing:.06em;}
.case{margin-top:190px;font-size:58px;font-weight:600;line-height:1.22;max-width:900px;}
.case span{color:#3A5697;}
.hold{margin-top:44px;font-size:42px;font-weight:400;line-height:1.45;color:#4E4A3F;max-width:880px;}
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
  <div class="title">The Docket.</div>
  <div class="cover-sub">Every decision that moved in the courts this week, one slide each.</div>
  <div class="date">30.07.26</div>
  <div class="bottom"><div class="cite">Compiled from published listings and reports.</div><div class="swipe">Swipe &rarr;</div></div>
</div>""")

cases = [
 ("White Oak <span>v</span> Insurance Australia",
  'A &ldquo;without prejudice&rdquo; label alone <b>doesn&rsquo;t create privilege</b>. Genuine negotiation does.',
  '<b>[2026] FCA 769</b> &middot; Federal Court of Australia &middot; Thawley J'),
 ("Elvin <span>v</span> Fair Work Ombudsman",
  'Underpayment appeal <b>allowed in part</b>. Is the FWO a creditor bound by a DOCA? Now a live question.',
  '<b>[2026] FCAFC 92</b> &middot; Full Court of the Federal Court'),
 ("Smithbridge Guam <span>v</span> Swire Shipping",
  '<b>Anti-suit injunction</b> granted in a carriage-of-goods dispute.',
  '<b>[2026] FCA 884</b> &middot; Federal Court of Australia &middot; admiralty'),
 ("Marsden, re Empire Consortium (in&nbsp;liq)",
  'Insolvency: <b>liquidator proceedings</b> against Nationwide Plant Hire.',
  '<b>[2026] FCA 911</b> &middot; Federal Court of Australia'),
]
for i,(c,h,m) in enumerate(cases, start=2):
    write(f"docket-{i}", f"""<div class="page">
  <div class="top"><div class="pg">{i} / {N}</div></div>
  <div class="case">{c}</div>
  <div class="hold">{h}</div>
  <div class="bottom"><div class="cite">{m}</div></div>
</div>""")

write(f"docket-{N}", f"""<body class="dark"><div class="page">
  <div class="top"><div class="pg">{N} / {N}</div></div>
  <div class="case">Grofski <span>v</span> Peabody Energy</div>
  <div class="hold">Leave to appeal <b>refused</b> in an employment dispute.<br><br>And the High Court? Winter recess. Next judgments expected from August.</div>
  <div class="bottom"><div><div class="cite"><b>[2026] FCA 921</b> &middot; Federal Court of Australia</div>
  <div class="note">General information only, not legal advice. Check details against the full judgments.</div></div></div>
</div></body>""")
print("ok")
