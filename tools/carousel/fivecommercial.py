#!/usr/bin/env python3
"""Five commercial cases every law student should know.

STUDENT post, COMMERCIAL subject matter, evergreen. No dates, no outcomes
that can go stale, no living parties. The five are canon: they are in every
Australian contract and corporations course and none of them is controversial.

Chosen deliberately over another fresh judgment: the queue already holds a lot
of READY case analysis, and the grid says student content outperforms it.

DESIGN: cream dominant. New ENTRY card, one per case: case name with the v in
accent, the court and year, the holding, and a line on what it is still cited
for. Cases alternate cream and navy so the deck has rhythm.
Rotation A, E, E, E, E, E, D, with the entries alternating tone.
"""
import _deck as D

EXTRA_NOTE = "Foundational authorities. General information, not legal advice."

S = []


def entry(name_html, court, holding, still, light):
    return dict(
        kicker="THE CANON", light=light, cite=court + ". " + EXTRA_NOTE,
        inner=(
            f'<div class="statement md">{name_html}</div>'
            f'<div class="body"><p>{holding}</p></div>'
            f'<div class="learn">Still cited for: {still}</div>'
        ))


V = '<span style="color:#6E86C9;font-style:italic;">v</span>'
VL = '<span style="color:#3A5697;font-style:italic;">v</span>'

# 1. COVER
S.append(dict(
    kicker="COMMERCIAL LAW", light=True, swipe=True,
    cite="Five foundational authorities. General information, not legal advice.",
    inner=(
        '<div class="statement lg">Five commercial cases <em>you will be '
        'expected to know.</em></div>'
        '<div class="body"><p>Not the most recent. The ones that keep turning '
        'up, in exams and in practice, a century after they were '
        'decided.</p></div>'
    )))

# 2. Salomon. Navy.
S.append(entry(
    f'Salomon {V} A Salomon &amp; Co Ltd',
    "Salomon v A Salomon &amp; Co Ltd [1897] AC 22, House of Lords",
    'A company is a legal person separate from the people who own it. Mr '
    'Salomon incorporated his boot business, took security over it, and when '
    'it failed his creditors argued the company was really just him. The '
    'House of Lords said no. The company was a distinct person, and its debts '
    'were its own.',
    'the corporate veil, and every argument about when a court will pierce it.',
    False))

# 3. Carlill. Cream.
S.append(entry(
    f'Carlill {VL} Carbolic Smoke Ball Co',
    "Carlill v Carbolic Smoke Ball Co [1893] 1 QB 256, Court of Appeal",
    'A company advertised that its smoke ball prevented influenza and offered '
    '£100 to anyone who used it and got sick anyway. It said it had deposited '
    '£1,000 at a bank to show it meant it. Mrs Carlill used the ball, caught '
    'influenza, and sued.',
    'an offer made to the world at large, accepted by performance, with no '
    'need to communicate acceptance first.',
    True))

# 4. Masters v Cameron. Navy.
S.append(entry(
    f'Masters {V} Cameron',
    "Masters v Cameron (1954) 91 CLR 353, High Court of Australia",
    'People agree on terms and then write "subject to contract". Are they '
    'bound? The Court set out three categories: bound immediately, bound but '
    'intending to restate it formally, or not bound at all until the formal '
    'document is signed.',
    'every dispute about whether a signed heads of agreement is already a '
    'contract.',
    False))

# 5. Waltons Stores. Cream.
S.append(entry(
    f'Waltons Stores {VL} Maher',
    "Waltons Stores (Interstate) Ltd v Maher (1988) 164 CLR 387, High Court",
    'The Mahers demolished a building and began construction on the strength '
    'of a lease that Waltons had not signed and then went quiet on. There was '
    'no contract. The High Court held Waltons was estopped from denying one '
    'anyway.',
    'promissory estoppel as a sword, not just a shield, and unconscionability '
    'in standing by while someone else acts.',
    True))

# 6. Codelfa. Navy.
S.append(entry(
    f'Codelfa {V} State Rail Authority',
    "Codelfa Construction Pty Ltd v State Rail Authority of NSW (1982) 149 CLR 337",
    'A tunnelling contractor priced its work on the shared assumption it could '
    'run three shifts a day. An injunction stopped night work. The contract '
    'said nothing about it.',
    'when you may look outside the words of a contract to construe it, and it '
    'is the case Australian courts still argue about most.',
    False))

# 7. CLOSER. Cream.
S.append(dict(
    kicker="WHY THESE FIVE", light=True, air=True,
    cite=("Salomon [1897] AC 22. Carlill [1893] 1 QB 256. Masters v Cameron "
          "(1954) 91 CLR 353. Waltons Stores (1988) 164 CLR 387. Codelfa "
          "(1982) 149 CLR 337. General information, not legal advice."),
    inner=(
        '<div class="airline">Old cases are not <em>history.</em></div>'
        '<div class="airsub">Every one of these is doing work in a commercial '
        'dispute somewhere in Australia this week. That is why they are '
        'examinable, and it is why knowing them cold is worth more than '
        'knowing last month’s judgment.</div>'
    )))

D.build("fivecomm", S)
