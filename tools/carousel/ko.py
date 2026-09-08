#!/usr/bin/env python3
"""The King v Ko [2026] HCA 29. Crown appeal dismissed, 12 August 2026.

Jury directions on the difference between awareness of a risk and intention.
Conviction quashed by the CCA, retrial ordered; the Crown appealed and lost.

DESIGN: cream dominant, navy closer. Card rotation C, B, A, F, A, D.
Slide 4 uses the new SPLIT card, two states of mind stacked against hairlines,
because that contrast is the entire case.

GUARDRAILS
 - Mr Ko's conviction was QUASHED and a RETRIAL ordered. He is not a convicted
   person for the purposes of anything said now. Slides 5 and 6 say so.
 - The drugs never arrived in Australia. They were seized in Canada and an
   inert substance was substituted. That is why the charge was an ATTEMPT.
 - Nothing on the slides asserts what Ko knew or intended. That is exactly the
   question a jury has yet to answer.
"""
import _deck as D

CITE = "The King v Ko [2026] HCA 29, High Court of Australia, 12 August 2026"

S = []

# 1. QUOTE. Cream.
S.append(dict(
    kicker="THE PROBLEM", light=True, swipe=True,
    cite="The King v Ko [2026] HCA 29, Edelman J at [62]",
    inner=(
        '<div class="pqmark">&ldquo;</div>'
        '<div class="pq">On a purely literal reading &hellip; it might have '
        'been suggested that people could be imprisoned for <em>stupidity</em> '
        'in Australia now.</div>'
        '<div class="pqa">EDELMAN J<br>'
        'On how one line in an earlier High Court decision had been read.</div>'
    )))

# 2. NUMBER. Cream.
S.append(dict(
    kicker="THE FACTS", light=True, cite=CITE,
    inner=(
        '<div class="bignum">101</div>'
        '<div class="numlabel">packages, hidden in a <em>commercial dough '
        'mixer.</em></div>'
        '<div class="numsub">About a kilogram each. Canadian authorities found '
        'them before the shipment left Toronto, took them out, put an inert '
        'substance in, and let the mixer sail to Sydney anyway.</div>'
    )))

# 3. HEADLINE. Cream.
S.append(dict(
    kicker="THE CHARGE", light=True, cite=CITE,
    inner=(
        '<div class="statement md">No drugs arrived. So the charge was '
        '<em>an attempt.</em></div>'
        '<div class="body"><p>Mr Ko worked in sales at a freight forwarder. '
        'The prosecution case was that he used what he knew about logistics to '
        'get the consignment through customs and delivered.</p>'
        '<p>He said he was helping a friend.</p></div>'
        + D.gloss("FAULT ELEMENT",
                  "The state of mind the prosecution must prove, on top of the "
                  "act itself. One offence can need different states of mind "
                  "for different parts of it.", True)
    )))

# 4. SPLIT. Cream. The whole case.
S.append(dict(
    kicker="THE DISTINCTION", light=True, cite=CITE,
    inner=(
        '<div class="statement md">Two different <em>states of mind.</em></div>'
        '<div class="split">'
        '<div class="sprow"><div class="splab">Awareness of a risk</div>'
        '<div class="sptxt">There is a real chance there is something in '
        'this box.</div></div>'
        '<div class="sprow"><div class="splab">Intention</div>'
        '<div class="sptxt"><em>Even if</em> there is something in this box, '
        'I am prepared to bring it in.</div></div>'
        '</div>'
        '<div class="spnote">The first one on its own is not enough. The '
        'second one is intention.</div>'
    )))

# 5. HEADLINE. Cream. The ruling.
S.append(dict(
    kicker="THE RULING", light=True, cite=CITE,
    inner=(
        '<div class="statement md">Conviction quashed. <em>Retrial '
        'ordered.</em></div>'
        '<div class="body"><p>The jury was told that if it found Mr Ko saw a '
        'real chance of a substance in the mixer, it was open to infer he '
        'intended to import it. It was never told it still had to go on and '
        'decide whether he actually meant to. That gap was a '
        '<span class="term">miscarriage of justice</span>.</p>'
        '<p>The Crown appealed. Five judges to two, it lost.</p></div>'
        + D.gloss("MISCARRIAGE OF JUSTICE",
                  "Something went wrong in the trial that could realistically "
                  "have changed how the jury reasoned. Not proof the verdict "
                  "was wrong, proof the process was.", True)
        + '<div class="learn">Learn this: foresight of a risk and intention '
          'are different states of mind, and a direction that lets a jury '
          'slide from one to the other is a miscarriage.</div>'
    )))

# 6. AIR. Navy closer.
S.append(dict(
    kicker="WHY IT MATTERS", light=False, air=True,
    cite=("The King v Ko [2026] HCA 29. Appeal dismissed. The conviction is "
          "quashed and a new trial has been ordered, so nothing has been "
          "decided against Mr Ko. Summary only, read the judgment. General "
          "information, not legal advice."),
    inner=(
        '<div class="airline">Suspicion is not <em>a state of guilt.</em></div>'
        '<div class="airsub">Awareness of a risk is a different state of mind '
        'from intention. The line matters most for the person who was careless '
        'rather than criminal, which is precisely the person a loose direction '
        'convicts.</div>'
    )))

D.build("ko", S)
