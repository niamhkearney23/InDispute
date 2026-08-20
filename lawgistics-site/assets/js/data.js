/* ==========================================================================
   Lawgistics, seed data
   Shared by the public site and the admin CMS. Replace via the admin or swap
   this module for an API call.

   Demo data: users, media, categories, templates, insights, reviews,
   submissions, drafts. Names and emails in those collections are invented.

   REAL data, do not treat as demo: `cases` and `books`. Every entry was
   checked against independent published sources on 10 Aug 2026. Corrections
   made in that pass are recorded against the entries themselves. Anything
   added here in future must be sourced the same way before it goes live.
   ========================================================================== */

window.LG_SEED = {

  /* ------------------------------------------------------------- users -- */
  users: [
    { id: 'u1', email: 'admin@lawgistics.my', name: 'Admin', role: 'admin', password: 'lawgistics', createdAt: '2024-09-01' },
    { id: 'u2', email: 'editor@lawgistics.my', name: 'Content Editor', role: 'editor', password: 'lawgistics', createdAt: '2024-10-12' },
    { id: 'u3', email: 'aisyah.rahman@example.com', name: 'Aisyah Rahman', role: 'customer', password: 'demo1234', createdAt: '2025-01-08' },
    { id: 'u4', email: 'wei.tan@example.com', name: 'Wei Tan', role: 'customer', password: 'demo1234', createdAt: '2025-01-22' },
    { id: 'u5', email: 'r.kumar@example.com', name: 'Ravi Kumar', role: 'customer', password: 'demo1234', createdAt: '2025-02-03' },
    { id: 'u6', email: 'siti.hasnah@example.com', name: 'Siti Hasnah', role: 'customer', password: 'demo1234', createdAt: '2025-02-14' },
    { id: 'u7', email: 'j.lim@example.com', name: 'Jocelyn Lim', role: 'customer', password: 'demo1234', createdAt: '2025-02-27' }
  ],

  /* ------------------------------------------------------------- media -- */
  media: [
    { id: 'm1', filename: 'hero-contract.jpg', alt: 'Employment contract on a desk', mimeType: 'image/jpeg', filesize: '284 KB', width: 1600, height: 1067, createdAt: '2024-11-02' },
    { id: 'm2', filename: 'lawgistics-wordmark.svg', alt: 'Lawgistics wordmark', mimeType: 'image/svg+xml', filesize: '4 KB', width: 900, height: 240, createdAt: '2024-09-04' },
    { id: 'm3', filename: 'insight-nda-cover.jpg', alt: 'Two people signing an NDA', mimeType: 'image/jpeg', filesize: '196 KB', width: 1200, height: 800, createdAt: '2025-01-18' },
    { id: 'm4', filename: 'team-office-kl.jpg', alt: 'Kuala Lumpur office', mimeType: 'image/jpeg', filesize: '412 KB', width: 1800, height: 1200, createdAt: '2024-12-09' }
  ],

  /* -------------------------------------------------- template categories -- */
  categories: [
    { id: 'c1', name: 'Employment & HR', slug: 'employment-hr', description: 'Offer letters, employment contracts, and workplace policies compliant with the Employment Act 1955.', order: 1 },
    { id: 'c2', name: 'Contracts & Agreements', slug: 'contracts-agreements', description: 'Service agreements, partnerships, MOUs, and NDAs under the Contracts Act 1950.', order: 2 },
    { id: 'c3', name: 'Corporate & Shareholding', slug: 'corporate-shareholding', description: 'Shareholders’ agreements, board resolutions, and constitutions under the Companies Act 2016.', order: 3 },
    { id: 'c4', name: 'Property & Tenancy', slug: 'property-tenancy', description: 'Tenancy agreements, letters of offer, and sale-and-purchase documentation.', order: 4 },
    { id: 'c5', name: 'Debt Recovery', slug: 'debt-recovery', description: 'Letters of demand, payment plans, and settlement agreements.', order: 5 },
    { id: 'c6', name: 'Digital & E-commerce', slug: 'digital-ecommerce', description: 'Website terms, PDPA privacy notices, and platform agreements.', order: 6 }
  ],

  /* --------------------------------------------------------- templates -- */
  templates: [
    { id: 't1', title: 'Employment Contract', slug: 'employment-contract', category: 'c1', price: 149, status: 'published', questions: 14, turnaround: '10 minutes',
      summary: 'A full-term employment contract covering probation, notice periods, restraint of trade, and statutory deductions under the Employment Act 1955.', downloads: 312 },
    { id: 't2', title: 'Offer Letter', slug: 'offer-letter', category: 'c1', price: 149, status: 'published', questions: 9, turnaround: '5 minutes',
      summary: 'A conditional offer of employment setting out role, remuneration, start date, and acceptance terms.', downloads: 188 },
    { id: 't3', title: 'Non-Disclosure Agreement (Mutual)', slug: 'nda-mutual', category: 'c2', price: 149, status: 'published', questions: 8, turnaround: '5 minutes',
      summary: 'A two-way confidentiality agreement for partnership discussions, due diligence, and vendor onboarding.', downloads: 401 },
    { id: 't4', title: 'Non-Disclosure Agreement (One-Way)', slug: 'nda-one-way', category: 'c2', price: 149, status: 'published', questions: 7, turnaround: '5 minutes',
      summary: 'Protects information you disclose to a contractor, employee, or prospective investor.', downloads: 265 },
    { id: 't5', title: 'Service Agreement', slug: 'service-agreement', category: 'c2', price: 149, status: 'published', questions: 16, turnaround: '12 minutes',
      summary: 'Scope of work, payment terms, IP ownership, termination rights, and liability caps for Malaysian service providers.', downloads: 356 },
    { id: 't6', title: 'Memorandum of Understanding', slug: 'mou', category: 'c2', price: 149, status: 'published', questions: 10, turnaround: '8 minutes',
      summary: 'Records the commercial intent of a proposed collaboration before definitive agreements are signed.', downloads: 121 },
    { id: 't7', title: 'Shareholders’ Agreement', slug: 'shareholders-agreement', category: 'c3', price: 149, status: 'published', questions: 22, turnaround: '20 minutes',
      summary: 'Share transfers, drag and tag rights, reserved matters, and deadlock resolution under the Companies Act 2016.', downloads: 143 },
    { id: 't8', title: 'Board Resolution', slug: 'board-resolution', category: 'c3', price: 149, status: 'published', questions: 6, turnaround: '4 minutes',
      summary: 'A directors’ circular resolution for banking mandates, appointments, and material approvals.', downloads: 97 },
    { id: 't9', title: 'Tenancy Agreement', slug: 'tenancy-agreement', category: 'c4', price: 149, status: 'published', questions: 15, turnaround: '10 minutes',
      summary: 'Residential or commercial tenancy with deposit, renewal, and repair obligations set out clearly.', downloads: 274 },
    { id: 't10', title: 'Letter of Demand', slug: 'letter-of-demand', category: 'c5', price: 149, status: 'published', questions: 8, turnaround: '6 minutes',
      summary: 'A formal pre-litigation demand for payment, drafted to be effective and to preserve your position.', downloads: 219 },
    { id: 't11', title: 'Settlement Agreement', slug: 'settlement-agreement', category: 'c5', price: 149, status: 'published', questions: 11, turnaround: '9 minutes',
      summary: 'Full and final settlement of a commercial dispute, with release, confidentiality, and payment schedule.', downloads: 88 },
    { id: 't12', title: 'Website Terms & Conditions', slug: 'website-terms', category: 'c6', price: 149, status: 'published', questions: 12, turnaround: '8 minutes',
      summary: 'Terms of use for a Malaysian business website, including limitation of liability and governing law.', downloads: 167 },
    { id: 't13', title: 'PDPA Privacy Notice', slug: 'pdpa-privacy-notice', category: 'c6', price: 149, status: 'published', questions: 10, turnaround: '7 minutes',
      summary: 'A Personal Data Protection Act 2010 compliant privacy notice in both English and Bahasa Malaysia.', downloads: 203 },
    { id: 't14', title: 'Freelancer / Contractor Agreement', slug: 'contractor-agreement', category: 'c1', price: 149, status: 'published', questions: 13, turnaround: '10 minutes',
      summary: 'Engages an independent contractor without triggering EPF and SOCSO employee liability.', downloads: 0 },
    { id: 't15', title: 'Magistrates Court Pack, Debt Recovery', slug: 'court-pack-debt-recovery', category: 'c5', price: 149, status: 'published', questions: 25, turnaround: '25 minutes', href: 'courtpack.html',
      summary: 'A guided interview about the debt and your paperwork generates the full filing pack: writ of summons, statement of claim, witness statement, chronology, and an indexed bundle of documents.', downloads: 0 }
  ],

  /* ------------------------------------------------- insight categories -- */
  insightCategories: [
    { id: 'ic1', name: 'Contracts & Docs', slug: 'contracts-docs', order: 1 },
    { id: 'ic2', name: 'Compliance', slug: 'compliance', order: 2 },
    { id: 'ic3', name: 'Business Law', slug: 'business-law', order: 3 },
    { id: 'ic4', name: 'Startups', slug: 'startups', order: 4 }
  ],

  /* ---------------------------------------------------------- insights -- */
  insights: [
    { id: 'i1', title: 'What Every Malaysian SME Needs in a Service Agreement', slug: 'sme-service-agreement', category: 'ic1', author: 'Lawgistics', date: '2025-03-01', status: 'published', readTime: 6,
      excerpt: 'The five key clauses every Malaysian service agreement must include to protect your business, scope of work, payment terms, IP ownership, termination rights, and liability caps.',
      body: 'Most disputes between Malaysian service providers and their clients do not start with bad faith. They start with a document that never defined what "done" meant.\n\n## 1. Scope of work\nA scope clause should describe deliverables, not activities. "Design a website" invites argument; "design and deliver five responsive page templates, with two rounds of revision per template" does not. Anything outside that list is a variation, and variations should be priced.\n\n## 2. Payment terms\nState the amount, the currency, the invoice trigger, and the due date. Under Malaysian practice a 30-day term is common, but nothing stops you from setting 14 days. Add a late payment interest clause, courts will generally uphold a reasonable rate.\n\n## 3. Intellectual property ownership\nThis is the clause most often left out. Under the Copyright Act 1987, the author of a commissioned work is the first owner unless there is a written assignment. If your client expects to own the deliverables, the agreement must say so expressly.\n\n## 4. Termination rights\nDistinguish termination for convenience from termination for breach. Give each party a notice period, and set out what happens to work in progress and to fees already paid.\n\n## 5. Liability caps\nAn uncapped liability clause exposes a small business to a claim far larger than the contract value. A cap set at the total fees paid in the preceding twelve months is a widely accepted position.\n\n## Getting it right\nThese five clauses will not cover every situation, but an agreement missing any one of them is the agreement most likely to end up in a dispute.' },

    { id: 'i2', title: 'NDAs, When Do You Actually Need One?', slug: 'ndas-when-needed', category: 'ic1', author: 'Lawgistics', date: '2025-02-01', status: 'published', readTime: 5,
      excerpt: 'When Malaysian businesses need non-disclosure agreements and what a legally sound NDA must include under Malaysian law.',
      body: 'An NDA is not a formality. It is the document that turns a conversation into a protected disclosure.\n\n## When you need one\nBefore sharing customer lists, pricing models, source code, product roadmaps, or financials with anyone outside your company, including prospective investors, contractors, and acquirers.\n\n## When you probably do not\nFor information already in the public domain, or where the commercial relationship is small enough that the cost of enforcement would exceed the value of what you are protecting.\n\n## What a sound NDA contains\nA workable definition of confidential information, a stated purpose for the disclosure, carve-outs for information already known or independently developed, a defined term, and a return-or-destroy obligation at the end.\n\n## Mutual or one-way?\nIf only you are disclosing, a one-way NDA is cleaner and faster to sign. If both sides will share, use a mutual NDA, asking a counterparty to accept one-way obligations when you will also receive their information slows deals down.' },

    { id: 'i3', title: 'Employment Contracts in Malaysia: What You Can’t Afford to Skip', slug: 'employment-contracts-malaysia', category: 'ic2', author: 'Lawgistics', date: '2025-02-01', status: 'published', readTime: 7,
      excerpt: 'From probation clauses to restraint of trade, the provisions that protect your business under Malaysia’s Employment Act 1955.',
      body: 'The Employment Act 1955 sets a floor, not a ceiling. Your contract can offer more than the Act requires; it cannot offer less.\n\n## Probation\nProbation is a contractual concept, not a statutory one. A probationer is still an employee, and dismissal during probation still requires just cause and excuse. State the length and whether it can be extended.\n\n## Notice periods\nSection 12 sets minimum notice by length of service. Anything shorter in your contract is void to that extent.\n\n## Restraint of trade\nSection 28 of the Contracts Act 1950 renders most post-employment non-competes void in Malaysia. Non-solicitation of clients and employees is on firmer ground, and confidentiality obligations survive independently.\n\n## Statutory deductions\nEPF, SOCSO, EIS, and PCB are not optional and are not negotiable by agreement. Registration must be in place before your first payroll run.' },

    { id: 'i4', title: 'Shareholders’ Agreement vs. Company Constitution: What’s the Difference?', slug: 'shareholders-agreement-vs-constitution', category: 'ic3', author: 'Lawgistics', date: '2025-01-01', status: 'published', readTime: 6,
      excerpt: 'Understanding the difference between a Shareholders’ Agreement and Company Constitution under the Malaysia Companies Act 2016.',
      body: 'Under the Companies Act 2016 a company is no longer required to have a constitution. That has left many founders unsure which document governs what.\n\n## The constitution\nA public document, filed with SSM, that binds the company and all its members. It deals with the mechanics of the company: share classes, director powers, meeting procedure.\n\n## The shareholders’ agreement\nA private contract between the shareholders. It is not filed, so commercially sensitive terms stay confidential. It deals with the relationship between the owners: reserved matters, drag and tag rights, deadlock, exit.\n\n## Which prevails\nWhere the two conflict, the constitution governs the company’s acts, but shareholders remain contractually bound to each other by the agreement. Well-drafted agreements include an obligation on shareholders to vote to amend the constitution where needed.\n\n## What most SMEs need\nIf there is more than one shareholder, a shareholders’ agreement is the more urgent document. It is the one that answers what happens when the founders disagree.' },

    { id: 'i5', title: 'Bumiputera Equity Requirements: What Business Owners Need to Know', slug: 'bumiputera-equity-requirements', category: 'ic2', author: 'Lawgistics', date: '2025-01-01', status: 'published', readTime: 5,
      excerpt: 'Practical guidance for Malaysian SMEs on Bumiputera equity participation requirements by sector.',
      body: 'Bumiputera equity conditions are sector-specific rather than general. Most SMEs are unaffected; those in licensed sectors need to check carefully.\n\n## Where conditions commonly apply\nDistributive trade, freight forwarding, oil and gas services licensing, and certain government-linked procurement categories each carry their own participation thresholds.\n\n## Where they generally do not\nMost technology, professional services, and manufacturing businesses have no equity condition attached to incorporation.\n\n## Practical steps\nIdentify the licence you actually need before you structure your shareholding. Restructuring equity after a licence application has been filed is slower and more expensive than getting it right at incorporation.' },

    { id: 'i6', title: 'The Legal Side of Hiring Your First Employee in Malaysia', slug: 'hiring-first-employee', category: 'ic2', author: 'Lawgistics', date: '2024-12-01', status: 'published', readTime: 6,
      excerpt: 'EPF, SOCSO, EIS, PCB, the compliance checklist every first-time Malaysian employer needs before sending an offer letter.',
      body: 'Hiring your first employee triggers registration obligations that must be met before, not after, the first payday.\n\n## Before the offer letter\nRegister as an employer with EPF (KWSP), SOCSO (PERKESO), and LHDN. EIS registration is handled through PERKESO.\n\n## Contribution rates\nEPF: 13% employer for employees earning RM5,000 or less monthly, 12% above that; 11% employee. SOCSO and EIS are contributed on a scaled table.\n\n## The paperwork\nAn offer letter and an employment contract are different documents doing different jobs. The offer letter proposes; the contract governs. Issue both.\n\n## Record keeping\nSection 61 of the Employment Act requires employers to keep a register of employees, and to retain it for six years.' },

    { id: 'i7', title: 'How to Protect Your Business When a Client Doesn’t Pay', slug: 'client-doesnt-pay', category: 'ic3', author: 'Lawgistics', date: '2024-12-01', status: 'published', readTime: 7,
      excerpt: 'Legal tools available to Malaysian SMEs for recovering unpaid debts, from Letters of Demand to CIPAA adjudication.',
      body: 'Non-payment is a cash flow problem before it is a legal one. The tools below escalate in cost, so work through them in order.\n\n## 1. The letter of demand\nInexpensive and often sufficient. It sets a deadline, states the consequence of non-payment, and creates a paper trail.\n\n## 2. Statutory notice under section 466\nIf the debtor is a company and the debt exceeds RM50,000 and is undisputed, a notice under section 466 of the Companies Act 2016 carries real weight, non-compliance within 21 days founds a winding-up petition.\n\n## 3. CIPAA adjudication\nFor construction contracts, the Construction Industry Payment and Adjudication Act 2012 offers a statutory adjudication process with a decision typically inside 45 working days.\n\n## 4. Civil suit\nThe Sessions Court has jurisdiction up to RM1 million. Consider whether the debtor has assets worth enforcing against before filing.' },

    { id: 'i8', title: 'Intellectual Property Basics for Malaysian Startups', slug: 'ip-basics-startups', category: 'ic4', author: 'Lawgistics', date: '2024-11-01', status: 'published', readTime: 6,
      excerpt: 'Trademarks, copyright, patents, and trade secrets, protecting your brand and product under Malaysian IP law.',
      body: 'Four regimes protect four different things. Most startups need two of them on day one.\n\n## Trademarks\nRegistered under the Trademarks Act 2019 through MyIPO. Registration gives you a monopoly in your class of goods or services. Search before you name.\n\n## Copyright\nArises automatically under the Copyright Act 1987, no registration required, though voluntary notification is available. Remember: the author owns it unless assigned in writing.\n\n## Patents\nProtect inventions for 20 years. Expensive and slow, and disclosure before filing destroys novelty. File before you demo publicly.\n\n## Trade secrets\nProtected by the law of confidence rather than statute. The protection depends entirely on you having treated the information as confidential, which is what your NDAs and employment contracts are for.' },

    { id: 'i9', title: 'What is a Letter of Demand, and When Should You Send One?', slug: 'letter-of-demand-guide', category: 'ic3', author: 'Lawgistics', date: '2024-11-01', status: 'published', readTime: 5,
      excerpt: 'How a Letter of Demand works in Malaysia, what it must include, and when it’s your most cost-effective legal move.',
      body: 'A letter of demand is the cheapest formal step available to a creditor, and it resolves a surprising share of disputes on its own.\n\n## What it must contain\nThe identity of the parties, the basis of the debt, the exact sum claimed, a deadline for payment, and a clear statement of what happens if the deadline passes.\n\n## Tone\nFirm, factual, and free of threats that you are not prepared to carry out. An empty threat, once ignored, weakens every letter you send afterwards.\n\n## Timing\nSend it once the invoice is genuinely overdue and informal reminders have failed, usually 30 to 45 days past due.\n\n## After it is sent\nKeep proof of delivery. If the matter proceeds, the letter and its delivery record become part of your evidence.' },

    { id: 'i10', title: 'Freelancer or Employee? Getting the Classification Right in Malaysia', slug: 'freelancer-or-employee', category: 'ic2', author: 'Lawgistics', date: '2024-10-01', status: 'published', readTime: 7,
      excerpt: 'How Malaysian courts determine worker classification and how to structure freelancer engagements correctly to avoid EPF and SOCSO liability.',
      body: 'Calling someone a freelancer does not make them one. Malaysian courts look at substance, not labels.\n\n## The tests applied\nControl over how the work is done, integration into the organisation, provision of tools, the ability to delegate, and whether the worker bears financial risk.\n\n## Why it matters\nMisclassification exposes the business to back-dated EPF and SOCSO contributions, penalties, and potential unfair dismissal claims at the Industrial Court.\n\n## Structuring it correctly\nEngage the contractor for a defined deliverable rather than for hours. Let them control their method and schedule. Avoid company email addresses, fixed desks, and performance reviews. Put it in a written contractor agreement.' },

    { id: 'i11', title: 'Terms & Conditions for Your Website: Is It Really Necessary?', slug: 'website-terms-necessary', category: 'ic2', author: 'Lawgistics', date: '2024-10-01', status: 'published', readTime: 5,
      excerpt: 'Why Malaysian business websites need T&Cs and a PDPA-compliant Privacy Notice, what to include and the risks of going without.',
      body: 'Two separate documents are doing two separate jobs, and only one of them is legally mandatory.\n\n## The privacy notice, mandatory\nIf you collect personal data in commercial transactions, the Personal Data Protection Act 2010 requires a privacy notice, issued in both English and Bahasa Malaysia. Non-compliance is an offence.\n\n## Terms and conditions, strongly advisable\nNot mandatory, but they are what limit your liability, set governing law, protect your content, and let you terminate abusive accounts.\n\n## Common mistakes\nCopying a foreign template that refers to the GDPR or to another jurisdiction’s courts, and burying acceptance where no user could reasonably find it.' }
  ],

  /* ----------------------------------------------------------- reviews --
     Empty by design. Nothing goes here until a real client says it, with
     their permission. Invented reviews are misleading conduct, and on a
     legal services site they are the first thing a regulator would test. */
  reviews: [],

  /* ---------------------------------------------------------------- FAQs -- */
  faqs: [
    { id: 'f1', question: 'What are the EPF contribution rates for employers in Malaysia?', order: 1, status: 'published',
      answer: 'For employees under 60, the statutory employer rate is 13% of monthly wages where wages are RM 5,000 or less, and 12% where they exceed RM 5,000. The employee rate is 11%. Rates are set by the EPF and are revised from time to time, so confirm the current figures with KWSP before running payroll. Registration as an employer is required before the first payroll.' },
    { id: 'f2', question: 'Do I need to register copyright in Malaysia?', order: 2, status: 'published',
      answer: 'No. Copyright arises automatically under the Copyright Act 1987 as soon as an original work is fixed in material form. Voluntary notification with the Intellectual Property Corporation of Malaysia (MyIPO) is available and provides useful prima facie evidence of ownership if a dispute arises.' },
    { id: 'f3', question: 'Are non-compete clauses enforceable in Malaysia?', order: 3, status: 'published',
      answer: 'Generally no. Section 28 of the Contracts Act 1950 renders agreements in restraint of trade void, and Malaysian courts have consistently applied this to post-employment non-competes. Non-solicitation clauses and confidentiality obligations are on much firmer ground and are the practical alternative.' },
    { id: 'f4', question: 'What should a Malaysian service agreement include?', order: 4, status: 'published',
      answer: 'At minimum: a defined scope of work, payment terms and invoicing triggers, intellectual property ownership, termination rights for both convenience and breach, a liability cap, and a governing law and dispute resolution clause specifying Malaysian law.' },
    { id: 'f5', question: 'How long does it take to create a document?', order: 5, status: 'published',
      answer: 'Most templates take between five and twenty minutes. You answer a guided set of questions, review the draft, and download it as PDF or Word. Nothing is filed or sent on your behalf, the document is yours to sign.' },
    { id: 'f6', question: 'Is RM 149 a subscription?', order: 6, status: 'published',
      answer: 'No. RM 149 is a one-time fee per document. You keep unlimited editing access to that document, and there is no recurring charge. Bespoke drafting through our lawyer matching service is quoted separately.' }
  ],

  /* -------------------------------------------------- contact submissions -- */
  contactSubmissions: [
    { id: 'cs1', name: 'Melissa Chong', email: 'melissa.chong@example.com', phone: '+60 12 345 6789', subject: 'Bulk template pricing', status: 'new', date: '2025-03-04',
      message: 'We are a franchise group with 14 outlets and need tenancy and employment templates for each. Is there a volume rate?' },
    { id: 'cs2', name: 'Arif Hakim', email: 'arif.hakim@example.com', phone: '+60 19 887 2210', subject: 'Question about PDPA notice', status: 'replied', date: '2025-03-01',
      message: 'Does the PDPA privacy notice template come in Bahasa Malaysia as well, or only English?' },
    { id: 'cs3', name: 'Grace Yeoh', email: 'grace.yeoh@example.com', phone: '+60 16 220 4471', subject: 'Partnership enquiry', status: 'new', date: '2025-02-27',
      message: 'I run an accounting practice in Johor Bahru and would like to refer clients. Do you have a referral arrangement?' },
    { id: 'cs4', name: 'Hafiz Osman', email: 'hafiz.osman@example.com', phone: '+60 13 559 0028', subject: 'Refund request', status: 'closed', date: '2025-02-19',
      message: 'I purchased the wrong template, bought the one-way NDA when I needed mutual. Can this be swapped?' }
  ],

  /* -------------------------------------------------- enquiry submissions --
     Field names match the live Payload enquiry-submissions collection. */
  enquirySubmissions: [
    { id: 'es1', businessName: 'Bright Path Montessori', businessType: 'Education / childcare', stage: 'established',
      legalServices: 'Employment & HR Law', timeline: 'soon', email: 'serena@example.com', phone: '+60 12 908 3341',
      preferredContact: 'email', status: 'new', assignedTo: '', date: '2025-03-05',
      description: 'We need to restructure 11 employment contracts after a change in ownership. Looking for a lawyer to review and redraft.' },
    { id: 'es2', businessName: 'Idris Freight Sdn Bhd', businessType: 'Freight forwarding', stage: 'established',
      legalServices: 'Corporate Compliance', timeline: 'urgent', email: 'kamal@example.com', phone: '+60 17 442 1180',
      preferredContact: 'phone', status: 'matched', assignedTo: 'Nadia Selamat', date: '2025-03-03',
      description: 'Freight forwarding licence renewal, and we have been told our shareholding may not meet the equity condition. Need advice urgently.' },
    { id: 'es3', businessName: 'Nair Digital', businessType: 'Digital agency', stage: 'growing',
      legalServices: 'E-commerce & Digital Law, Contracts & Agreements', timeline: 'soon', email: 'priya@example.com', phone: '+60 11 3320 7745',
      preferredContact: 'video', status: 'quoted', assignedTo: 'Wong Kar Meng', date: '2025-02-28',
      description: 'Launching a marketplace and need platform terms, a vendor agreement, and a PDPA notice reviewed together.' },
    { id: 'es4', businessName: 'BH Manufacturing', businessType: 'Manufacturing', stage: 'established',
      legalServices: 'Mergers, Acquisitions & Partnerships', timeline: 'flexible', email: 'bhtan@example.com', phone: '+60 12 776 5512',
      preferredContact: 'email', status: 'closed', assignedTo: 'Nadia Selamat', date: '2025-02-14',
      description: 'Acquiring a competitor’s assets. Need due diligence support and a sale and purchase agreement.' },
    { id: 'es5', businessName: 'Solstice Studio', businessType: 'Design studio', stage: 'startup',
      legalServices: 'Intellectual Property (Trademark, Copyright)', timeline: 'urgent', email: 'elena@example.com', phone: '+60 18 220 9931',
      preferredContact: 'whatsapp', status: 'new', assignedTo: '', date: '2025-03-06',
      description: 'A competitor has registered a mark very close to ours. Need to understand our options with MyIPO.' }
  ],

  /* -------------------------------------------------------- newsletter -- */
  newsletterLeads: [
    { id: 'nl1', email: 'ops@brightpath.example.com', source: 'Footer form', status: 'subscribed', date: '2025-03-05' },
    { id: 'nl2', email: 'finance@idrisfreight.example.com', source: 'Insights page', status: 'subscribed', date: '2025-03-02' },
    { id: 'nl3', email: 'hello@nairdigital.example.com', source: 'Footer form', status: 'subscribed', date: '2025-02-26' },
    { id: 'nl4', email: 'admin@bhmanufacturing.example.com', source: 'Home page', status: 'unsubscribed', date: '2025-02-11' },
    { id: 'nl5', email: 'studio@solstice.example.com', source: 'Insights page', status: 'subscribed', date: '2025-02-08' },
    { id: 'nl6', email: 'contact@harbourcafe.example.com', source: 'Footer form', status: 'subscribed', date: '2025-01-30' }
  ],

  /* ---------------------------------------------- documents to review -- */
  documentsToReview: [
    { id: 'dr1', reference: 'LG-2503-0041', customer: 'Serena Wong', template: 'Employment Contract', submitted: '2025-03-05', status: 'awaiting review', reviewer: '', notes: '' },
    { id: 'dr2', reference: 'LG-2503-0038', customer: 'Priya Nair', template: 'Website Terms & Conditions', submitted: '2025-03-03', status: 'in review', reviewer: 'Wong Kar Meng', notes: 'Clause 8 liability cap needs to reference the platform fee, not total contract value.' },
    { id: 'dr3', reference: 'LG-2502-0119', customer: 'Kamal Idris', template: 'Shareholders’ Agreement', submitted: '2025-02-27', status: 'changes requested', reviewer: 'Nadia Selamat', notes: 'Drag-along threshold left blank. Reverted to customer for input.' },
    { id: 'dr4', reference: 'LG-2502-0104', customer: 'Grace Yeoh', template: 'Letter of Demand', submitted: '2025-02-21', status: 'approved', reviewer: 'Wong Kar Meng', notes: 'Approved without amendment.' },
    { id: 'dr5', reference: 'LG-2502-0087', customer: 'Hafiz Osman', template: 'Non-Disclosure Agreement (Mutual)', submitted: '2025-02-16', status: 'approved', reviewer: 'Nadia Selamat', notes: 'Term shortened from 5 to 3 years at customer request.' }
  ],

  /* ------------------------------------------------------------- cases --
     Real Malaysian authorities. Names, citations, courts and years checked
     against independent published sources (law reports commentary, firm
     case notes, law journals and university materials) on 10 Aug 2026.
     Holdings are plain-English summaries written for this site, never
     extracts from the judgments, so copyright in the reports is not touched.

     `superseded: true` marks a case that is real and important but no longer
     represents the current position. Those entries say so in the holding and
     name the case that displaced them. Keep that flag accurate above all
     else, a stale authority presented as current is the one error here that
     could actually cost someone their matter.

     Standing rule: pull the official report before relying on any of this in
     a filed document. That is ordinary practice for any case database, not a
     doubt about these entries. */
  cases: [
    { id: 'ca1', name: 'Tan Ying Hong v Tan Sian San', citation: '[2010] 2 MLJ 1', court: 'Federal Court', year: 2010,
      area: 'Land law', verified: true, keywords: 'indefeasibility, forgery, National Land Code, deferred indefeasibility',
      holding: 'The Federal Court held that Malaysia follows deferred, not immediate, indefeasibility, a party who acquires title through a forged or void instrument does not get good title, though a subsequent bona fide purchaser may. It departed from the approach in Adorna Properties.' },
    { id: 'ca2', name: 'Adorna Properties Sdn Bhd v Boonsom Boonyanit', citation: '[2001] 1 MLJ 241', court: 'Federal Court', year: 2001,
      area: 'Land law', verified: true, superseded: true, keywords: 'indefeasibility, forgery, immediate indefeasibility',
      holding: 'Held that a purchaser obtained immediate indefeasible title notwithstanding a forged transfer. Widely criticised and later departed from in Tan Ying Hong, cite with care and always alongside the later authority.' },
    { id: 'ca3', name: 'Semenyih Jaya Sdn Bhd v Pentadbir Tanah Daerah Hulu Langat', citation: '[2017] 3 MLJ 561', court: 'Federal Court', year: 2017,
      area: 'Constitutional law', verified: true, keywords: 'judicial power, Article 121, separation of powers, land acquisition',
      holding: 'Affirmed that judicial power is vested in the courts as a basic feature of the Federal Constitution, and that the 1988 amendment to Article 121(1) could not remove it.' },
    { id: 'ca4', name: 'Indira Gandhi a/p Mutho v Pengarah Jabatan Agama Islam Perak', citation: '[2018] 1 MLJ 545', court: 'Federal Court', year: 2018,
      area: 'Constitutional law', verified: true, keywords: 'judicial review, unilateral conversion, jurisdiction, basic structure',
      holding: 'The civil courts retain judicial review jurisdiction over the validity of administrative action, including certificates of conversion; that supervisory jurisdiction is part of the basic structure of the Constitution.' },
    { id: 'ca5', name: 'Sivarasa Rasiah v Badan Peguam Malaysia', citation: '[2010] 2 MLJ 333', court: 'Federal Court', year: 2010,
      area: 'Constitutional law', verified: true, keywords: 'Article 8, equality, proportionality, fundamental liberties',
      holding: 'Fundamental liberties in Part II are to be read generously, and restrictions on them must be reasonable, importing a proportionality analysis into Article 8.' },
    { id: 'ca6', name: 'Goon Kwee Phoy v J & P Coats (M) Bhd', citation: '[1981] 2 MLJ 129', court: 'Federal Court', year: 1981,
      area: 'Employment law', verified: true, keywords: 'dismissal, just cause and excuse, Industrial Court, reason for dismissal',
      holding: 'Where an employer gives a reason for dismissal, the Industrial Court must decide whether that reason has been made out, it cannot substitute a different reason. Foundational to Malaysian unfair dismissal practice.' },
    { id: 'ca7', name: 'Wong Chee Hong v Cathay Organisation (M) Sdn Bhd', citation: '[1988] 1 MLJ 92', court: 'Supreme Court', year: 1988,
      area: 'Employment law', verified: true, keywords: 'constructive dismissal, fundamental breach, contract test',
      holding: 'Adopted the contract test for constructive dismissal: the employee must show a fundamental breach by the employer going to the root of the contract, and must resign promptly in response to it.' },
    { id: 'ca8', name: 'Milan Auto Sdn Bhd v Wong Seh Yen', citation: '[1995] 3 MLJ 537', court: 'Federal Court', year: 1995,
      area: 'Employment law', verified: true, keywords: 'section 20 reference, domestic inquiry, twofold function, Industrial Court jurisdiction',
      holding: 'On a reference under section 20 of the Industrial Relations Act 1967 the Industrial Court has a twofold function: to determine whether the alleged misconduct is established, and whether the proven misconduct amounts to just cause or excuse for dismissal. Failing to decide both on the merits is a jurisdictional error correctable by certiorari. A defect in natural justice from not holding a domestic inquiry is curable by the Industrial Court hearing the matter itself.' },
    { id: 'ca13', name: 'Khaliah bte Abbas v Pesaka Capital Corp Sdn Bhd', citation: '[1997] 3 CLJ 827', court: 'Court of Appeal', year: 1997,
      area: 'Employment law', verified: true, keywords: 'probationer, dismissal, just cause or excuse, security of tenure',
      holding: 'A probationer is entitled to the same protection against dismissal without just cause or excuse as a confirmed employee; probation does not create an at-will relationship. Note the practical difference at the remedy stage, where back wages for a probationer are conventionally capped at 12 months against 24 for a confirmed employee.' },
    { id: 'ca9', name: 'Polygram Records Sdn Bhd v The Search', citation: '[1994] 3 MLJ 127', court: 'High Court', year: 1994,
      area: 'Contract law', verified: true, keywords: 'restraint of trade, section 28 Contracts Act 1950, exclusivity, during the currency of the contract',
      holding: 'Section 28 of the Contracts Act 1950 bites on restraints operating after the contract has ended, not on obligations during its currency. An exclusive recording covenant binding the group while the contract ran was therefore not a restraint of trade and was not void. Read with section 28 itself, under which post-contract restraints are void in Malaysia without the English reasonableness saving, which is why post-employment non-competes generally fail here.' },
    { id: 'ca10', name: 'View Esteem Sdn Bhd v Bina Puri Holdings Bhd', citation: '[2018] 2 MLJ 22', court: 'Federal Court', year: 2018,
      area: 'Construction law', verified: true, keywords: 'CIPAA, adjudication, natural justice, payment claim',
      holding: 'An adjudicator must consider defences properly raised in the adjudication response; refusing to do so is a breach of natural justice that can render the decision liable to be set aside.' },
    { id: 'ca11', name: 'Loh Kooi Choon v Government of Malaysia', citation: '[1977] 2 MLJ 187', court: 'Federal Court', year: 1977,
      area: 'Constitutional law', verified: true, keywords: 'constitutional amendment, basic structure, Article 159',
      holding: 'Held that Parliament may amend the Constitution in accordance with Article 159 and that the Indian basic structure doctrine did not apply, a position substantially reshaped by later decisions such as Semenyih Jaya and Indira Gandhi.' },
    { id: 'ca12', name: 'Berjaya Times Square Sdn Bhd v M Concept Sdn Bhd', citation: '[2010] 1 MLJ 597', court: 'Federal Court', year: 2010,
      area: 'Contract law', verified: true, superseded: true, keywords: 'total failure of consideration, rescission, restitution, section 40 Contracts Act 1950, sale and purchase',
      holding: 'NO LONGER GOOD LAW. On a failure to deliver vacant possession the Federal Court allowed rescission and recovery of monies paid, adopting a test for total failure of consideration of whether the defaulting party had failed to perform its promise in its entirety. The Federal Court has since held that this conflated the right to terminate for repudiation with the right to claim restitution, and that Berjaya Times Square is no longer good law. Do not cite it as authority on total failure of consideration; see Lim Swee Choo & Anor v Ong Koh Hou & Another Appeal [2025] 10 CLJ. Retained here as a marker so the earlier position is not relied on by mistake.' }
  ],

  /* ------------------------------------------------------------- books --
     Reading list: bibliographic pointers only, no reproduced content. */
  books: [
    { id: 'bk1', title: 'Contract Law in Malaysia', author: 'Cheong May Fong', publisher: 'Sweet & Maxwell Asia (2010)', area: 'Contract law', level: 'Practitioner',
      note: 'Works through the Contracts Act 1950 section by section, using the common law and the Indian Contract Act 1872 as the starting point and flagging where Malaysia departs from them.' },
    { id: 'bk2', title: 'Sinnadurai: Law of Contract', author: 'Visu Sinnadurai & Low Weng Tchung', publisher: 'LexisNexis, 5th ed (2023)', area: 'Contract law', level: 'Practitioner',
      note: 'The leading Malaysian contract treatise, in two volumes, covering consideration and privity, voidable contracts, restraint of trade, frustration, breach, damages and specific performance. The first port of call for practitioners and judges.' },
    { id: 'bk3', title: 'Constitutional Law in Malaysia and Singapore', author: 'Kevin Y L Tan & Thio Li-ann', publisher: 'LexisNexis', area: 'Constitutional law', level: 'Student',
      note: 'Comparative constitutional coverage widely used in Malaysian and Singaporean law schools.' },
    { id: 'bk4', title: 'Principles of Malaysian Land Law', author: 'Khaw Lake Tee & Teo Keang Sood', publisher: 'LexisNexis (2016)', area: 'Land law', level: 'Student',
      note: 'Core text on the National Land Code and the Torrens system as applied in Malaysia, with extended treatment of the landmark indefeasibility decisions.' },
    { id: 'bk5', title: 'Modern Company Law in Malaysia', author: 'Krishnan Arjunan', publisher: 'LexisNexis', area: 'Company law', level: 'Practitioner',
      note: 'Covers the major changes introduced by the Companies Act 2016.' },
    { id: 'bk6', title: 'Essential Company Law in Malaysia: Navigating the Companies Act 2016', author: 'Chan Wai Meng', publisher: 'Sweet & Maxwell Asia', area: 'Company law', level: 'Student',
      note: 'Student-facing route through the Companies Act 2016. The author is an Associate Professor in the Faculty of Business and Accountancy, University of Malaya.' },
    { id: 'bk7', title: 'Janab\'s Key to Civil Procedure in Malaysia and Singapore', author: 'Hamid Sultan bin Abu Backer; 6th ed revised by Mah Weng Kwai & Arun Kasi', publisher: 'Janab (M) Sdn Bhd, 6th ed', area: 'Civil procedure', level: 'Student',
      note: 'The pupillage staple, procedure explained step by step so substantive rights are not lost on technical grounds. Written by a Court of Appeal judge and revised by a retired Court of Appeal judge with a practising arbitrator.' },
    { id: 'bk8', title: 'Evidence: Practice and Procedure', author: 'Augustine Paul', publisher: 'LexisNexis, 4th ed (2010); 2nd ed Malayan Law Journal (2000)', area: 'Evidence', level: 'Practitioner',
      note: 'The reference work on the Evidence Act 1950 in Malaysian practice, frequently cited in judgments. The author sat as a judge of the Federal Court.' }
  ],

  /* -------------------------------------------------------- learning --- */
  learnTracks: [
    { id: 'lt1', title: 'Chambering starter pack', audience: 'Pupils in chambers', order: 1, duration: '6 hours', status: 'published',
      summary: 'The practical things pupillage assumes you already know: court etiquette, file management, taking attendance notes, and how a matter actually moves.',
      lessons: 'Reading a cause paper without panicking\nAttendance notes that a partner can use\nCourt etiquette and modes of address\nOpening and maintaining a matter file\nTime recording and why it matters',
      outcomes: 'Read a cause paper and say what the matter is and what stage it is at\nTake an attendance note a partner can act on without asking you questions\nAddress the court correctly and know what to do when you are unsure\nOpen a file, keep it in order, and record your time honestly' },
    { id: 'lt2', title: 'Drafting fundamentals', audience: 'Interns & pupils', order: 2, duration: '8 hours', status: 'published',
      summary: 'How commercial documents are built, the clauses that matter, why they are worded as they are, and how to spot what is missing.',
      lessons: 'Anatomy of a commercial agreement\nScope, payment, and the five clauses disputes start over\nIntellectual property and the Copyright Act 1987 default\nLimitation and exclusion clauses\nMarking up a draft: house style and tracked changes',
      outcomes: 'Read a commercial agreement and say what it actually obliges each side to do\nSpot the clause that is missing, not just review the ones that are there\nExplain why a limitation or exclusion clause is worded the way it is\nMark up a draft in house style so a senior can review it quickly' },
    { id: 'lt3', title: 'Litigation support skills', audience: 'Paralegals & interns', order: 3, duration: '10 hours', status: 'published',
      summary: 'The work that wins cases before anyone stands up: bundles, chronologies, and witness statements that hold together.',
      lessons: 'Building an indexed bundle of documents\nChronologies that expose the real story\nWitness statements in question-and-answer form\nCause papers and the Rules of Court 2012\nCommon filing errors and how to avoid them',
      outcomes: 'Build an indexed bundle a judge can navigate without asking for help\nTurn a messy file into a chronology that shows what the case is really about\nTake a witness statement in proper question and answer form\nFile under the Rules of Court 2012 without the errors that get papers rejected' },
    { id: 'lt4', title: 'Legal research that stands up', audience: 'Law students', order: 4, duration: '5 hours', status: 'published',
      summary: 'Finding, verifying, and citing Malaysian authority properly, including how to check a case is still good law.',
      lessons: 'Where Malaysian judgments actually live\nReading a citation and finding the report\nChecking whether a case has been departed from\nStatutes, amendments, and finding the in-force version\nCiting authority in submissions',
      outcomes: 'Find Malaysian authority on a point and know you have found the right report\nCheck whether a case is still good law before you rely on it\nFind the version of a statute that was in force on the date that matters\nCite authority in submissions the way a court expects to see it' },
    { id: 'lt5', title: 'Advising SME clients', audience: 'Junior lawyers', order: 5, duration: '6 hours', status: 'draft',
      summary: 'Translating legal answers into commercial ones, scoping, pricing, and writing advice a business owner can act on.',
      lessons: 'The intake conversation\nScoping and quoting a small matter\nWriting advice without legalese\nWhen to say no, and how',
      outcomes: 'Run an intake conversation that gets to what the client actually needs\nScope and price a small matter without underquoting yourself\nWrite advice a business owner can act on without a translator\nRecognise the matter you should decline, and decline it well' },
    { id: 'lt6', title: 'Oral advocacy', audience: 'Interns, pupils & paralegals', order: 6, duration: 'Practice-based', status: 'published',
      summary: 'The part pupillage never really teaches: standing up and arguing a case out loud. Read a problem, record yourself arguing it, and get structured feedback on how you reason and how you present.',
      lessons: 'Argue an appeal after a full trial\nArgue an appeal from an interlocutory decision\nAnalyse a judgment and give your own view\nFree practice on a problem your supervisor set you',
      outcomes: 'Argue a case out loud and reach a conclusion instead of describing the facts\nAnswer the best argument against you rather than avoiding it\nStructure an argument so a judge can follow where you are going\nTake structured feedback on your reasoning and act on it' }
  ],

  /* ------------------------------------------------- academy levels ----
     STALE, kept only so the shape of the records does not change: nothing
     reads xpRequired any more. The academy page describes each strand and
     says what a learner should be able to do at the end of it; it no longer
     tracks, scores or unlocks anything, because a lesson has no content
     behind it and the tick recorded nothing. The old rule read:

     INVARIANT: xpRequired for level N must be <= the cumulative XP of all
     tracks for levels 1..N-1 (10 XP per lesson), otherwise the level can
     never be unlocked. Current ladder: 0 / 50 / 100 / 150 / 200 / 240,
     against 50+50+50+50+40+40 = 280 XP total. Re-check after editing
     learnTracks lessons. */
  academyLevels: [
    { id: 'al1', level: 1, name: 'Foundation', xpRequired: 0, tracks: 'lt4',
      blurb: 'Find and verify Malaysian authority properly. Everything else is built on this.' },
    { id: 'al2', level: 2, name: 'Drafter', xpRequired: 50, tracks: 'lt2',
      blurb: 'Build and mark up commercial documents, and spot what is missing.' },
    { id: 'al3', level: 3, name: 'Litigation support', xpRequired: 100, tracks: 'lt3',
      blurb: 'Bundles, chronologies, and witness statements that hold together under pressure.' },
    { id: 'al4', level: 4, name: 'In chambers', xpRequired: 150, tracks: 'lt1',
      blurb: 'The practical craft of pupillage, files, notes, etiquette, and pace.' },
    { id: 'al5', level: 5, name: 'Advising', xpRequired: 200, tracks: 'lt5',
      blurb: 'Turn legal answers into commercial ones a business owner can act on.' },
    { id: 'al6', level: 6, name: 'Advocate', xpRequired: 240, tracks: 'lt6',
      blurb: 'Stand up and argue a case out loud. Record yourself, get feedback, and do it again.' }
  ],

  /* -------------------------------------------------- daily quiz ------
     One question per day, rotated deterministically by day-of-year so every
     subscriber sees the same question and it is stable across reloads.
     Each answer states the authority so the quiz teaches rather than tests.
     Points here are drawn from the same material as the FAQ and insights;
     anything added must be checked by a Malaysian-admitted lawyer first. */
  quizQuestions: [
    { id: 'q1', area: 'Contract law', status: 'published',
      question: 'A Malaysian employment contract contains a clause barring the employee from working for a competitor for two years after leaving. Is it enforceable?',
      options: 'Yes, if two years is reasonable\nNo, it is void as a restraint of trade\nOnly if the employee was paid for it\nOnly against senior employees',
      answer: 1,
      because: 'Section 28 of the Contracts Act 1950 makes agreements in restraint of trade void, and Malaysian courts have applied it to post-employment non-competes. The English reasonableness test does not rescue them. Non-solicitation and confidentiality obligations are the enforceable alternative.' },
    { id: 'q2', area: 'Employment law', status: 'published',
      question: 'What is the employer EPF contribution rate for an employee under 60 earning RM 4,000 a month?',
      options: '11%\n12%\n13%\n15%',
      answer: 2,
      because: 'Employers contribute 13% for employees earning RM 5,000 or less per month, and 12% above that. The employee contributes 11%. Registration must be in place before the first payroll run.' },
    { id: 'q3', area: 'Civil procedure', status: 'published',
      question: 'A client in Kuala Lumpur wants to sue on a contract breached in June 2019. In August 2026, what is the position?',
      options: 'Still in time, the period is 12 years\nTime-barred, the period is 6 years\nStill in time if a demand was sent\nNo limitation period applies to contracts',
      answer: 1,
      because: 'The Limitation Act 1953 gives six years from accrual of the cause of action for contract claims in West Malaysia. Sabah and Sarawak have their own limitation ordinances, so always check which applies.' },
    { id: 'q4', area: 'Land law', status: 'published',
      question: 'Which case established that Malaysia follows deferred rather than immediate indefeasibility?',
      options: 'Adorna Properties v Boonsom Boonyanit\nTan Ying Hong v Tan Sian San\nSemenyih Jaya v Pentadbir Tanah\nLoh Kooi Choon v Government of Malaysia',
      answer: 1,
      because: 'Tan Ying Hong [2010] 2 MLJ 1 departed from Adorna Properties and confirmed deferred indefeasibility: a party taking under a forged instrument does not obtain good title, though a subsequent bona fide purchaser may. Verify the citation before relying on it.' },
    { id: 'q5', area: 'Data protection', status: 'published',
      question: 'A Malaysian online shop collects customer names and addresses. What does the PDPA 2010 require of its privacy notice?',
      options: 'Nothing, notices are voluntary\nEnglish only is sufficient\nIt must be in both English and Bahasa Malaysia\nOnly if the shop has over 50 staff',
      answer: 2,
      because: 'Section 7 of the Personal Data Protection Act 2010 requires the written notice to be issued in both English and Bahasa Malaysia where personal data is processed in commercial transactions. Non-compliance is an offence.' },
    { id: 'q6', area: 'Employment law', status: 'published',
      question: 'Can an employer dismiss a probationer without giving any reason?',
      options: 'Yes, probationers have no protection\nYes, if still within the probation period\nNo, dismissal still needs just cause and excuse\nOnly with one month notice',
      answer: 2,
      because: 'A probationer is an employee. Milan Auto Sdn Bhd v Wong Seh Yen confirms a probationer enjoys the same protection against dismissal without just cause or excuse; probation is not an at-will relationship.' },
    { id: 'q7', area: 'Civil procedure', status: 'published',
      question: 'Your client is owed RM 250,000 on undisputed invoices and wants to sue. Which court has civil jurisdiction?',
      options: 'Magistrates Court\nSessions Court\nHigh Court only\nAny of them, the client chooses',
      answer: 1,
      because: 'The Magistrates Court hears civil claims up to RM 100,000 and the Sessions Court up to RM 1 million, so a RM 250,000 claim is brought in the Sessions Court. Filing in the wrong court wastes the filing fee and the time.' },
    { id: 'q8', area: 'Company law', status: 'published',
      question: 'Under the Companies Act 2016, which document is filed with SSM and binds the company and all its members?',
      options: 'The shareholders agreement\nThe constitution\nThe board minutes\nThe share certificate',
      answer: 1,
      because: 'The constitution is the public document filed with SSM. A shareholders agreement is a private contract between the members and is not filed, which is why commercially sensitive terms live there.' },
    { id: 'q9', area: 'Intellectual property', status: 'published',
      question: 'A designer is commissioned to create a logo. Absent any written agreement, who owns the copyright?',
      options: 'The client who paid for it\nThe designer who created it\nBoth jointly\nNobody until it is registered',
      answer: 1,
      because: 'Under the Copyright Act 1987 the author is the first owner of a commissioned work unless there is a written assignment. This is the single most commonly missed clause in service agreements.' },
    { id: 'q10', area: 'Construction law', status: 'published',
      question: 'What does CIPAA 2012 provide for unpaid parties in construction contracts?',
      options: 'Automatic winding up rights\nA statutory adjudication process\nA criminal remedy\nMandatory arbitration in Singapore',
      answer: 1,
      because: 'The Construction Industry Payment and Adjudication Act 2012 provides a statutory adjudication process, typically producing a decision within 45 working days, which is far faster than litigation.' },
    { id: 'q11', area: 'Constitutional law', status: 'published',
      question: 'Which decision affirmed that judicial power is a basic feature of the Federal Constitution?',
      options: 'Phang Chin Hock v PP\nSemenyih Jaya v Pentadbir Tanah Daerah Hulu Langat\nAdorna Properties v Boonsom Boonyanit\nGoon Kwee Phoy v J&P Coats',
      answer: 1,
      because: 'Semenyih Jaya [2017] 3 MLJ 561 held that judicial power vests in the courts as a basic feature, and that the 1988 amendment to Article 121(1) could not remove it. Verify the citation before relying on it.' },
    { id: 'q12', area: 'Employment law', status: 'published',
      question: 'A business engages a freelancer, calls them a contractor, sets their hours, gives them a company email and a desk, and reviews their performance. What is the risk?',
      options: 'None, the label governs\nThey may be found to be an employee, triggering EPF and SOCSO liability\nOnly a tax issue\nThe contract becomes void',
      answer: 1,
      because: 'Malaysian courts look at substance rather than the label, weighing control, integration, provision of tools and financial risk. Misclassification exposes the business to back-dated EPF and SOCSO contributions, penalties, and possible unfair dismissal claims.' }
  ],

  /* --------------------------------------------- daily quiz subscribers --
     Phone numbers are only ever stored with explicit opt-in. See the WhatsApp
     notes in automation/README.md: business-initiated messages need an
     approved Meta template and a recorded consent trail under the PDPA. */
  quizSubscribers: [
    { id: 'qs1', name: 'Demo Subscriber', email: 'student@example.com', phone: '+60 12 000 0000',
      channel: 'email', consent: 'yes', status: 'subscribed', date: '2026-08-10' }
  ],

  /* ---------------------------------------------- assistant training ---
     Every assistant answer that a lawyer reviews becomes a training record.
     This is the corpus that improves the model over time. */
  assistantTraining: [
    { id: 'at1', question: 'Are post-employment non-competes enforceable in Malaysia?',
      draftAnswer: 'Generally no. Section 28 of the Contracts Act 1950 renders agreements in restraint of trade void, and Malaysian courts have applied this to post-employment non-competes. Non-solicitation and confidentiality obligations are the enforceable alternative.',
      reviewedBy: 'Mathew Philip', verdict: 'approved', area: 'Employment law', date: '2026-08-01',
      notes: 'Good. Add that the position differs from England, where reasonableness saves some covenants.' },
    { id: 'at2', question: 'What is the limitation period for a contract claim in Malaysia?',
      draftAnswer: 'Six years from the date the cause of action accrued, under the Limitation Act 1953.',
      reviewedBy: 'Mathew Philip', verdict: 'approved', area: 'Civil procedure', date: '2026-08-02',
      notes: 'Correct for West Malaysia. Flag that Sabah and Sarawak have their own limitation ordinances.' },
    { id: 'at3', question: 'Can I wind up a company that owes me RM 30,000?',
      draftAnswer: 'A statutory notice under section 466 of the Companies Act 2016 requires the debt to exceed the prescribed amount. Below that threshold, a civil suit is the appropriate route.',
      reviewedBy: '', verdict: 'pending', area: 'Insolvency', date: '2026-08-06',
      notes: 'Needs the current threshold figure checked before this answer is released.' }
  ],

  /* --------------------------------------------------- global: pricing -- */
  pricing: {
    id: 'pricing',
    standardName: 'Standard',
    standardPrice: 149,
    standardCurrency: 'RM',
    standardNote: 'per document, one-time, no subscription',
    standardFeatures: 'Lawyer-verified templates\nUnlimited editing\nAI-assisted creation\nPDF / Word export\nEncrypted storage',
    customName: 'Custom',
    customPrice: 'Scoped to your requirement',
    customFeatures: 'Full lawyer consultation\nDocument drafting or review\n24-hour response time\nTailored documents\nRetainer options available',
    currency: 'MYR',
    taxNote: 'Prices are inclusive of applicable service tax.'
  }
};
