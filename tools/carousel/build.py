#!/usr/bin/env python3
"""Lawgistics carousel generator — MINIMAL design system (approved 30 Jul 2026).

Quiet-luxury editorial: one statement per slide, huge whitespace.
Palette (from Niamh's existing Lawgistics grid): warm cream #EDE7DC,
deep navy #171D2B, steel-blue underline accent #3A5697.
Font: TikTok Sans (@fontsource/tiktok-sans). Final slide inverts to navy.
Edit SETS below, run `python3 build.py`, then `node shoot.mjs` → PNGs in ./out/.
"""
import json, pathlib

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
.top{display:flex;justify-content:space-between;align-items:baseline;}
.brand{font-size:31px;font-weight:600;letter-spacing:.01em;}
.pg{font-size:23px;font-weight:500;color:#8C8577;}
.dark .pg{color:#8B93A8;}
.kicker{margin-top:14px;font-size:20px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#8C8577;}
.dark .kicker{color:#8B93A8;}
.statement{margin-top:190px;font-weight:500;color:inherit;max-width:900px;}
.statement.lg{font-size:64px;line-height:1.3;}
.statement.md{font-size:56px;line-height:1.34;}
.statement p+p{margin-top:44px;}
.statement strong{font-weight:600;}
.u{border-bottom:4px solid #3A5697;padding-bottom:4px;box-decoration-break:clone;-webkit-box-decoration-break:clone;}
.dark .u{border-bottom-color:#6E86C9;}
.sub{margin-top:56px;font-size:30px;line-height:1.5;font-weight:400;color:#6E6858;max-width:820px;}
.dark .sub{color:#A9B0C2;}
.bottom{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:60px;}
.cite{font-size:21px;line-height:1.55;font-weight:500;color:#8C8577;max-width:700px;}
.cite b{color:#4E4A3F;font-weight:600;}
.dark .cite{color:#8B93A8;}
.dark .cite b{color:#C9CEDD;}
.swipe{font-size:21px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#171D2B;white-space:nowrap;}
.dark .swipe{color:#EDE7DC;}
.disclaimer{font-size:18px;line-height:1.5;color:#707888;max-width:640px;margin-top:20px;}
"""

def slide(slug, kicker, n, statement, cite, size="md", dark=False, sub=None, swipe=None, disclaimer=False):
    disc = '<div class="disclaimer">General information only, not legal advice. Check details against the full judgment.</div>' if disclaimer else ''
    sub_html = f'<div class="sub">{sub}</div>' if sub else ''
    swipe_html = f'<div class="swipe">{swipe}</div>' if swipe else ''
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body class="{'dark' if dark else ''}"><div class="page">
  <div class="top"><div></div><div class="pg">{n} / 6</div></div>
  <div class="statement {size}">{statement}</div>
  {sub_html}
  <div class="bottom"><div><div class="cite">{cite}</div>{disc}</div>{swipe_html}</div>
</div></body></html>"""
    (OUT / f"{slug}.html").write_text(html)

K_A = "Daily Court Intelligence &middot; 30.07.26"
K_B = "Daily Court Intelligence &middot; 30.07.26"
K_F = "The Big Case File &middot; No. 001"
CITE_A = '<b>White Oak Commercial Finance Europe (Non-Levered) Ltd v Insurance Australia Ltd</b><br>[2026] FCA 530 &amp; [2026] FCA 769 &middot; Federal Court of Australia &middot; Thawley J'
CITE_A1 = '<b>White Oak v Insurance Australia (No 3)</b> &middot; [2026] FCA 530 &middot; 28 April 2026 &middot; Thawley J'
CITE_A2 = '<b>White Oak v Insurance Australia (Without Prejudice Privilege)</b> &middot; [2026] FCA 769 &middot; Thawley J'
CITE_B = '<b>Elvin v Fair Work Ombudsman</b> &middot; [2026] FCAFC 92<br>Full Court of the Federal Court &middot; Collier, McDonald &amp; Vandongen JJ'
CITE_F = '<b>MacInnes v Wilson</b> &middot; Federal Court of Australia &middot; Raper J<br>22 July 2026 &middot; appeal filed'

# ── Set A: White Oak ──
slide("a1", K_A, 1,
    '&ldquo;Without prejudice&rdquo; is not a <span class="u">magic spell.</span> Two rulings in the Greensill insurance wars just showed why.',
    CITE_A, size="lg", swipe="Swipe &rarr;")
slide("a2", K_A, 2,
    '<p>After Greensill collapsed, White Oak sued IAL on a trade credit policy written by <strong>BCC Trade Credit as IAL&rsquo;s agent</strong>.</p><p>The paper war is enormous. Twice in three months, without prejudice privilege took <span class="u">centre stage.</span></p>',
    CITE_A)
slide("a3", K_A, 3,
    '<p>Round one, April. White Oak challenged privilege claims by <strong>BCC and the Tokio Marine parties</strong> over settlement-talk documents.</p><p>Held: messages canvassing a &ldquo;general approach&rdquo;, with <span class="u">no element of compromise</span>, are not negotiations. No privilege.</p>',
    CITE_A1)
slide("a4", K_A, 4,
    '<p>Round two, published this week. IAL demanded twelve messages and a draft term sheet White Oak created while negotiating a resolution.</p><p>Held: <span class="u">not directly relevant.</span> Production refused. The privilege question never needed answering.</p>',
    CITE_A2)
slide("a5", K_A, 5,
    '<p>Substantiate privilege document by document, with evidence.</p><p>Argue relevance first. It can end the fight early.</p><p>And make negotiations <span class="u">look like negotiations.</span></p>',
    CITE_A)
slide("a6", K_A, 6,
    'Be honest: have you ever written &ldquo;without prejudice&rdquo; <span class="u">just in case?</span>',
    CITE_A, size="lg", dark=True, sub="Everyone knows someone who does it weekly.",
    disclaimer=True)

# ── Set B: Elvin ──
slide("b1", K_B, 1,
    'A company cut a deal with its creditors. The Fair Work Ombudsman <span class="u">kept coming anyway.</span>',
    CITE_B, size="lg", swipe="Swipe &rarr;")
slide("b2", K_B, 2,
    '<p>The FWO sued over underpaid massage therapists and won, including findings against an individual <strong>personally involved</strong>.</p><p>Then the employer struck a deed of company arrangement.</p>',
    CITE_B)
slide("b3", K_B, 3,
    '<p>Three questions on appeal:</p><p>The award classification. Fairness to a <strong>self-represented litigant</strong>. And whether the FWO is even a <span class="u">&ldquo;creditor&rdquo; bound by a DOCA.</span></p>',
    CITE_B)
slide("b4", K_B, 4,
    '<p>The Full Court allowed the appeal <strong>in part</strong> and dismissed the FWO&rsquo;s cross-appeal.</p><p>Technical evidence rules must be applied <span class="u">carefully against unrepresented parties.</span></p>',
    CITE_B)
slide("b5", K_B, 5,
    '<p>Audit award classifications.</p><p>Assume personal liability <span class="u">survives corporate rescue.</span></p><p>And over-invest in fairness against self-represented opponents.</p>',
    CITE_B)
slide("b6", K_B, 6,
    'Should self-represented litigants get <span class="u">more slack</span> on evidence rules?',
    CITE_B, size="lg", dark=True, sub="Or does that shortchange the represented side?",
    disclaimer=True)

# ── Set F: Big Case File No. 1 — Rebel Wilson ──
slide("f1", K_F, 1,
    'Charlotte MacInnes sued Rebel Wilson over four Instagram posts. The Federal Court just threw out <span class="u">every claim.</span>',
    CITE_F, size="lg", swipe="Swipe &rarr;")
slide("f2", K_F, 2,
    '<p>MacInnes starred in <strong>The Deb</strong>, Wilson&rsquo;s directorial debut.</p><p>She said Wilson&rsquo;s posts painted her as <span class="u">changing her story</span> about an on-set incident, to boost her career.</p>',
    CITE_F)
slide("f3", K_F, 3,
    '<p>To win, she had to prove the posts <strong>conveyed her meanings</strong>, that they were <strong>defamatory</strong>, and that they caused <span class="u">serious harm.</span></p>',
    CITE_F)
slide("f4", K_F, 4,
    '<p>Only one meaning was conveyed: that she <strong>changed her account</strong>.</p><p>The Court found that was <span class="u">substantially true</span>. No serious harm was proven either. Dismissed, with costs.</p>',
    CITE_F)
slide("f5", K_F, 5,
    '<p>Serious harm is the gatekeeper now.</p><p>Courts decide what posts mean, not plaintiffs.</p><p>And truth remains <span class="u">the complete defence.</span></p>',
    CITE_F)
slide("f6", K_F, 6,
    'Litigating on Instagram: <span class="u">risky genius</span> or terrible template?',
    CITE_F, size="lg", dark=True, sub="Wilson posted her side while cameras rolled, and won.",
    disclaimer=True)



# ── Set G: Hanson v Faruqi (edition 01.08.26) ──
K_G = "Daily Court Intelligence &middot; 01.08.26"
CITE_G = '<b>Hanson v Faruqi</b> &middot; Full Court of the Federal Court &middot; 27 July 2026<br>on appeal from Faruqi v Hanson [2024] FCA 1264 &middot; FCAFC number to be confirmed'

slide("g1", K_G, 1,
    'Hanson lost. The Full Federal Court says telling a senator to &ldquo;piss off back to Pakistan&rdquo; <span class="u">broke the law.</span>',
    CITE_G, size="lg", swipe="Swipe &rarr;")
slide("g2", K_G, 2,
    '<p>September 2022. Senator Mehreen Faruqi tweeted about the Queen&rsquo;s death. Senator Pauline Hanson replied: pack your bags and <strong>piss off back to Pakistan</strong>.</p><p>In 2024 the Federal Court found the post breached <span class="u">section 18C</span> of the Racial Discrimination Act.</p>',
    CITE_G)
slide("g3", K_G, 3,
    '<p>On appeal, Hanson went big.</p><p>She argued the post did not breach s 18C. And that s 18C itself is <span class="u">constitutionally invalid</span>, an impermissible burden on political communication.</p>',
    CITE_G)
slide("g4", K_G, 4,
    '<p>Three judges. <strong>Unanimous.</strong></p><p>The post was correctly characterised as anti-Muslim and Islamophobic, a variant of the racist slogan <span class="u">&ldquo;go back to where you came from&rdquo;</span>.</p><p>Section 18C is valid. The fair comment defence failed.</p>',
    CITE_G)
slide("g5", K_G, 5,
    '<p>Section 18C has teeth, and it just survived a full constitutional assault.</p><p>Public figures are not exempt. <span class="u">Political speech is not a licence for racism.</span></p><p>Hanson has 28 days to try the High Court.</p>',
    CITE_G)
slide("g6", K_G, 6,
    'Will the High Court take this on? <span class="u">And should it?</span>',
    CITE_G, size="lg", dark=True, sub="Hanson says she will fight on.",
    disclaimer=True)



# ── Set J: ACCC v JustAnswer (edition 01.08.26, post 2) ──
K_J = "Daily Court Intelligence &middot; 01.08.26"
CITE_J = '<b>ACCC v JustAnswer LLC</b> &middot; [2026] FCA 871 &middot; Snaden J &middot; 8 July 2026<br>Competition and Consumer Amendment (Unfair Trading Practices) Act 2026'

slide("j1", K_J, 1,
    'A chat box promised help for <span class="u">two dollars.</span> It cost the company ten million.',
    CITE_J, size="lg", swipe="Swipe &rarr;")
slide("j2", K_J, 2,
    '<p>JustAnswer&rsquo;s website widget told Australians it was sending them to a page to join <strong>for only AU$2, fully refundable</strong>.</p><p>What they actually joined: an ongoing subscription of <span class="u">$45 to $75 a month.</span></p>',
    CITE_J)
slide("j3", K_J, 3,
    '<p>It got worse. For roughly 18 months the company also claimed it was <strong>approved by or affiliated with the Fair Work Ombudsman</strong>.</p><p>It was not.</p>',
    CITE_J)
slide("j4", K_J, 4,
    '<p>JustAnswer admitted the contraventions.</p><p>Justice Snaden ordered <span class="u">$10 million in penalties</span>, refunds for affected consumers, corrective notices and a compliance program.</p>',
    CITE_J)
slide("j5", K_J, 5,
    '<p>And Parliament just went further. From <strong>1 July 2027</strong>, subscription traps, drip pricing and dark patterns become <span class="u">separately unlawful</span>.</p><p>Businesses have twelve months to fix their checkout.</p>',
    CITE_J)
slide("j6", K_J, 6,
    'Which subscription was <span class="u">hardest to cancel?</span>',
    CITE_J, size="lg", dark=True, sub="We all have one.",
    disclaimer=True)

print(json.dumps(sorted(p.name for p in OUT.glob('*.html'))))
