# InDispute AML — productised AML/CTF for boutique Melbourne law firms

Working assets for the AML/CTF compliance product launch ahead of the 1 July 2026 deadline.

## Contents

```
aml/
├── index.html                 # Landing page (static HTML + Tailwind via CDN)
├── checklist.html             # Lead magnet — 12-point readiness checklist (interactive)
├── templates/
│   ├── aml-ctf-program-template.md      # Productised unified program (~30 placeholders)
│   └── risk-assessment-workbook.md      # Annexure A — ML/TF risk assessment
├── outreach/
│   ├── icp-criteria.md                  # ICP filters and source list approach
│   ├── email-sequence.md                # 4-touch cold email cadence
│   ├── scoping-call-script.md           # 20-min call script + objection handling
│   └── outreach-tracker.csv             # Per-firm tracking sheet
└── assets/                              # (reserved for screenshots, logos)
```

## Run the site locally

The landing page and checklist are pure static HTML — no build step. Either open the files directly in a browser, or:

```sh
cd aml
python3 -m http.server 8000
# then visit http://localhost:8000/
```

For deployment: drop the contents of `aml/` onto Netlify, Vercel, GitHub Pages, or any static host. Tailwind loads via CDN. Replace `<!-- TODO -->` placeholders (brand name, contact email, phone) before going live, and wire the lead-capture form on `index.html` to your email tool of choice (e.g. Formspree, ConvertKit, HubSpot).

## Customising the program template

The `.md` files are designed to be exported to Word or PDF (Pandoc, Typora, Marked) for client delivery. Find/replace the `{{PLACEHOLDERS}}` listed in **Annexure F** of the program template — every placeholder is enumerated so a new firm can be customised in under a working day.

## Outreach plan

50 firms in 4 weeks, 4-touch sequence over 14 days each. Target ≥15% reply rate, ≥5 scoping calls per 50 emails, 5–10 booked engagements before 1 July.

## Disclaimer

All content is general in nature and not legal advice. Recipients must take independent legal and compliance advice on the application of the AML/CTF Act and the Rules to their own circumstances.
