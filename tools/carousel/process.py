#!/usr/bin/env python3
"""Three High Court appeals, every one decided on process.

A STUDENT post, not a case post. It reuses Farrugia [2026] HCA 28,
Ko [2026] HCA 29 and Plaintiff S32/2026 [2026] HCA 27, all three of which are
already built and verified, and turns them into one argument: substantive law
tells you who should win, procedure and evidence decide who does.

Every fact here is already carried in the three POSTING-KIT.md verification
tables. Nothing new is asserted.

DESIGN: cream dominant. Slides 2 to 4 deliberately repeat the SPLIT card,
because the parallel structure IS the argument, but alternate cream, navy,
cream so the deck still has rhythm. Slides 1, 5 and 6 are all different.
"""
import _deck as D

S = []

# 1. HOOK. A headline. Cream.
S.append(dict(
    kicker="THE PATTERN", light=True, swipe=True,
    cite="Three High Court of Australia appeals, August 2026",
    inner=(
        '<div class="statement lg">Three High Court appeals. '
        '<em>Every one turned on process.</em></div>'
        '<div class="body"><p>Not on who was right. On what was filed, what '
        'was said out loud, and which door they walked in.</p></div>'
    )))

# 2. SPLIT, Farrugia. Cream.
S.append(dict(
    kicker="ONE", light=True,
    cite="Farrugia v The King [2026] HCA 28. Appeal dismissed.",
    inner=(
        '<div class="statement md">Farrugia <em>v</em> The King</div>'
        '<div class="split">'
        '<div class="sprow"><div class="splab">What it looked like</div>'
        '<div class="sptxt">Whether one barrister can act for two '
        'co-offenders at the same sentencing.</div></div>'
        '<div class="sprow"><div class="splab">What decided it</div>'
        '<div class="sptxt">He filed <em>no evidence</em> of what he was '
        'advised, or what he instructed.</div></div>'
        '</div>'
    )))

# 3. SPLIT, Ko. Navy.
S.append(dict(
    kicker="TWO", light=False,
    cite="The King v Ko [2026] HCA 29. Conviction quashed, retrial ordered.",
    inner=(
        '<div class="statement md">The King <em>v</em> Ko</div>'
        '<div class="split">'
        '<div class="sprow"><div class="splab">What it looked like</div>'
        '<div class="sptxt">Whether he meant to import 101 packages hidden '
        'in a dough mixer.</div></div>'
        '<div class="sprow"><div class="splab">What decided it</div>'
        '<div class="sptxt">One sentence a judge <em>did not say</em> to the '
        'jury.</div></div>'
        '</div>'
    )))

# 4. SPLIT, S32. Cream.
S.append(dict(
    kicker="THREE", light=True,
    cite=("Plaintiff S32/2026 v Minister for Immigration and Citizenship "
          "[2026] HCA 27. Dismissed with costs."),
    inner=(
        '<div class="statement md">Plaintiff S32/2026 <em>v</em> Minister</div>'
        '<div class="split">'
        '<div class="sprow"><div class="splab">What it looked like</div>'
        '<div class="sptxt">Whether he would be safe if he were returned to '
        'Nepal.</div></div>'
        '<div class="sprow"><div class="splab">What decided it</div>'
        '<div class="sptxt">Which court he walked into <em>first.</em></div>'
        '</div></div>'
    )))

# 5. THE LESSON. A headline + learn. Cream.
S.append(dict(
    kicker="THE LESSON", light=True,
    cite="Farrugia [2026] HCA 28, Ko [2026] HCA 29, Plaintiff S32/2026 [2026] HCA 27",
    inner=(
        '<div class="statement md">Law school grades you on the law. '
        '<em>Courts decide on the record.</em></div>'
        '<div class="body"><p>Evidence and procedure get taught as the dry '
        'subjects, the ones you get through. They are where all three of '
        'these were actually won and lost.</p></div>'
        + '<div class="learn">Learn this: substantive law tells you who ought '
          'to win, and procedure and evidence decide who does.</div>'
    )))

# 6. CLOSER. D air. Navy.
S.append(dict(
    kicker="WHY IT MATTERS", light=False, air=True,
    cite=("Summaries only, read the judgments before relying on them. "
          "General information, not legal advice."),
    inner=(
        '<div class="airline">Procedure is not <em>the boring '
        'subject.</em></div>'
        '<div class="airsub">It is the one that decided all three. Every case '
        'above had a version where the other side wins, and none of those '
        'versions turn on knowing more law.</div>'
    )))

D.build("process", S)
