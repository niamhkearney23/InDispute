#!/usr/bin/env python3
"""Lawgistics carousel generator — PRESS design system (approved 30 Jul 2026).

Newsprint look: cream paper #F7F5F0, black #111 Anton headlines, red #D92B2B
tags, yellow #FFD84D highlighter. Fonts: Anton (display), Inter (everything else).
Edit SETS below, run `python3 build.py`, then `node shoot.mjs` → PNGs in ./out/.
"""
import json, pathlib

BASE = pathlib.Path(__file__).parent
F = BASE / "node_modules" / "@fontsource"
OUT = BASE / "out"
OUT.mkdir(exist_ok=True)

def font(fam, pkg, w):
    return f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('file://{F}/{pkg}/files/{pkg}-latin-{w}-normal.woff2') format('woff2');}}"

CSS = "\n".join([font("Anton","anton",400)] + [font("Inter","inter",w) for w in (400,500,600,700,800)]) + """
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1350px;overflow:hidden;-webkit-font-smoothing:antialiased;}
body{background:#F7F5F0;font-family:'Inter',sans-serif;color:#111;}
.bar{position:absolute;top:0;left:0;right:0;height:26px;background:#111;}
.bar2{position:absolute;bottom:0;left:0;right:0;height:26px;background:#111;}
.page{position:absolute;inset:26px 0;padding:64px 76px 56px;display:flex;flex-direction:column;}
.masthead{display:flex;justify-content:space-between;align-items:center;border-bottom:5px solid #111;padding-bottom:26px;}
.masthead .brand{font-family:'Anton';font-size:46px;letter-spacing:.02em;text-transform:uppercase;}
.masthead .brand em{font-style:normal;color:#D92B2B;}
.masthead .date{font-weight:700;font-size:24px;letter-spacing:.13em;text-transform:uppercase;}
.series{margin-top:44px;display:flex;align-items:center;gap:20px;}
.series .tag{background:#D92B2B;color:#fff;font-weight:800;font-size:26px;letter-spacing:.15em;padding:12px 24px;text-transform:uppercase;white-space:nowrap;}
.series .no{font-weight:800;font-size:26px;letter-spacing:.1em;color:#111;text-transform:uppercase;}
h1{font-family:'Anton';font-weight:400;line-height:1.04;text-transform:uppercase;margin-top:44px;letter-spacing:.005em;}
.cover h1{font-size:118px;line-height:1.02;}
.content h1{font-size:76px;}
.q h1{font-size:88px;line-height:1.08;}
h1 .hl{background:linear-gradient(180deg,transparent 8%,#FFD84D 8%,#FFD84D 92%,transparent 92%);padding:0 10px;}
.standfirst{margin-top:50px;font-size:38px;line-height:1.52;color:#26282B;max-width:890px;}
.body{margin-top:44px;font-size:36px;line-height:1.55;color:#26282B;}
.body p+p{margin-top:28px;}
.standfirst strong,.body strong{font-weight:700;color:#111;}
.standfirst em,.body em{font-style:normal;font-weight:700;color:#D92B2B;}
ul.body{list-style:none;}
ul.body li{padding-left:52px;position:relative;margin-top:26px;}
ul.body li::before{content:'';position:absolute;left:2px;top:20px;width:18px;height:18px;background:#D92B2B;}
.cite{margin-top:auto;font-size:24px;font-weight:600;color:#6B6E73;border-left:6px solid #FFD84D;padding-left:22px;line-height:1.45;}
.cite b{color:#111;}
.disclaimer{margin-top:auto;font-size:22px;color:#8A8D92;line-height:1.5;max-width:700px;}
.foot{margin-top:36px;border-top:5px solid #111;padding-top:26px;display:flex;justify-content:space-between;align-items:center;}
.foot .pg{font-family:'Anton';font-size:30px;letter-spacing:.06em;}
.foot .cta{background:#111;color:#fff;font-weight:800;font-size:24px;letter-spacing:.16em;padding:14px 26px;text-transform:uppercase;}
"""

def page(slug, kicker, tag, no, klass, inner, pg, cta):
    no_html = f'<span class="no">{no}</span>' if no else ''
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body><div class="bar"></div><div class="bar2"></div>
<div class="page {klass}">
  <div class="masthead"><div class="brand">Law<em>gistics</em></div><div class="date">{kicker}</div></div>
  <div class="series"><span class="tag">{tag}</span>{no_html}</div>
  {inner}
  <div class="foot"><div class="pg">{pg}</div><div class="cta">{cta}</div></div>
</div></body></html>"""
    (OUT / f"{slug}.html").write_text(html)

def cover(slug, kicker, tag, no, headline, standfirst, cite):
    page(slug, kicker, tag, no, "cover",
        f'<h1>{headline}</h1><div class="standfirst">{standfirst}</div><div class="cite">{cite}</div>',
        "01 / 06", "Swipe &rarr;")

def content(slug, kicker, tag, headline, body, cite, n):
    page(slug, kicker, tag, "", "content",
        f'<h1>{headline}</h1>{body}<div class="cite">{cite}</div>',
        f"0{n} / 06", "Swipe &rarr;")

def question(slug, kicker, headline, cta_text):
    page(slug, kicker, "Your Turn", "", "q",
        f'<h1>{headline}</h1><div class="standfirst">{cta_text}</div>'
        '<div class="disclaimer">General information only, not legal advice. Details should be checked against the full judgment before relying on them.</div>',
        "06 / 06", "Comment &darr;")

K_DAILY = "Daily Court Intelligence &middot; 30.07.26"
K_FRI = "The Big Case File &middot; 31.07.26"
CITE_A = '<b>White Oak Commercial Finance Europe (Non-Levered) Ltd v Insurance Australia Ltd</b> &middot; [2026] FCA 769'
CITE_B = '<b>Elvin v Fair Work Ombudsman</b> &middot; [2026] FCAFC 92'
CITE_F = '<b>MacInnes v Wilson</b> &middot; Federal Court of Australia &middot; Raper J &middot; 22 July 2026 &middot; appeal filed'

# ── Set A: White Oak (daily) ──
cover("a1", K_DAILY, "Federal Court", "Privilege",
    '&ldquo;Without prejudice&rdquo; is not a <span class="hl">magic spell.</span>',
    'The Federal Court refused to protect settlement-adjacent messages in the <strong>Greensill insurance wars</strong> &mdash; because labels don&rsquo;t make privilege. <em>Substance does.</em>',
    CITE_A)
content("a2", K_DAILY, "The Facts", 'A collapsed giant. A lender. An insurer.',
    """<div class="body"><p>After <strong>Greensill</strong> imploded in 2021, lender <strong>White Oak</strong> sued Insurance Australia Ltd, claiming trade credit insurance should cover its losses.</p>
    <p>This round was a documents fight: the insurer demanded <em>twelve messages and a draft term sheet</em> created while the parties circled a possible settlement.</p></div>""", CITE_A, 2)
content("a3", K_DAILY, "The Legal Issue", 'Are &ldquo;settlement vibes&rdquo; protected?',
    """<div class="body"><p>Without prejudice privilege shields <strong>genuine settlement negotiations</strong> from becoming evidence.</p>
    <p>But does it cover messages that merely <em>talk about</em> the dispute &mdash; with no offer, no admissions, no deal on the table?</p></div>""", CITE_A, 3)
content("a4", K_DAILY, "The Court&rsquo;s Reasoning", 'No negotiation, no privilege.',
    """<ul class="body">
    <li>The messages addressed only a <strong>&ldquo;general approach&rdquo;</strong> to the dispute.</li>
    <li>No reference to litigation. No admissions. <em>No element of compromise.</em></li>
    <li>Other documents weren&rsquo;t even relevant &mdash; so production was refused at the first gate.</li></ul>""", CITE_A, 4)
content("a5", K_DAILY, "Practical Takeaway", 'Make negotiations look like negotiations.',
    """<ul class="body">
    <li>A &ldquo;without prejudice&rdquo; header <strong>proves nothing</strong> on its own.</li>
    <li>Substantiate privilege <strong>document by document</strong>, with evidence.</li>
    <li>Resisting production? Argue <em>relevance first</em> &mdash; it&rsquo;s often the cleaner kill.</li></ul>""", CITE_A, 5)
question("a6", K_DAILY, 'Ever written &ldquo;without prejudice&rdquo;&hellip; <span class="hl">just in case?</span>',
    'Be honest. <strong>Tell us in the comments</strong> &mdash; and share this with the colleague who does it weekly.')

# ── Set B: Elvin (banked daily) ──
cover("b1", K_DAILY, "Full Federal Court", "Fair Work",
    'The company cut a deal. The regulator <span class="hl">kept coming.</span>',
    'A deed of company arrangement didn&rsquo;t stop the <strong>Fair Work Ombudsman</strong> &mdash; and the Full Court&rsquo;s ruling touches <em>every underpayment case</em> in Australia.',
    CITE_B)
content("b2", K_DAILY, "The Facts", 'Underpaid therapists, personal liability.',
    """<div class="body"><p>The Fair Work Ombudsman sued over <strong>underpaid massage therapists</strong> &mdash; and won at trial, including findings against an individual <em>personally involved</em> in the contraventions.</p>
    <p>Meanwhile, the employing company struck a <strong>deed of company arrangement</strong> (DOCA) with its creditors.</p></div>""", CITE_B, 2)
content("b3", K_DAILY, "The Legal Issues", 'Three questions, one appeal.',
    """<ul class="body">
    <li>Were the therapists correctly classified under the <strong>health award</strong>?</li>
    <li>Was the trial <strong>fair to a self-represented litigant</strong> facing technical evidence rules?</li>
    <li>Is the FWO even a <em>&ldquo;creditor&rdquo;</em> bound by a DOCA?</li></ul>""", CITE_B, 3)
content("b4", K_DAILY, "The Court&rsquo;s Reasoning", 'Neither side walked away clean.',
    """<div class="body"><p>The Full Court &mdash; Collier, McDonald and Vandongen JJ &mdash; <strong>allowed the appeal in part</strong> and dismissed the FWO&rsquo;s cross-appeal.</p>
    <p>Evidence rules like <em>Browne v Dunn</em> must be applied carefully against unrepresented parties &mdash; and classification got a full workout.</p></div>""", CITE_B, 4)
content("b5", K_DAILY, "Practical Takeaway", 'Restructures don&rsquo;t erase workplace risk.',
    """<ul class="body">
    <li><strong>Audit award classifications</strong> &mdash; they drive the whole quantum.</li>
    <li>Personal accessorial liability <em>survives corporate rescue</em>.</li>
    <li>Facing a self-represented opponent? <strong>Over-invest in fairness</strong> &mdash; it protects your win on appeal.</li></ul>""", CITE_B, 5)
question("b6", K_DAILY, 'More slack for self-represented litigants &mdash; <span class="hl">fair or foul?</span>',
    'Or does that shortchange the represented side? <strong>Drop your take below.</strong>')

# ── Set F: Big Case File No. 1 — Rebel Wilson ──
cover("f1", K_FRI, "Case File", "No. 001 &mdash; Rebel Wilson",
    'Four posts. <span class="hl">Zero</span> defamation.',
    'Charlotte MacInnes sued <strong>Rebel Wilson</strong> over Instagram posts about an on-set dispute. The Federal Court threw out <strong>every claim</strong> &mdash; a masterclass in modern defamation law.',
    CITE_F)
content("f2", K_FRI, "The Facts", 'A film set, a fallout, a lawsuit.',
    """<div class="body"><p>MacInnes starred in <em>The Deb</em> &mdash; Wilson&rsquo;s directorial debut. She sued over <strong>four sets of Instagram posts</strong> (Sept 2024 &ndash; July 2025), saying they painted her as having <strong>changed her story</strong> about an incident involving a producer&hellip; to boost her career.</p>
    <p>She added a breach of confidence claim for good measure.</p></div>""", CITE_F, 2)
content("f3", K_FRI, "The Legal Issue", 'Defamation has three locked doors.',
    """<ul class="body">
    <li>Did the posts actually <strong>convey the meanings</strong> she alleged?</li>
    <li>Were those meanings <strong>defamatory</strong>?</li>
    <li>Did they cause <em>serious harm</em>? (Mandatory since the 2021 reforms.)</li></ul>
    <div class="body"><p>And waiting behind all three: Wilson&rsquo;s <strong>substantial truth</strong> defence.</p></div>""", CITE_F, 3)
content("f4", K_FRI, "The Court&rsquo;s Reasoning", 'Every door stayed shut.',
    """<ul class="body">
    <li>Only <strong>one</strong> alleged meaning was conveyed by any post: that MacInnes <strong>changed her account</strong>.</li>
    <li>That was <em>substantially true</em>, Justice Raper found.</li>
    <li>&ldquo;She changed her story&rdquo; isn&rsquo;t necessarily defamatory anyway &mdash; and <strong>no serious harm was proven</strong>. Dismissed, with costs.</li></ul>""", CITE_F, 4)
content("f5", K_FRI, "Practical Takeaway", 'Serious harm is the new gatekeeper.',
    """<ul class="body">
    <li>Since 2021, plaintiffs must <strong>prove serious harm</strong> &mdash; courts won&rsquo;t assume it, even for viral posts.</li>
    <li>The <strong>court</strong> decides what a post means &mdash; not the plaintiff&rsquo;s reading of it.</li>
    <li>Truth remains the <em>complete defence</em>. An appeal has been filed &mdash; watch this space.</li></ul>""", CITE_F, 5)
question("f6", K_FRI, 'Litigate on Instagram &mdash; <span class="hl">risky genius</span> or terrible template?',
    'Wilson posted her side while cameras rolled, and won. <strong>Drop your take below.</strong>')

print(json.dumps(sorted(p.name for p in OUT.glob('*.html'))))
