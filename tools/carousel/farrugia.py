#!/usr/bin/env python3
"""Farrugia v The King [2026] HCA 28. Appeal dismissed 12 August 2026.

One Senior Counsel appeared for two co-offenders at a sentencing hearing and
submitted, against the Crown's own written position, that his client Farrugia
was MORE culpable than the co-offender. Farrugia got the longer sentence.
Majority: no conflict was PROVED, because he adduced no evidence of advice or
instructions and kept privilege over them. Edelman J and Jagot J dissented.

DESIGN: six slides, deliberately mixed card templates (quote / headline /
number / headline / headline / air) rather than six of the same. Navy dominant,
cream closer, one cream card mid-deck.

GUARDRAILS
 - The appeal was DISMISSED. Nothing was found against Senior Counsel; the
   Court held the opposite, that no conflict was established on the evidence.
   Slide 5 says so. Do not let a caption imply misconduct was found.
 - Slide 1 is a DISSENT and is labelled as one on the slide itself.
 - Sentences and figures are from the judgment, [12].
"""
import pathlib, subprocess

BASE = pathlib.Path(__file__).parent
head = (BASE / "_case_head.py").read_text()
head = head.replace("TOTAL = 5", "TOTAL = 6")

EXTRA = """
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
"""
head = head.replace(".foot{margin-top:auto;", EXTRA + "\n.foot{margin-top:auto;")

ARROW = ('<svg class="arw" width="58" height="50" viewBox="0 0 58 50">'
         '<path d="M54 46 C 40 42, 20 36, 10 9" stroke="COL" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
         '<path d="M9 5 L 19 11 M9 5 L 7 17" stroke="COL" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>')


def gloss(term, defn, light):
    arw = ARROW.replace("COL", "#3A5697" if light else "#6E86C9")
    return (f'<div class="gloss">{arw}<div class="glosstxt">'
            f'<b>{term}</b>{defn}</div></div>')


CITE = "Farrugia v The King [2026] HCA 28, High Court of Australia, 12 August 2026"

SLIDES = []

# 1. QUOTE CARD. Navy. Labelled as a dissent on its face.
SLIDES.append(dict(
    kicker="THE QUESTION", light=False, swipe=True, well="well",
    cite="Farrugia v The King [2026] HCA 28, Edelman J at [66]",
    inner=(
        '<div class="pqmark">&ldquo;</div>'
        '<div class="pq">Can counsel represent two offenders in sentencing '
        'where it is open to argue that either offender should receive a more '
        'substantial penalty than the other? &hellip; The simple answer is '
        '&ldquo;no&rdquo;.</div>'
        '<div class="pqa">EDELMAN J, IN DISSENT<br>'
        'The majority of the High Court reached the opposite result.</div>'
    )))

# 2. HEADLINE CARD. Navy. The facts.
SLIDES.append(dict(
    kicker="THE FACTS", light=False, swipe=False, well="well", cite=CITE,
    inner=(
        '<div class="statement md">One barrister. Two co-offenders. '
        '<em>One sentencing hearing.</em></div>'
        '<div class="body"><p>Frank Farrugia and Deniz Kanmaz both pleaded '
        'guilty to conspiring to traffic a commercial quantity of drugs. The '
        'same Senior Counsel appeared for both of them in the District Court '
        'of New South Wales.</p>'
        '<p>There is no rule against it.</p></div>'
        + gloss("CO-OFFENDER",
                "Someone charged over the same criminal enterprise. Courts "
                "sentence them against each other so the punishments make "
                "sense side by side. That comparison is called parity.", False)
    )))

# 3. NUMBER CARD. Cream. The result.
SLIDES.append(dict(
    kicker="THE NUMBERS", light=True, swipe=False, well="well", cite=CITE,
    inner=(
        '<div class="bignum">11</div>'
        '<div class="numlabel">years for Farrugia. <em>Nine for Kanmaz.</em></div>'
        '<div class="numsub">Non parole periods of seven and a half years and '
        'six and a half. The Crown had submitted in writing that it should be '
        'the other way around.</div>'
    )))

# 4. HEADLINE CARD, transcript treatment. Navy. The turn.
SLIDES.append(dict(
    kicker="THE EXCHANGE", light=False, swipe=False, well="well", cite=CITE,
    inner=(
        '<div class="statement md">His own counsel said '
        '<em>the opposite.</em></div>'
        '<div class="tx">'
        '<div><b>His Honour</b>You agree, though, that Mr Kanmaz is more '
        'culpable than Mr Farrugia, don&rsquo;t you?</div>'
        '<div><b>Counsel</b>No, I say the opposite.</div>'
        '</div>'
        '<div class="body"><p>The Crown then conceded he was right.</p></div>'
    )))

# 5. HEADLINE CARD. Navy. The holding + the learning line.
SLIDES.append(dict(
    kicker="THE RULING", light=False, swipe=False, well="well", cite=CITE,
    inner=(
        '<div class="statement md">Appeal <em>dismissed.</em></div>'
        '<div class="body"><p>Farrugia put on no evidence of what he was '
        'advised or what he instructed, and kept <span class="term">legal '
        'professional privilege</span> over it. Without that, the Court held, '
        'no conflict was proved. He carried the onus and did not discharge '
        'it.</p></div>'
        + gloss("LEGAL PROFESSIONAL PRIVILEGE",
                "Your conversations with your lawyer stay confidential and no "
                "court can make you reveal them. Only you can give that up.",
                False)
        + '<div class="learn">Learn this: the party alleging error carries the '
          'onus, so claiming privilege over the very evidence that would prove '
          'the error is a choice with a price.</div>'
    )))

# 6. AIR CARD. Cream. Inverted closer.
SLIDES.append(dict(
    kicker="WHY IT MATTERS", light=True, swipe=False, well="airwell",
    cite=("Farrugia v The King [2026] HCA 28. Appeal dismissed. Edelman J and "
          "Jagot J would have allowed it. Summary only, read the judgment. "
          "General information, not legal advice."),
    inner=(
        '<div class="airline">Had it been proved, it <em>would have '
        'mattered.</em></div>'
        '<div class="airsub">The Court set the test: an irregularity vitiates '
        'a sentence if it could realistically have affected the sentencing '
        'judge&rsquo;s reasoning. This one would have. It just was not '
        'established on the evidence before the Court.</div>'
    )))

body = 'SLUG = "farrugia"\n'
for i, s in enumerate(SLIDES, 1):
    sw = ('<div class="swipe">swipe &rarr;</div>' if s["swipe"]
          else '<div class="mark">LAWGISTICS</div>')
    body += f'''
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{{CSS}}</style></head>
<body class="{'light' if s['light'] else ''}"><div class="grain"></div><div class="page">
  <div class="head"><div class="kicker">{s['kicker']}</div><div class="num">{i:02d} / 06</div></div>
  <div class="{s['well']}">{s['inner']}</div>
  <div class="foot"><div class="cite">{s['cite']}</div>{sw}</div>
</div></body></html>"""
(OUT / "farrugia{i:02d}.html").write_text(html)
'''

gen = BASE / "_gen_farrugia.py"
gen.write_text(head + body + 'print("built", TOTAL)\n')
subprocess.run(["python3", str(gen)], cwd=BASE, check=True)
subprocess.run(["node", "shoot.mjs"] + [f"out/farrugia{i:02d}.html" for i in range(1, 7)],
               cwd=BASE, check=True)
print("done")
