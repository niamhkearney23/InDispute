# ATTICUS — productised AML/CTF for boutique professional firms

Working assets for the AML/CTF compliance product launch ahead of the 1 July 2026 deadline. The product is the same across sectors (program template, risk-assessment workbook, readiness checklist); the marketing surface is ICP-specific. The same engine drives three direct channels and one channel-partnership channel.

## Contents

```
aml/
├── index.html                   # Landing page — law firms
├── accountants.html             # Landing page — accountants
├── real-estate.html             # Landing page — real estate agencies
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
│   ├── big4-partnership-pitch.md        # The pitch / one-pager / draft MoU framing
│   ├── big4-target-map.md               # Roles to target + pathways to find current incumbents
│   ├── big4-outreach-sequence.md        # 3-touch partner-level outreach
│   └── big4-tracker.csv                 # Per-firm partnership tracker
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
# http://localhost:8000/index.html        — law firms
# http://localhost:8000/accountants.html  — accountants
# http://localhost:8000/real-estate.html  — real estate
# http://localhost:8000/checklist.html    — readiness checklist
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
