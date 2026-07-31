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
.case{margin-top:104px;font-size:50px;font-weight:600;line-height:1.22;max-width:900px;}
.case span{color:#3A5697;}
.hold{margin-top:34px;font-size:31px;font-weight:400;line-height:1.52;color:#4E4A3F;max-width:880px;}
.hold p+p{margin-top:22px;}
.why{margin-top:28px;font-size:31px;line-height:1.52;font-weight:400;color:#4E4A3F;max-width:880px;}
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
  '<p>The Greensill coverage war, on foot since 2021. White Oak claims on a trade credit policy written by <b>BCC Trade Credit as agent for IAL</b>.</p><p>This round: IAL demanded twelve messages and a draft term sheet created while the parties circled a settlement. White Oak claimed without prejudice privilege.</p><p>Held: the messages canvassed only a &ldquo;general approach&rdquo;. No offer, no admissions, <b>no element of compromise</b>. Not a negotiation, no privilege. The rest failed on relevance.</p>',
  '<b>Why it matters:</b> privilege is proven document by document. Labels do nothing.',
  '<b>[2026] FCA 769</b> &middot; Federal Court of Australia &middot; Thawley J'),
 ("Elvin <span>v</span> Fair Work Ombudsman",
  '<p>The FWO won underpayment findings over massage therapists classified under the <b>health professionals award</b>, plus accessorial findings against an individual personally involved.</p><p>On appeal: was the classification right? Were <b>Browne v Dunn</b> and <b>Jones v Dunkel</b> fairly applied against a self-represented litigant? And did the employer&rsquo;s DOCA bind the FWO as a &ldquo;creditor&rdquo;?</p><p>Appeal <b>allowed in part</b>. The FWO&rsquo;s cross-appeal dismissed.</p>',
  '<b>Why it matters:</b> restructures do not erase workplace risk, and personal liability sits outside the company.',
  '<b>[2026] FCAFC 92</b> &middot; Full Federal Court &middot; Collier, McDonald &amp; Vandongen JJ &middot; 22 July'),
 ("Smithbridge Guam <span>v</span> Swire Shipping",
  '<p>A carriage-of-goods dispute under a <b>booking note incorporating bill of lading terms</b>, headed for arbitration.</p><p>Smithbridge sought an anti-arbitration injunction, arguing <b>s 11(2)(b) of the Carriage of Goods by Sea Act 1991 (Cth)</b> rendered the arbitration agreement ineffective for its cargo claim.</p>',
  '<b>Why it matters:</b> for sea carriage touching Australia, statute can override your arbitration clause. Draft around s 11.',
  '<b>[2026] FCA 884</b> &middot; Federal Court of Australia &middot; S Derrington J &middot; 9 July'),
 ("Marsden, re Empire Consortium (in&nbsp;liq)",
  '<p>The liquidator of the collapsed <b>Empire Consortium Group</b> pursued Nationwide Plant Hire in the Federal Court.</p><p>The usual battlegrounds in liquidator recovery actions: unfair preferences, uncommercial transactions and unpaid debts. Full judgment breakdown to follow once digested.</p>',
  '<b>Why it matters:</b> when a counterparty collapses, expect the liquidator to come knocking, sometimes years later.',
  '<b>[2026] FCA 911</b> &middot; Federal Court of Australia &middot; 16 July'),
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
  <div class="hold"><p>Grofski sought <b>leave to appeal</b> in an employment dispute with Peabody&rsquo;s PCI mine management arm.</p><p>Leave is the gate most appeals never clear: you need an arguable error, and usually an injustice worth correcting.</p></div>
  <div class="why"><b>High Court watch:</b> winter recess since the 17 June judgments. Next delivery days expected in August.</div>
  <div class="bottom"><div><div class="cite"><b>[2026] FCA 921</b> &middot; Federal Court of Australia &middot; 15 July</div>
  <div class="note">General information only, not legal advice. Check details against the full judgments.</div></div></div>
</div></body>""")
print("ok")
