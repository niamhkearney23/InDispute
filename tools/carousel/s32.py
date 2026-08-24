#!/usr/bin/env python3
"""Plaintiff S32/2026 v Minister for Immigration and Citizenship [2026] HCA 27.
Application dismissed with costs, 5 August 2026. Gordon, Steward, Beech-Jones JJ.

Abuse of process. The plaintiff went straight to the High Court for
constitutional writs instead of seeking judicial review of the Tribunal's
confirmation decision in the FCFCA.

DESIGN: navy dominant, cream closer. Card rotation C, A, G, B, A, D.
Slide 3 uses the new LADDER card, the review hierarchy as rungs with the
skipped one marked, because the shape of the hierarchy IS the holding.

GUARDRAILS
 - The plaintiff is under a court pseudonym. Use it and nothing else.
 - His convictions are stated because the judgment states them at [1]. No
   characterisation beyond the judgment's own words, in the slides or in
   any reply.
 - The delegate FOUND he would suffer significant harm. The refusal turned on
   whether Nepal could protect him. Do not flatten that into "claim rejected".
"""
import _deck as D

CITE = ("Plaintiff S32/2026 v Minister for Immigration and Citizenship "
        "[2026] HCA 27, 5 August 2026")

S = []

# 1. QUOTE. Navy.
S.append(dict(
    kicker="THE HOLDING", light=False, swipe=True,
    cite="Plaintiff S32/2026 v Minister [2026] HCA 27 at [20]",
    inner=(
        '<div class="pqmark">&ldquo;</div>'
        '<div class="pq">The plaintiff should not be permitted to '
        '<em>circumvent the hierarchy of review</em> provided for by the '
        'Migration Act.</div>'
        '<div class="pqa">GORDON, STEWARD AND BEECH-JONES JJ<br>'
        'Application dismissed with costs.</div>'
    )))

# 2. HEADLINE. Navy.
S.append(dict(
    kicker="THE FACTS", light=False, cite=CITE,
    inner=(
        '<div class="statement md">He went straight to <em>the High '
        'Court.</em></div>'
        '<div class="body"><p>A protection visa was refused. The Tribunal '
        'threw out his review because he did not turn up, and refused to '
        'reinstate it. Then a removal date was set.</p>'
        '<p>Days out, he applied to the High Court for '
        '<span class="term">constitutional writs</span>.</p></div>'
        + D.gloss("CONSTITUTIONAL WRITS",
                  "Orders under section 75(v) of the Constitution, telling a "
                  "Commonwealth officer to stop, or to go back and decide "
                  "properly. The High Court's power to grant them cannot be "
                  "taken away by Parliament.")
    )))

# 3. LADDER. Navy. The shape of the case.
S.append(dict(
    kicker="THE LADDER", light=False, cite=CITE,
    inner=(
        '<div class="statement md">There was a rung <em>he skipped.</em></div>'
        '<div class="ladder">'
        '<div class="rung"><div class="rungn">1</div><div class="rungt">'
        'A delegate refuses the visa.</div></div>'
        '<div class="rung"><div class="rungn">2</div><div class="rungt">'
        'The Tribunal reviews it on the merits. Dismissed, he did not '
        'appear.</div></div>'
        '<div class="rung on"><div class="rungn">3</div><div class="rungt">'
        'The Federal Circuit and Family Court reviews the Tribunal.'
        '<i>Never asked</i></div></div>'
        '<div class="rung"><div class="rungn">4</div><div class="rungt">'
        'The Federal Court, then the High Court by special leave.</div></div>'
        '</div>'
        '<div class="laddernote">Win at rung three and the Tribunal has to '
        'hear the merits again. He asked rung four instead.</div>'
    )))

# 4. NUMBER. Cream.
S.append(dict(
    kicker="THE CLOCK", light=True, cite=CITE,
    inner=(
        '<div class="bignum">35</div>'
        '<div class="numlabel">days. That was <em>the window.</em></div>'
        '<div class="numsub">He missed it and needed an extension. The Court '
        'weighs the length of the delay, the reasons for it, and whether the '
        'case has any merit. Here it refused.</div>'
    )))

# 5. HEADLINE. Navy. Ruling + learn.
S.append(dict(
    kicker="THE RULING", light=False, cite=CITE,
    inner=(
        '<div class="statement md">Abuse of <em>process.</em></div>'
        '<div class="body"><p>Not because any step was forbidden. Because '
        'going over the top of a review path that was still open to him was '
        'an attempt to get around the scheme Parliament built.</p>'
        '<p>The Court added that there was no '
        '<span class="term">jurisdictional error</span> anyway.</p></div>'
        + D.gloss("JURISDICTIONAL ERROR",
                  "A mistake so fundamental that the decision maker never had "
                  "power to make the decision at all. Being wrong is not "
                  "enough. It has to be that kind of wrong.")
        + '<div class="learn">Learn this: a right of review you did not use is '
          'still a right of review, and stepping over it is an abuse of '
          'process rather than a shortcut.</div>'
    )))

# 6. AIR. Cream closer.
S.append(dict(
    kicker="WHY IT MATTERS", light=True, air=True,
    cite=("Plaintiff S32/2026 v Minister for Immigration and Citizenship "
          "[2026] HCA 27. Application dismissed with costs. Summary only, "
          "read the judgment. General information, not legal advice."),
    inner=(
        '<div class="airline">The order of the steps <em>is the '
        'law.</em></div>'
        '<div class="airsub">Every administrative law course teaches the '
        'hierarchy as background. This is the case where the hierarchy was the '
        'answer, and urgency did not excuse skipping it.</div>'
    )))

D.build("s32", S)
