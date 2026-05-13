# Software strategy — service-led, software-augmented

> **⚠ Partially superseded May 2026.** This document was written before InfoTrack's AML/CTF Compliance Centre launched. Phase 3 (Tier 4 self-serve SaaS) is **shelved**: a free, well-distributed, Grant-Thornton-credentialed product now occupies that wedge. Phase 1 (template customiser, internal tool) **still applies** and remains useful. Phase 2 (Tier 3 client portal) is **deferred** pending validation of the new positioning. See `competitive-memo.md` for the full rationale.

> The thesis (as originally written): build the service first (validate, learn, get to revenue). Build software *underneath* the service to compress delivery time and lock in recurring revenue. Productise the software as a self-serve Tier 4 SaaS once it's been hardened by ~12 months of internal use. Don't try to be a pure software business in year one.

---

## Why not pure software now

| Constraint | Implication |
|---|---|
| No AML domain expertise on the team | Can't write a credible product spec; will ship features that look right and fail real-world use |
| Tranche 2 buyers are conservative | Lawyers / accountants / agents buy people, not tools, at this stage |
| Unit economics at SME tier ($99–249/mo) | Need 2–4k customers for a viable SaaS business — 18–30 months of distribution work |
| Crowded enterprise market | Themis, Sumsub, Onfido, ComplyAdvantage, GreenID already exist with years of head start |
| Build cost | $400k–$1.5m of engineering effort to ship a credible MVP from zero |

The market signal is real — there are ~100,000 new reporting entities under Tranche 2 — but the wedge into that market is service. Once service is delivering, software has product-market fit baked in.

---

## Product principles

1. **Don't sell software the law won't accept.** AML/CTF obligations require human judgement (suspicion forming, EDD decisions, AMLCO sign-off). Software replaces process, not judgement. Position the software as a workflow tool, not a compliance product.
2. **Every feature must speed delivery or lock in retention.** No feature exists to demo. If it doesn't reduce delivery time or increase Tier 3 stickiness, it doesn't ship.
3. **Templates remain the IP.** The software customises the templates; it doesn't replace them. The templates stay in version control, evolve with regulator updates, are sold as Tier 1.
4. **Build for the AMLCO, not the partner.** The daily user is the AMLCO (you / your delivery partner / the client's AMLCO). Optimise for their workflow.
5. **Read-only is fine for a long time.** Most of what the AMLCO needs is to *see* the state of the program. Building write workflows for everything is premature.
6. **Operator-first.** Phase 1 is internal tools to make YOU faster. Don't dress that up as a customer product.

---

## 24-month roadmap

### Phase 1 — Internal tooling (months 0–6)

**Goal:** every Tier 2 engagement takes 60% less of your time. You can ship a customised program in 90 minutes instead of a day.

| Module | Description | Why |
|---|---|---|
| **Template customiser** | Web form takes the ~30 placeholder values; renders the unified program, the AMLCO appointment letter, the training pack and the red-flag indicators with the client's details baked in. Outputs `.md` and downloadable `.docx`. | The single largest delivery-time saving |
| **Client profile store** | Per-client JSON file storing the placeholder values, service mix, risk rating, status. Re-render any time without re-entering. | Enables re-customisation cheaply when regulations change |
| **Engagement tracker** | Simple Kanban-style view: lead → scoping → in-build → live → review. | Replaces the CSV trackers |
| **Document export** | Pandoc-based pipeline: any `.md` deliverable rendered to `.docx` and `.pdf` with consistent ATTICUS branding. | Replaces manual styling work |

Build mode: static HTML + JS (no backend). All client data lives in the operator's browser or a single Google Sheet. Zero infrastructure.

### Phase 2 — Tier 3 client portal (months 6–18)

**Goal:** justify the $2,800/mo Tier 3 retainer with a workspace the client AMLCO actually uses weekly. Lock-in via switching cost.

| Module | Description |
|---|---|
| **AMLCO dashboard** | Tile view: open EDD reviews, overdue training, SMR drafts in progress, days-until-board-report. |
| **Client/matter register** | Onboarded clients with risk rating, last-review date, jurisdictional exposure. Filter by status. |
| **CDD workflow** | Step-by-step intake checklist embedded in the AMLCO's matter view. Records what was verified, when, by whom. |
| **Decision log** | Append-only log of every AML/CTF decision (onboarding refusal, EDD trigger, SMR lodgement). Immutable, exportable for audit. |
| **Training register** | Who has completed which training, when, attestation status. Auto-flags overdue. |
| **Board report generator** | One click → quarterly report PDF with the last 90 days of activity, formatted to AUSTRAC expectations. |
| **Document vault** | 7-year retention store with retention tags by document type. |

Build mode: small backend (Next.js + Postgres, or Supabase). Per-client database tenant. Auth via magic links. Hosted, but lightweight.

Build cost estimate: $80–150k of engineering effort (one mid/senior full-stack engineer × 6–9 months, part-time on top of existing work).

### Phase 3 — Tier 4 self-serve SaaS (months 12–24)

**Goal:** capture the bottom of the market — reporting entities too small to pay $9,500 — at $99–249/mo. Funnels in via the readiness checklist.

| Module | Description |
|---|---|
| **Self-serve onboarding** | Sector-aware checklist (already built) becomes the entry funnel. Score &lt; 5 → upsell to service. Score 5+ → SaaS subscription. |
| **Program generator** | Same template customiser as Phase 1, but customer-facing. Generates the program based on sector + service mix answered in onboarding. |
| **Lite CDD &amp; training modules** | The Tier 3 modules, simplified. No human AMLCO; customer is their own AMLCO. |
| **Regulatory update feed** | When the Act / Rules change, all Tier 4 customers get an updated program with a diff and a 1-click adoption. This is the single biggest reason to be on the subscription vs DIY. |
| **AMLCO concierge upsell** | Tier 4 customers can buy 1-hour advisory sessions at $250/hr. Path to upgrade to Tier 3. |

Pricing:
- **Starter** $99/mo · single user · law / accounting / real estate / TCSP / DPMS templates
- **Standard** $249/mo · up to 5 users · CDD workflow · training register · board report
- **Premium** $499/mo · unlimited users · custom branded · API access · priority support

Build mode: extend Phase 2 codebase; multi-tenant. Customer self-onboards via Stripe.

Build cost estimate: $200–400k incremental on top of Phase 2.

---

## Honest dependencies

The plan above assumes:
- You sign the delivery partner. Without them, Phase 1 is fine (you can build it) but Phases 2–3 have no clinical input and ship wrong.
- You have ~$300k of capital available over 24 months (Phase 2/3 engineering, hosting, security review, SOC2 once it matters).
- You're willing to be the operator of the service business while the software is built. You can't be CTO and CEO and sole AML person at once.

If any of these aren't true, stop at Phase 1.

---

## What we are NOT going to build

These come up a lot in AML software discussions. They are intentionally excluded:

| Excluded | Why |
|---|---|
| Sanctions screening / PEP screening | Commodity; integrate ComplyAdvantage / Frankie / GreenID API instead. Don't build our own list. |
| Real-time transaction monitoring | Wrong market — this is an ADI / payments problem, not boutique firms. |
| Identity verification (KYC) | Commodity; integrate. |
| Crypto / blockchain analytics | Different market entirely. |
| Cross-jurisdictional regulatory engine | The Australian Act is hard enough. Wait until we own AU before going overseas. |

---

## Metrics that matter

Don't measure software shipped. Measure:

| Phase | Metric | Target |
|---|---|---|
| 1 | Time to customise a Tier 2 program | Under 90 minutes (from 1 day) |
| 1 | New Tier 2 engagements delivered per month per delivery partner | 8+ (from 4 baseline) |
| 2 | Tier 3 churn (annualised) | &lt; 8% |
| 2 | Tier 3 NPS | &gt; 50 |
| 3 | Tier 4 trial-to-paid conversion | &gt; 12% |
| 3 | Tier 4 ARPA | &gt; $180/mo |
| 3 | CAC payback (Tier 4) | &lt; 14 months |

---

## The honest "if we got this wrong" version

If the service doesn't validate (no paying clients after 6 months of running the playbook), don't build the software. Software won't save a service that nobody wants. Software amplifies what works; it doesn't conjure demand.

The trap most professional-services teams fall into: "Service is hard to scale, so let's pivot to software." This is usually how *two* failing businesses get built — the original service, plus the software they bolted on without enough customer learning. Don't do that.
