# ATTICUS — the human compliance layer for AML/CTF

Working assets for an AML/CTF compliance practice positioned as **the human layer above any platform** (outsourced AMLCO, independent reviews, enforcement response) for any firm a platform alone can't serve, **plus sectors no platform serves** (TCSPs, DPMS, gambling, MSB, digital currency, bullion).

**Strategic pivot — May 2026.** Originally positioned as productised programs for boutique professional firms. After InfoTrack launched the free, Grant-Thornton-backed AML/CTF Compliance Centre integrated into PMS, that wedge is occupied. The current strategy is documented in [`competitive-memo.md`](competitive-memo.md). Old artefacts retained for context; some (Tier 4 SaaS) are marked discontinued.

## Contents

```
aml/
├── competitive-memo.md          # Strategic pivot memo (the InfoTrack reality)
├── index.html                   # Home — "the human, not the platform"
├── independent-reviews.html     # Service line — third-party assurance
├── compare.html                 # Public comparison — InfoTrack vs ATTICUS vs DIY (NEW)
├── platform-overflow.html       # Consolidated page for law/accounting/real-estate (NEW)
├── tcsp.html                    # Sector — no platform alternative
├── dpms.html                    # Sector — no platform alternative
├── gambling.html                # Sector — no platform alternative
├── msb.html                     # Sector — no platform alternative
├── crypto.html                  # Sector — no platform alternative
├── bullion.html                 # Sector — no platform alternative
├── checklist.html               # Lead magnet — 12-point readiness checklist (sector-neutral)
├── templates/
│   ├── aml-ctf-program-template.md      # Productised unified program (~30 placeholders)
│   └── risk-assessment-workbook.md      # Annexure A — ML/TF risk assessment
├── outreach/                            # Direct GTM
│   ├── icp-criteria.md                  # ICP — law firms
│   ├── icp-criteria-accountants.md      # ICP — accountants
│   ├── icp-criteria-real-estate.md      # ICP — real estate
│   ├── email-sequence.md                # 4-touch cold email cadence (law-firm baseline)
│   ├── sector-email-variants.md         # Per-sector swaps for the cadence above
│   ├── scoping-call-script.md           # 20-min call script + objection handling
│   └── outreach-tracker.csv             # Per-firm tracking sheet
├── channel/                             # Big 4 partnership GTM
│   ├── big4-pitch.html                  # Polished HTML pitch (printable / PDF)
│   ├── big4-partnership-pitch.md        # Markdown source
│   ├── big4-target-map.md               # Roles to target + pathways to find current incumbents
│   ├── big4-outreach-sequence.md        # 3-touch partner-level outreach
│   ├── big4-tracker.csv                 # Per-firm partnership tracker
│   └── mou-shell.md                     # Fill-in-the-blanks MoU shell (referral / co-investment / hybrid)
├── partner/                             # Co-founder / delivery-partner search
│   ├── partner-pitch.html               # Polished HTML pitch (printable / PDF)
│   ├── partner-pitch.md                 # Markdown source — open offer to AML practitioners
│   ├── partner-personas.md              # Three target personas
│   ├── partner-outreach.md              # Sourcing + 3-touch sequence
│   ├── commercial-structures.md         # Three commercial structures
│   ├── partner-call-script.md           # First-call script + qualification + Q&amp;A
│   └── partner-tracker.csv              # Pipeline tracker
├── software/                            # Partially superseded post-pivot
│   ├── product-strategy.md              # Strategy doc (Phases 2 + 3 deferred / discontinued)
│   ├── template-customiser.html         # Phase 1 working tool — still useful (placeholders → customised .md)
│   ├── portal-mockup.html               # Phase 2 mockup — deferred pending validation
│   └── saas-landing-mockup.html         # Phase 3 mockup — DISCONTINUED (InfoTrack occupies wedge)
└── assets/                              # (reserved for screenshots, logos)
```

## Direct vs channel GTM

| Channel | Volume | Sales cycle | Margin | Validation value |
|---|---|---|---|---|
| Direct (SME) | 50 firms / month | 2–4 weeks | Full | High — feeds product iteration and case studies |
| Big 4 partnership | 4 firms / 6 months | 3–6 months | -10–15% (referral fee) | Medium — distribution lever once direct is proven |

Recommended sequencing: keep direct outreach running while channel conversations are slow-cooked in the background. Each direct-channel close becomes a case study you can use in the next channel partner pitch.

## Run the sites locally

The landing pages and checklist are pure static HTML — no build step. Either open the files directly in a browser, or:

```sh
cd aml
python3 -m http.server 8000
# http://localhost:8000/index.html              — home
# http://localhost:8000/compare.html            — InfoTrack vs ATTICUS vs DIY
# http://localhost:8000/independent-reviews.html
# http://localhost:8000/platform-overflow.html  — law / accounting / real estate
# http://localhost:8000/tcsp.html
# http://localhost:8000/dpms.html
# http://localhost:8000/gambling.html
# http://localhost:8000/msb.html
# http://localhost:8000/crypto.html
# http://localhost:8000/bullion.html
# http://localhost:8000/checklist.html
```

For deployment: drop the contents of `aml/` onto Netlify, Vercel, GitHub Pages, or any static host. Tailwind loads via CDN. Replace `<!-- TODO -->` placeholders (brand name reaffirmation, contact email, phone, founder bio) before going live, and wire the lead-capture forms to your email tool of choice (Formspree, ConvertKit, HubSpot, etc.).

## Customising the program template

The `.md` files are designed to be exported to Word or PDF (Pandoc, Typora, Marked) for client delivery. Find/replace the `{{PLACEHOLDERS}}` listed in **Annexure F** of `templates/aml-ctf-program-template.md` — every placeholder is enumerated so a new firm can be customised in under a working day.

## Direct outreach plan

50 firms per ICP per 4 weeks, 4-touch sequence over 14 days each. Target ≥15% reply rate, ≥5 scoping calls per 50 emails, 5–10 booked engagements before 1 July across all three ICPs.

## Channel partnership plan

Three-touch sequence over 18 days into each Big 4 firm. Aim for one MoU or preferred-partner arrangement within 6 months. Stagger the four firms — don't burn all parallel pipelines at once.

## Disclaimer

All content is general in nature and not legal advice. Recipients must take independent legal and compliance advice on the application of the AML/CTF Act and the Rules to their own circumstances.
