#!/usr/bin/env python3
"""Generate Lawgistics Instagram carousel slides as HTML, then screenshot with Chromium."""
import json, os, subprocess, pathlib

BASE = pathlib.Path(__file__).parent
FONTS = BASE / "node_modules" / "@fontsource"
OUT = BASE / "out"
OUT.mkdir(exist_ok=True)

CSS = f"""
@font-face {{ font-family:'Playfair Display'; font-weight:700; src:url('file://{FONTS}/playfair-display/files/playfair-display-latin-700-normal.woff2') format('woff2'); }}
@font-face {{ font-family:'Playfair Display'; font-weight:900; src:url('file://{FONTS}/playfair-display/files/playfair-display-latin-900-normal.woff2') format('woff2'); }}
@font-face {{ font-family:'Playfair Display'; font-weight:700; font-style:italic; src:url('file://{FONTS}/playfair-display/files/playfair-display-latin-700-italic.woff2') format('woff2'); }}
@font-face {{ font-family:'Inter'; font-weight:400; src:url('file://{FONTS}/inter/files/inter-latin-400-normal.woff2') format('woff2'); }}
@font-face {{ font-family:'Inter'; font-weight:500; src:url('file://{FONTS}/inter/files/inter-latin-500-normal.woff2') format('woff2'); }}
@font-face {{ font-family:'Inter'; font-weight:600; src:url('file://{FONTS}/inter/files/inter-latin-600-normal.woff2') format('woff2'); }}
@font-face {{ font-family:'Inter'; font-weight:700; src:url('file://{FONTS}/inter/files/inter-latin-700-normal.woff2') format('woff2'); }}
@font-face {{ font-family:'Inter'; font-weight:800; src:url('file://{FONTS}/inter/files/inter-latin-800-normal.woff2') format('woff2'); }}

* {{ margin:0; padding:0; box-sizing:border-box; }}
html,body {{ width:1080px; height:1350px; overflow:hidden; }}
body {{
  background:#0B1626;
  background-image:
    radial-gradient(1000px 800px at 88% -8%, rgba(201,162,39,.14) 0%, rgba(201,162,39,.05) 45%, rgba(201,162,39,0) 100%),
    radial-gradient(1400px 1200px at -12% 108%, rgba(23,48,84,.7) 0%, rgba(23,48,84,.25) 55%, rgba(23,48,84,0) 100%),
    linear-gradient(160deg, #0E1D33 0%, #0B1626 55%, #091220 100%);
  color:#F4EFE4; font-family:'Inter',sans-serif;
  -webkit-font-smoothing:antialiased;
}}
.frame {{
  position:absolute; inset:36px; border:1.5px solid rgba(201,162,39,.38);
  pointer-events:none;
}}
.frame::before, .frame::after,
.corners::before, .corners::after {{
  content:''; position:absolute; width:34px; height:34px; border-color:#C9A227; border-style:solid;
}}
.frame::before {{ top:-2px; left:-2px; border-width:3.5px 0 0 3.5px; }}
.frame::after  {{ top:-2px; right:-2px; border-width:3.5px 3.5px 0 0; }}
.corners::before {{ bottom:-2px; left:-2px; border-width:0 0 3.5px 3.5px; }}
.corners::after  {{ bottom:-2px; right:-2px; border-width:0 3.5px 3.5px 0; }}
.corners {{ position:absolute; inset:36px; pointer-events:none; }}

.page {{ position:absolute; inset:36px; padding:74px 84px 66px; display:flex; flex-direction:column; }}

.kicker {{
  display:flex; align-items:center; gap:24px; white-space:nowrap;
  font-size:23px; font-weight:600; letter-spacing:.26em; color:#C9A227; text-transform:uppercase;
}}
.kicker .rule {{ flex:1; height:1px; background:linear-gradient(90deg, rgba(201,162,39,.55), rgba(201,162,39,.15)); }}
.kicker .date {{ color:#8FA0B6; letter-spacing:.22em; }}

.chip {{
  align-self:flex-start; margin-top:64px; padding:14px 30px 13px;
  border:1.5px solid rgba(201,162,39,.65); color:#E8CE7E;
  font-size:26px; font-weight:700; letter-spacing:.26em; text-transform:uppercase;
}}

h1 {{ font-family:'Playfair Display',serif; font-weight:900; color:#FBF7EC; }}
.cover h1 {{ font-size:97px; line-height:1.09; margin-top:56px; letter-spacing:.2px; }}
.cover .sub {{ margin-top:44px; font-size:38px; line-height:1.5; color:#C9D3E2; font-weight:400; max-width:820px; }}
.cover .sub strong {{ color:#F4EFE4; font-weight:600; }}

.content h1 {{ font-size:66px; line-height:1.14; margin-top:34px; }}
.body {{ margin-top:46px; font-size:37px; line-height:1.56; color:#CBD5E3; font-weight:400; }}
.body p + p {{ margin-top:30px; }}
.body strong {{ color:#F4EFE4; font-weight:600; }}
.body em {{ color:#E8CE7E; font-style:normal; font-weight:500; }}
ul.body {{ list-style:none; }}
ul.body li {{ padding-left:52px; position:relative; margin-top:26px; }}
ul.body li::before {{ content:''; position:absolute; left:6px; top:22px; width:16px; height:16px; background:#C9A227; transform:rotate(45deg); }}

.pull {{
  margin-top:auto; margin-bottom:40px; border-left:5px solid #C9A227; padding:8px 0 8px 36px;
  font-family:'Playfair Display',serif; font-style:italic; font-weight:700; font-size:40px; line-height:1.35; color:#E8CE7E;
}}

.cite {{
  margin-top:auto; padding-top:28px; font-size:26px; color:#8FA0B6; font-weight:500; letter-spacing:.02em;
}}
.cite .case {{ color:#C9D3E2; }}

.footer {{
  margin-top:26px; padding-top:30px; border-top:1px solid rgba(201,162,39,.35);
  display:flex; align-items:baseline; justify-content:space-between;
}}
.wordmark {{ font-family:'Playfair Display',serif; font-weight:700; font-size:33px; letter-spacing:.34em; color:#F4EFE4; }}
.wordmark span {{ color:#C9A227; }}
.pagenum {{ font-size:26px; font-weight:600; color:#8FA0B6; letter-spacing:.18em; }}
.swipe {{ font-size:27px; font-weight:600; color:#C9A227; letter-spacing:.22em; text-transform:uppercase; }}

.q .prompt {{ margin-top:56px; font-family:'Playfair Display',serif; font-weight:900; font-size:76px; line-height:1.16; color:#FBF7EC; }}
.q .cta {{ margin-top:52px; font-size:36px; line-height:1.55; color:#CBD5E3; }}
.q .cta strong {{ color:#E8CE7E; font-weight:600; }}
.disclaimer {{ margin-top:auto; font-size:23px; color:#67788E; line-height:1.5; }}
"""

def shell(kicker, inner, footer_right, slug):
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body><div class="frame"></div><div class="corners"></div>
<div class="page">
  <div class="kicker"><span>Daily Court Intelligence</span><span class="rule"></span><span class="date">30 July 2026</span></div>
  {inner}
  <div class="footer"><div class="wordmark">LAW<span>GISTICS</span></div><div>{footer_right}</div></div>
</div></body></html>"""
    p = OUT / f"{slug}.html"
    p.write_text(html)
    return p

KICKER = "Daily Court Intelligence &middot; 30 July 2026"

def cover(slug, chip, headline, sub, cite):
    inner = f"""<div class="cover" style="display:flex;flex-direction:column;flex:1;">
      <div class="chip">{chip}</div>
      <h1>{headline}</h1>
      <div class="sub">{sub}</div>
      <div class="cite">{cite}</div></div>"""
    return shell(KICKER, inner, '<span class="swipe">Swipe &rarr;</span>', slug)

def content(slug, chip, headline, body, cite, num, pull=None):
    pull_html = f'<div class="pull">{pull}</div>' if pull else ''
    inner = f"""<div class="content" style="display:flex;flex-direction:column;flex:1;">
      <div class="chip">{chip}</div>
      <h1>{headline}</h1>
      {body}
      {pull_html}
      <div class="cite">{cite}</div></div>"""
    return shell(KICKER, inner, f'<span class="pagenum">{num} / 6</span>', slug)

def question(slug, chip, prompt, cta, num):
    inner = f"""<div class="q" style="display:flex;flex-direction:column;flex:1;">
      <div class="chip">{chip}</div>
      <div class="prompt">{prompt}</div>
      <div class="cta">{cta}</div>
      <div class="disclaimer">General information only, not legal advice. Read the full judgment before relying on it.</div></div>"""
    return shell(KICKER, inner, f'<span class="pagenum">{num} / 6</span>', slug)

CITE_A = '<span class="case">White Oak Commercial Finance Europe (Non-Levered) Ltd v Insurance Australia Ltd</span> [2026] FCA 769'
CITE_B = '<span class="case">Elvin v Fair Work Ombudsman</span> [2026] FCAFC 92'

pages = [
  cover("a1", "Federal Court",
    "&ldquo;Without prejudice&rdquo; is not a magic spell.",
    "The Federal Court just refused to protect settlement-adjacent messages in the <strong>Greensill insurance wars</strong> &mdash; because labels don&rsquo;t make privilege. Substance does.",
    CITE_A),
  content("a2", "The Facts",
    "A collapsed giant. A lender. An insurer.",
    """<div class="body"><p>After <strong>Greensill</strong> imploded in 2021, lender <strong>White Oak</strong> sued Insurance Australia Ltd, claiming trade credit insurance should cover its losses.</p>
    <p>This round was a documents fight: the insurer demanded <strong>twelve messages and a draft term sheet</strong> created while the parties circled a possible settlement.</p></div>""",
    CITE_A, 2),
  content("a3", "The Legal Issue",
    "Are &ldquo;settlement vibes&rdquo; protected?",
    """<div class="body"><p>Without prejudice privilege shields <strong>genuine settlement negotiations</strong> from becoming evidence.</p>
    <p>But does it cover messages that merely <em>talk about the dispute</em> &mdash; with no offer, no admissions, no deal on the table?</p></div>""",
    CITE_A, 3),
  content("a4", "The Court&rsquo;s Reasoning",
    "No negotiation, no privilege.",
    """<ul class="body">
    <li>The messages addressed only a <strong>&ldquo;general approach&rdquo;</strong> to the dispute.</li>
    <li>No reference to litigation. No admissions. <strong>No element of compromise.</strong></li>
    <li>Other documents weren&rsquo;t even relevant &mdash; so production was refused at the first gate.</li></ul>""",
    CITE_A, 4),
  content("a5", "Practical Takeaway",
    "Make negotiations look like negotiations.",
    """<ul class="body">
    <li>A &ldquo;without prejudice&rdquo; header <strong>proves nothing</strong> on its own.</li>
    <li>Substantiate privilege <strong>document by document</strong>, with evidence.</li>
    <li>Resisting production? Argue <strong>relevance first</strong> &mdash; it&rsquo;s often the cleaner kill.</li></ul>""",
    CITE_A, 5),
  question("a6", "Your Turn",
    "Ever slapped &ldquo;without prejudice&rdquo; on an email&hellip; just in case?",
    "Be honest. <strong>Tell us in the comments</strong> &mdash; and share this with the colleague who does it weekly.",
    6),

  cover("b1", "Full Federal Court",
    "The company cut a deal. The regulator kept coming.",
    "A deed of company arrangement didn&rsquo;t stop the <strong>Fair Work Ombudsman</strong> &mdash; and the Full Court&rsquo;s ruling touches every underpayment case in Australia.",
    CITE_B),
  content("b2", "The Facts",
    "Underpaid therapists, personal liability.",
    """<div class="body"><p>The Fair Work Ombudsman sued over <strong>underpaid massage therapists</strong> &mdash; and won at trial, including findings against an individual <strong>personally involved</strong> in the contraventions.</p>
    <p>Meanwhile, the employing company struck a <strong>deed of company arrangement</strong> (DOCA) with its creditors.</p></div>""",
    CITE_B, 2),
  content("b3", "The Legal Issues",
    "Three questions, one appeal.",
    """<ul class="body">
    <li>Were the therapists correctly classified under the <strong>health award</strong>?</li>
    <li>Was the trial <strong>fair to a self-represented litigant</strong> facing technical evidence rules?</li>
    <li>Is the FWO even a <strong>&ldquo;creditor&rdquo;</strong> bound by a DOCA?</li></ul>""",
    CITE_B, 3),
  content("b4", "The Court&rsquo;s Reasoning",
    "Neither side walked away clean.",
    """<div class="body"><p>The Full Court &mdash; Collier, McDonald and Vandongen JJ &mdash; <strong>allowed the appeal in part</strong> and dismissed the FWO&rsquo;s cross-appeal.</p>
    <p>Evidence rules like <em>Browne v Dunn</em> must be applied carefully against unrepresented parties &mdash; and classification got a full workout.</p></div>""",
    CITE_B, 4),
  content("b5", "Practical Takeaway",
    "Restructures don&rsquo;t erase workplace risk.",
    """<ul class="body">
    <li><strong>Audit award classifications</strong> &mdash; they drive the whole quantum.</li>
    <li>Personal accessorial liability <strong>survives corporate rescue</strong>.</li>
    <li>Facing a self-represented opponent? <strong>Over-invest in fairness</strong> &mdash; it protects your win on appeal.</li></ul>""",
    CITE_B, 5),
  question("b6", "Your Turn",
    "Should self-represented litigants get more slack on evidence rules?",
    "Or does that shortchange the represented side? <strong>Drop your take below.</strong>",
    6),
]

print(json.dumps([str(p) for p in pages]))
