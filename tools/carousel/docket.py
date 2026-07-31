#!/usr/bin/env python3
"""The Docket: daily one-slide roundup of all decisions in the coverage window."""
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
.page{position:absolute;inset:0;padding:84px;display:flex;flex-direction:column;}
.top{display:flex;justify-content:space-between;align-items:baseline;}
.title{font-size:58px;font-weight:600;}
.date{font-size:23px;font-weight:500;color:#8C8577;}
.sub{margin-top:16px;font-size:26px;font-weight:400;color:#6E6858;}
.list{margin-top:56px;display:flex;flex-direction:column;}
.item{padding:30px 0;border-top:1px solid #D5CCBB;}
.item:first-child{border-top:none;padding-top:0;}
.case{font-size:31px;font-weight:600;line-height:1.3;}
.case span{color:#3A5697;}
.hold{margin-top:10px;font-size:27px;font-weight:400;line-height:1.45;color:#4E4A3F;}
.meta{margin-top:8px;font-size:21px;font-weight:500;color:#8C8577;}
.note{margin-top:auto;font-size:19px;line-height:1.5;color:#8C8577;max-width:820px;}
"""

items = [
 ("White Oak <span>v</span> Insurance Australia",
  "A &ldquo;without prejudice&rdquo; label alone doesn&rsquo;t create privilege. Genuine negotiation does.",
  "[2026] FCA 769 &middot; Federal Court &middot; Thawley J"),
 ("Elvin <span>v</span> Fair Work Ombudsman",
  "Underpayment appeal allowed in part. Is the FWO a creditor bound by a DOCA? Now a live question.",
  "[2026] FCAFC 92 &middot; Full Federal Court"),
 ("Smithbridge Guam <span>v</span> Swire Shipping",
  "Anti-suit injunction in a carriage-of-goods dispute.",
  "[2026] FCA 884 &middot; Federal Court &middot; admiralty"),
 ("Marsden, re Empire Consortium (in liq)",
  "Insolvency: liquidator proceedings against Nationwide Plant Hire.",
  "[2026] FCA 911 &middot; Federal Court"),
 ("Grofski <span>v</span> Peabody Energy",
  "Leave to appeal refused in employment dispute.",
  "[2026] FCA 921 &middot; Federal Court"),
]

rows = "".join(f'<div class="item"><div class="case">{c}</div><div class="hold">{h}</div><div class="meta">{m}</div></div>' for c,h,m in items)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body><div class="page">
  <div class="top"><div class="title">The Docket.</div><div class="date">30.07.26</div></div>
  <div class="sub">What moved in the courts this week.</div>
  <div class="list">{rows}</div>
  <div class="note">High Court: winter recess, next judgments expected from August.<br>General information only, not legal advice. Compiled from published listings and reports; check details against the full judgments.</div>
</div></body></html>"""
(OUT / "docket.html").write_text(html)
print("ok")
