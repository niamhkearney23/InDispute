#!/usr/bin/env python3
"""THE BIG CASE FILE, Friday 28 August 2026.

ASIC v Latitude Finance Australia Pty Ltd and Harvey Norman Holdings Ltd.
Federal Court penalty judgment 28 July 2026: $35m against Harvey Norman,
$20m against Latitude, for a national "60 months interest free, no deposit"
advertising campaign that did not disclose the credit card, the establishment
fee or the monthly account service fees.

COMMERCIAL, per Niamh's 27 Aug 2026 preference. Consumer credit, financial
services advertising, ASIC Act ss 12DA, 12DB and 12DF. Pop culture adjacent
because every Australian has seen the ad.

DESIGN: navy dominant, cream ladder and cream closer.
Rotation A, B, F, G, A, D.

GUARDRAILS
 - ASIC's "highest penalty" line is the REGULATOR'S OWN CHARACTERISATION of
   its own result. Under the confirmed-only rule, attributed superlatives from
   interested parties do not go on slides or in captions. Kit only.
 - There is a separate class action on foot. It is nowhere in this post and
   must stay out of any reply.
 - One outlier outlet reported an $85m figure. It is wrong. $35m + $20m.
"""
import _deck as D

CITE = ("ASIC v Latitude Finance Australia and Harvey Norman Holdings, "
        "Federal Court of Australia, penalties 28 July 2026")

S = []

# 1. HOOK. A headline. Navy.
S.append(dict(
    kicker="THE BIG CASE FILE", light=False, swipe=True, cite=CITE,
    inner=(
        '<div class="statement lg">You have seen this ad. '
        '<em>It cost them $55 million.</em></div>'
        '<div class="body"><p>Sixty months interest free. No deposit. It ran '
        'in newspapers, on radio and on television, thousands of times, for '
        'nineteen months.</p></div>'
    )))

# 2. NUMBER. Navy.
S.append(dict(
    kicker="THE CATCH", light=False, cite=CITE,
    inner=(
        '<div class="bignum">$537</div>'
        '<div class="numlabel">in fees. On the <em>interest free</em> '
        'deal.</div>'
        '<div class="numsub">At least that much, for a customer who signed up '
        'in the relevant window, bought on the sixty month plan and paid it '
        'off over sixty months.</div>'
    )))

# 3. SPLIT. Navy. The heart of it.
S.append(dict(
    kicker="THE ISSUE", light=False, cite=CITE,
    inner=(
        '<div class="statement md">The problem was not '
        '<em>what it said.</em></div>'
        '<div class="split">'
        '<div class="sprow"><div class="splab">What the ads promoted</div>'
        '<div class="sptxt">Sixty equal monthly repayments. No deposit. No '
        'interest.</div></div>'
        '<div class="sprow"><div class="splab">What they did not disclose</div>'
        '<div class="sptxt">That you had to take out a <em>credit card</em>, '
        'and pay an establishment fee and monthly account service '
        'fees.</div></div>'
        '</div>'
    )))

# 4. LADDER. Cream. The four year fight.
S.append(dict(
    kicker="THE FIGHT", light=True, cite=CITE,
    inner=(
        '<div class="statement md">Four years. <em>Every step lost.</em></div>'
        '<div class="ladder">'
        '<div class="rung"><div class="rungn">1</div><div class="rungt">'
        '2022. ASIC sues both companies in the Federal Court.</div></div>'
        '<div class="rung"><div class="rungn">2</div><div class="rungt">'
        'October 2024. Yates J finds misleading conduct and false or '
        'misleading representations.</div></div>'
        '<div class="rung on"><div class="rungn">3</div><div class="rungt">'
        'August 2025. Both seek leave to appeal. The Full Court grants leave, '
        'then dismisses the appeals.<i>Called unmeritorious</i></div></div>'
        '<div class="rung"><div class="rungn">4</div><div class="rungt">'
        'July 2026. Penalties handed down.</div></div>'
        '</div>'
        '<div class="laddernote">The Full Court said it was regrettable that '
        'the final determination of remedies had been delayed by the '
        'applications.</div>'
    )))

# 5. THE RULING. A headline. Navy.
S.append(dict(
    kicker="THE PENALTY", light=False, cite=CITE,
    inner=(
        '<div class="statement md">$35 million and <em>$20 million.</em></div>'
        '<div class="body"><p>Harvey Norman and Latitude. Both were also '
        'ordered to run <span class="term">corrective advertising</span> on '
        'their website home pages for ninety days.</p>'
        '<p>Harvey Norman’s share was increased because of statements by '
        'its chair, which the Court said showed a disregard for the potential '
        'harm to consumers.</p></div>'
        + D.gloss("CORRECTIVE ADVERTISING",
                  "A court order to publish a correction where the audience "
                  "will actually see it, so the people misled find out. It is "
                  "a remedy, not an extra punishment.")
        + '<div class="learn">Learn this: a claim can be true line by line and '
          'still mislead, because what you leave out is part of what you '
          'said.</div>'
    )))

# 6. CLOSER. D air. Cream.
S.append(dict(
    kicker="WHY IT MATTERS", light=True, air=True,
    cite=("ASIC v Latitude Finance Australia and Harvey Norman Holdings. "
          "Penalties 28 July 2026. Liability found October 2024, appeals "
          "dismissed September 2025. Summary only, read the judgments. "
          "General information, not legal advice."),
    inner=(
        '<div class="airline">Interest free was <em>true.</em> Free was '
        'not.</div>'
        '<div class="airsub">Every part of the offer was accurate on its own. '
        'The impression the campaign left was not, and that is the thing the '
        'ASIC Act actually prohibits.</div>'
    )))

D.build("hvn", S)
