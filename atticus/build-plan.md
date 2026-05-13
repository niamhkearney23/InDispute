# Atticus — build plan

**Audience:** Niamh (founder) and the first technical hire / contract dev shop.
**Status:** v0.1 draft. Decisions in here are starting positions, not contracts.
**Companion:** see `intake-demo/atticus-intake.html` for the clickable reference of what we're trying to ship.

---

## TL;DR

- **What:** a multi-tenant SaaS that runs the matter-opening workflow for small to mid Australian law firms — practice-area-aware client intake, cost disclosure draft, source-of-funds capture, conflict check, file open.
- **MVP:** firm signup, three practice areas, send-intake-to-client, receive responses, generate cost disclosure draft, basic source-of-funds capture, principal dashboard. **No** PMS integration, **no** AML transaction monitoring, **no** document automation beyond cost disclosure.
- **Stack:** Next.js (TypeScript) + tRPC + Prisma + Postgres + S3, deployed in AWS Sydney via SST. Auth via Clerk (with AU data residency check) or NextAuth on our own DB.
- **Timeline:** 16–18 weeks of focused full-time dev work to a paid pilot. Solo non-technical founder + one senior full-stack contractor is the cheapest realistic shape.
- **First customer:** a friendly mid-size firm Niamh already knows, on a hand-held pilot at a low price, with the explicit deal that they shape the v1 roadmap.

---

## Part 1 — What we're building

### Product scope for MVP (the things that ship)

1. **Firm tenancy** — a firm signs up, gets their own workspace. One firm = one tenant. Users belong to the firm. Roles: principal, lawyer, paralegal.
2. **Matter creation** — lawyer clicks "New matter," picks a practice area, fills client basics, sends an intake link.
3. **Client intake** — public, authed-by-link form, mobile-friendly, multi-step, conditional questions per practice area. Save-and-resume.
4. **Practice areas (launch with three):** family law, conveyancing, commercial. Each with a curated question schema co-designed with a real practitioner in that area.
5. **Universal sections** on every intake: identity, funding & cost, source of funds, comms preferences.
6. **Matter detail** for the lawyer: see all responses grouped by section, with risk flags.
7. **Cost disclosure draft** — Atticus assembles a Legal Profession Uniform Law compliant draft letter from the intake responses, the firm's hourly rates, and the matter's estimated scope. Lawyer reviews, edits, sends from inside Atticus.
8. **Source of funds capture** — structured, with prompts that escalate when needed. Generates a one-page SOF memo for the file.
9. **Conflict check** — basic: searches the firm's existing matters by client name, ABN, related parties. Returns hits for the lawyer to review.
10. **Principal dashboard** — firm-wide visibility on pipeline, lawyer load, flagged matters.
11. **Audit log** — every read, write, send, status change is logged with actor + timestamp. Visible to firm admins.

That's it. Everything below is v1+ and explicitly deferred.

### Explicitly NOT in MVP

- Integration with any practice management system (LEAP, Smokeball, Actionstep). Not yet.
- Generating any document other than the cost disclosure letter and SOF memo.
- Trust accounting, billing, time recording.
- e-Signature integration (DocuSign, Annature). The cost disclosure can go out as a PDF; manual signing.
- ID verification automation (no Equifax / GreenID / Frankie integration yet).
- AML risk scoring, transaction monitoring, SMR generation.
- Multi-firm / referral workflows.
- Native mobile apps. Web responsive only.
- White-label / re-skinning for resellers.
- Conveyancing search ordering, PEXA workspace creation.

These will all be asked for. The discipline is to keep saying "yes, on the roadmap" without building it.

### Open product questions for Niamh to decide before week 4

1. **First state.** Do we launch with the Legal Profession Uniform Law states only (NSW + VIC + WA-from-mid-2022 + a few smaller), or do we cover all states? The cost disclosure template differs by state. Recommendation: start NSW + VIC, document the difference, design the schema to support state-specific rules from day one.
2. **Where the AML/CTF Tranche 2 line is.** From 1 July 2026, "designated services" by lawyers attract AML/CTF obligations. We need to decide whether Atticus is positioned as (a) helping lawyers meet those obligations as part of intake, or (b) plugging into a separate AML-focused workflow. Recommendation: (a), bundled.
3. **Pricing model.** Per-firm flat, per-seat, per-matter? Affects what we instrument from day one.
4. **How firms run their hourly rates today.** We need to ingest hourly rates per lawyer per matter type for the cost disclosure draft to work. Do we collect once at onboarding, or per matter? Recommendation: once at onboarding, override at matter level.

---

## Part 2 — Architecture

### High-level shape

```
                   ┌────────────────────────────────┐
                   │   Client device (browser)      │
                   │   - lawyer/principal portal    │
                   │   - client intake (public)     │
                   └──────────────┬─────────────────┘
                                  │ HTTPS
                                  ▼
                   ┌────────────────────────────────┐
                   │   Next.js app (AWS Sydney)     │
                   │   - server components          │
                   │   - tRPC API routes            │
                   │   - public intake routes       │
                   └──────────────┬─────────────────┘
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       ▼                          ▼                          ▼
┌─────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Postgres   │         │   S3 (Sydney)   │         │  Email (Postmark│
│  (RDS,      │         │   - attachments │         │   or Resend)    │
│  Sydney)    │         │   - PDFs        │         │                 │
└─────────────┘         └─────────────────┘         └─────────────────┘

           ┌────────────────────────────────────────────┐
           │   Background workers (AWS Sydney)          │
           │   - PDF generation                         │
           │   - email send                             │
           │   - flag heuristics                        │
           │   - audit log shipping                     │
           └────────────────────────────────────────────┘
```

### Tech stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **Next.js 15 (TypeScript), App Router** | Largest hireable talent pool in Sydney/Melbourne. Server components fit our render-on-server-of-record model. |
| API layer | **tRPC** | Type-safe end-to-end, no separate API spec, one less thing to maintain at this size. Migrate to REST or GraphQL only if we hit a real reason. |
| ORM | **Prisma** | Type-safe queries, easy migrations. The risk is performance at very large scale, but we're nowhere near that. |
| Database | **Postgres** on AWS RDS, ap-southeast-2 (Sydney) | Most boring, most hireable, multi-tenant via schema column. AU residency. |
| File storage | **AWS S3 ap-southeast-2** | Signed URLs for upload/download. Lifecycle policy for retention. |
| Auth | **Clerk** *with AU data residency* OR **NextAuth on our DB** | Clerk is faster to ship. If AU data residency is not yet ironclad for Clerk at the time of build, switch to NextAuth on our own Postgres so we stay sovereign. |
| Email | **Postmark (preferred) or Resend** | Both have AU IPs. Postmark has the strongest transactional reputation. |
| Background jobs | **Inngest or BullMQ on the same Postgres** | Inngest is simpler operationally; BullMQ if we want zero third parties. |
| PDF generation | **Puppeteer in a worker container** or **react-pdf** for simpler docs | Cost disclosure letter and SOF memo are the only PDFs we generate at MVP. |
| Deployment | **SST (Serverless Stack) on AWS, Sydney region** | Infrastructure-as-code in TypeScript. One stack file describes the whole thing. Easy to hand to a new dev. |
| Observability | **Sentry** (errors) + **Axiom or BetterStack** (logs) | Both can route to AU regions. |
| Analytics | **PostHog** (self-hosted on AU infra) OR **Plausible** | Avoid GA4 in a legal product. Self-hosted PostHog gives session recording for product debugging without data leaving AU. |
| Payments | **Stripe** (Australia) | Stripe Billing for subscriptions. |

### Data sovereignty — the make-or-break

Every prospective firm will ask "where is my data." A wrong answer kills the deal in two minutes. The rule:

- **All client/matter data at rest in Australia.** Postgres in ap-southeast-2. S3 in ap-southeast-2. Backups in ap-southeast-2.
- **Compute in Australia where the data is read.** Next.js server runtime in Sydney. No edge functions reading PII.
- **Email transit may leave AU briefly** (transactional emails via Postmark hit US infra for some inbound). Disclose this in the privacy policy. Mitigation: minimise PII in email bodies, link out to the app.
- **Subprocessor list** is a real document we publish from day one. Stripe (US, IRAP-aligned), Postmark (US, transit only), Sentry (configurable region), Clerk (only if we use it and only if AU region is available).
- **APP 8 (cross-border disclosure) compliance** — we never disclose to overseas recipients without explicit firm consent. Building this in means: any new subprocessor change triggers a firm-admin notification.

### Multi-tenancy

Single-database, shared-schema, with a `firm_id` column on every tenanted table. Enforced at the ORM layer (Prisma middleware) and double-enforced at the database via row-level security policies on Postgres. This is boring but it's the right choice for the first 50–500 firms. Move to schema-per-tenant or DB-per-tenant only when a single enterprise customer requires it.

---

## Part 3 — Data model

Core entities (Prisma-style sketch; not final).

```
Firm
  id, name, abn, jurisdiction, billingPlan, dataResidency, createdAt

FirmMember (a user belonging to a firm)
  id, firmId, userId, role: 'principal' | 'lawyer' | 'paralegal', isActive

User
  id, email, fullName, lastLoginAt
  (one user can be a member of multiple firms — supports lateral hires)

HourlyRate (per-firm, per-lawyer, per-matter-type override-able)
  id, firmId, lawyerUserId?, matterType?, rateAud, gstInclusive, effectiveFrom

Matter
  id, firmId, fileNumber, clientId, matterType, description, responsibleLawyerId,
  status: 'draft' | 'intake-sent' | 'intake-complete' | 'open' | 'closed',
  createdAt, intakeSentAt, intakeCompletedAt, openedAt, closedAt,
  estimatedFeesAud, feeStructure, riskScore?, flags[]

Client
  id, firmId, type: 'individual' | 'entity',
  fullName, preferredName, abn?, acn?,
  email, phone, address,
  dob?, idType?, idVerifiedAt?, idVerifiedBy?

ClientRelatedParty (for conflict-check graph)
  id, clientId, kind: 'spouse' | 'director' | 'beneficial-owner' | 'counterparty',
  name, abn?, dob?, relationship

IntakeForm (the template)
  id, firmId, matterType, version, schemaJson, isActive

IntakeSubmission (the response)
  id, matterId, formId, status, startedAt, completedAt,
  answers: jsonb,
  clientIp?, userAgent?

CostDisclosure
  id, matterId, draftAt, status: 'draft' | 'sent' | 'accepted' | 'declined',
  pdfS3Key?, sentAt, acceptedAt, scopeText, estimatedFees, hourlyRatesSnapshot

SourceOfFundsRecord
  id, matterId, primarySource, detail, supportingDocS3Keys[],
  riskLevel: 'low' | 'medium' | 'high', reviewerUserId?, reviewedAt

ConflictCheck
  id, matterId, runAt, runByUserId, hitsJson, decisionByUserId?, decision?, notes

AuditEvent
  id, firmId, actorUserId?, kind, subjectType, subjectId, payloadJson, createdAt

Subprocessor (firm-visible)
  id, name, purpose, region, lastReviewedAt
```

Notes:

- `answers` as a single `jsonb` column on `IntakeSubmission` keeps the schema simple while we iterate on practice-area question sets. We don't need relational querying across answer fields yet. When we do, we add specific normalised columns for the high-value ones (e.g. `dateOfSeparation`).
- `flags` on `Matter` is an array of enum strings (`sof-review`, `conflict-pending`, `id-not-verified`, `cost-disclosure-overdue`). Trigger conditions live in code, not data.
- `HourlyRate` history matters for cost disclosure defensibility. Never delete; supersede.
- `IntakeForm.version` so we can keep historical submissions tied to the form they were filled against, even after we change the schema.
- `AuditEvent` is append-only. Worth shipping to S3 nightly as immutable archives.

---

## Part 4 — Compliance & security (the legal-specific non-negotiables)

1. **Legal professional privilege survives the platform.** Atticus is processing legal work product. Our terms and architecture must treat all matter content as privileged. Practically: only the firm can read its own data; no Atticus admin can read matter content without firm-issued consent (build a "support access" mode the firm enables per-incident, logged).
2. **Privacy Act 1988 + APPs.** Privacy policy, notifiable data breaches scheme, APP 8 cross-border disclosure. Out-of-the-box for a SaaS, but the legal market scrutinises it harder. Get the policy reviewed by an actual privacy lawyer before any paying customer.
3. **Legal Profession Uniform Law cost disclosure requirements.** Section 174–176 of the LPUL (NSW + VIC currently in scheme). Our cost disclosure draft must include: estimated total legal costs, the basis of charging, the right to negotiate, dispute resolution avenues, the client's right to a bill, interest on overdue accounts. We will lift the canonical clauses from the published Law Society templates and only vary the parts the matter-specific data shapes.
4. **AML/CTF Act 2006 + Tranche 2 (1 July 2026 commencement for lawyers).** SOF capture is the foothold. After 1 July 2026, we will need: customer due diligence record-keeping for 7 years, the ability to surface PEP/sanction screening results, suspicious matter reporting workflow. Not in MVP — but the data model must not paint us into a corner.
5. **Audit log retention.** Minimum 7 years per AML and tax records rules. Append-only `AuditEvent` table, with nightly S3 archive.
6. **Retention & deletion policy.** Need a clear story for client data deletion when a firm churns. Recommendation: firm exports data on offboarding; we retain only what is legally required (audit log + financial records) for 7 years; everything else is deleted within 30 days of churn.
7. **Penetration test.** Before the first paying customer with > 5 lawyers, get a formal pen test. Approx AU$15–25k. Budget for it.
8. **SOC 2 / ISO 27001.** Not for MVP. Becomes a deal-gating item around customer #20 or first firm with > 30 lawyers. Start the controls discipline early (drafty SOC 2 type 1 readiness via Vanta or Drata) so it's not a panic later.

---

## Part 5 — Build sequence

Estimates assume one senior full-stack engineer working 4 days/week plus Niamh 3 days/week on product/practitioner design.

### Milestone 0 — Foundations (weeks 0–2)

- AWS Sydney account, SST scaffold, Postgres RDS, S3 bucket, IAM roles
- Next.js + TypeScript + tRPC + Prisma boilerplate
- Auth (Clerk or NextAuth) wired up, login + signup
- CI/CD via GitHub Actions, staging + prod environments
- Sentry + Axiom wired in
- Multi-tenant scaffolding: Firm model, FirmMember model, RLS policies on Postgres
- Audit log primitive
- Privacy policy and ToS drafts (with a privacy lawyer)

**Demo at end of M0:** a logged-in user can create a firm, invite a colleague, see an empty dashboard. No matters yet. The point of M0 is invisible plumbing.

### Milestone 1 — Thin intake (weeks 2–6)

- `Matter` model, `Client` model, "New matter" wizard
- `IntakeForm` template system with the family-law schema first
- Public client intake route (token-authed link), mobile-responsive
- Save-and-resume on the client form (the client gets a magic link to come back)
- Submit notifies the lawyer by email
- Matter detail view shows the intake responses, grouped
- Status transitions: draft → intake-sent → intake-complete

**Demo at end of M1:** end-to-end, a real lawyer can open a real family-law matter, send a real link to a real test client, the client fills it out, lawyer sees the responses. No cost disclosure or SOF yet.

### Milestone 2 — Practice areas + conflict check (weeks 6–9)

- Add conveyancing and commercial schemas
- Conditional question logic (the `if:` field branching we already prototyped)
- Conflict check service — searches existing clients + related parties by fuzzy name match
- Conflict review UI: lawyer accepts hits or marks clear
- Activity log on each matter

**Demo at end of M2:** principal can run a real conflict check on a new matter against existing firm clients and get a meaningful result.

### Milestone 3 — Cost disclosure + SOF (weeks 9–13)

- Firm onboarding: hourly rate per lawyer per matter type
- Cost disclosure assembly: pull rates + intake responses + firm letterhead → PDF
- Draft review screen: lawyer edits scope, edits estimate, regenerates PDF
- Send cost disclosure by email with read-receipt
- SOF capture + risk heuristics (the `sof-review` flag we prototyped)
- SOF memo PDF for the file

**Demo at end of M3:** lawyer can produce a real cost disclosure draft in under 10 minutes from receipt of intake, and a one-page SOF memo for the file. **This is the moment the product is actually saleable.**

### Milestone 4 — Production-ready (weeks 13–18)

- Principal dashboard (firm-wide pipeline, lawyer load, flagged matters)
- Audit log viewer for firm admins
- Subprocessor list page (firm-visible)
- Support-access mode (firm-toggled, logged)
- Data export (firm self-serve)
- Retention/deletion job for churned firms
- Onboarding flow for new firms (self-serve signup → first matter in under 20 minutes)
- Stripe Billing integration, plan management
- First pen test, fix findings
- One paid pilot firm onboarded and live

**End of M4:** paid pilot live, charging real money.

---

## Part 6 — Integrations

### Build in MVP

- **Email send/receive (Postmark)** — for intake links, cost disclosure delivery, notifications.
- **Stripe Billing** — subscription management.

### Defer, but design the data model to accept

- **PEXA** — conveyancing workspace creation. Realistic v1 add. Their API is approachable.
- **InfoTrack / GlobalX** — title and company searches. v1 add.
- **LEAP / Smokeball / Actionstep PMS export** — "send opened matter to my PMS." Critical for adoption beyond firms that don't yet have a PMS. v1 priority.
- **Equifax IDP / GreenID / Frankie / FrankieOne** — ID verification. v1 priority once Tranche 2 enforcement begins.
- **Xero / MYOB** — for invoice issuance from cost disclosure. v1+ add.
- **e-Signature (Annature, DocuSign)** — cost disclosure acceptance. Likely v1, depends on customer feedback.
- **AUSTRAC reporting** — for Tranche 2 compliance. v2.

### Probably never build

- LawConnect-style document automation. There are better focused products; we partner.
- Trust accounting. Same.
- Time recording. Same.

---

## Part 7 — How to staff this

**Reality check:** Niamh is a non-technical founder. The cheapest realistic path to a paying pilot is:

- **Niamh (founder):** 3 days/week on product, customer development, practitioner design (interviewing real family/conveyancing/commercial lawyers to shape question sets), pricing, sales. Ongoing.
- **One senior full-stack contractor:** 4 days/week for 18 weeks. Looking for someone who has shipped a multi-tenant SaaS before, ideally in a regulated vertical (health, legal, finance). Rate range AU$1,200–1,800/day. Total build cost ~AU$95k–135k.
- **A privacy + commercial lawyer (peer):** 4–6 hours total on terms, privacy policy, subprocessor template. Trade for product credits or pay at mate's rates. Crucial for credibility.
- **A designer:** 2–4 weeks of work, sprinkled across the build, to take the demo's visual language to production quality. AU$8–15k.

**Optional but recommended:** a part-time technical co-founder with equity instead of cash, ideally someone who's previously been a CTO of a vertical SaaS. Easier to find post-pilot than pre.

**Things Niamh does that no developer can do:**

- Design the practice-area schemas (interview practitioners, draft, iterate)
- Build the cost disclosure templates per state (canonical clauses)
- Run the AML/CTF compliance content
- Customer development (5+ interviews/week)
- Pilot firm sales

**Things to never ask a contractor to decide:**

- Pricing
- Which integrations to build
- What the SOF risk heuristic flags

---

## Part 8 — Pricing implications for the build

We don't need final pricing to start, but we need to pick a *shape* because it affects what we instrument from day one.

| Model | Shape | Build implication |
|---|---|---|
| **Per firm flat (recommended for MVP)** | $499–999/month per firm, unlimited users, unlimited matters | Simplest billing. Stripe Billing per firm. No per-seat tracking. **Choose this for pilot.** |
| **Per seat** | $39–79/lawyer/month | Need seat tracking, invitations, seat reclaiming. Adds 2 weeks. |
| **Per matter** | $25/matter | Counter on `Matter.createdAt`, monthly aggregation. Common objection: "I don't want to pay extra to use it more." Avoid. |
| **Freemium** | Free up to 3 matters/month | Tempting but kills the SOF/conflict story. Avoid for legal. |

**Recommendation:** start at per-firm flat with three tiers (Boutique up to 5 lawyers, Practice up to 25, Firm 26+). Revisit after 10 paying customers.

---

## Part 9 — Risks and open questions

### Technical risks

- **Multi-tenancy mistakes** are catastrophic in a legal product (firm A reading firm B's data is a press release, not a bug). Mitigation: row-level security on Postgres + Prisma middleware + integration tests that try to violate it.
- **Email deliverability** for the intake links. If clients don't get the email, the whole product fails. Mitigation: Postmark, SPF/DKIM/DMARC properly set, fallback SMS link via Twilio (cheap to add).
- **PDF generation** at scale is fiddly. Puppeteer in containers can be flaky; budget time for the rough edges.

### Product risks

- **Adoption friction.** Lawyers are conservative. The first 10 firms will need hand-holding onboarding. Plan for that — don't expect self-serve to work for the first 12 months.
- **Schema drift between practice areas.** The intake question sets will get long and bespoke. Mitigation: version the form templates, don't try to be exhaustive.
- **Practitioner sign-off.** Each practice-area schema needs a real practitioner to bless it. Lining up three friendly practitioners (one per area) is on Niamh's critical path.
- **Tranche 2 timing.** If the AML/CTF Tranche 2 commencement slips again (it has slipped before), the SOF urgency story softens. Don't lead with it; lead with cost disclosure and matter intake.

### Business risks

- **LEAP / Smokeball ship a competing intake module.** Plausible. Defence: best-in-class focus on the intake-to-file-open slice, deeper practice-area awareness, and integration *into* their PMS rather than competing with it.
- **Data residency drift.** A future subprocessor change (e.g. Sentry moves a region) leaks data outside AU. Mitigation: subprocessor review on a quarterly cadence; pin regions in IaC.

### Open questions for week 1

- Which three friendly firms will pilot? (Niamh names them.)
- What does Niamh's cost disclosure template currently look like at her own firm? (We're going to reverse-engineer it.)
- What is the LEAP/Smokeball share among Niamh's target ICP? Determines integration priority.
- What's the budget envelope for the 18-week build? Determines whether we contract one engineer or two.

---

## Appendix A — Decisions made implicitly by this plan

(Documented so they can be challenged.)

1. **Australian-built, Australian-hosted, Australian-paid.** Not pursuing international markets in v1.
2. **Web-first, no native mobile.** Mobile responsive is enough until proven otherwise.
3. **Multi-tenant shared-schema Postgres.** Not single-tenant or schema-per-tenant.
4. **AWS Sydney, not GCP or Azure.** Talent pool and AU customer comfort with AWS.
5. **Build, not buy, the intake engine.** It's the core IP. Conversely, we buy auth (Clerk), email (Postmark), payments (Stripe).
6. **Niamh stays the product owner.** No outsourced product management.
7. **Cost disclosure is the wedge feature**, not AML compliance. Tranche 2 is a tailwind, not the lead.

---

## Appendix B — What to do in the first two weeks

1. Validate this plan with two technical advisors (we want them poking holes in the architecture before we hire).
2. Get three friendly firms to verbally agree to a paid pilot in advance of build.
3. Run five practitioner interviews — one family, two conveyancing, two commercial — and capture the questions they ask clients today.
4. Lock the AU privacy + commercial lawyer who'll review terms.
5. Open the AWS Sydney account, set up GitHub org, set up the Postgres staging DB.
6. Hire the engineer.

If those six are done in 14 days, you're on track.
