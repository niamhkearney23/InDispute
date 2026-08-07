import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

/**
 * AI compliance. TENTATIVE, all of it.
 *
 * Every question in this file is marked `tentative`, which means it loads as a
 * draft whatever the setup page is asked for and cannot reach a learner until
 * someone publishes it deliberately. That is not the usual "unverified" caveat.
 * This is content written ahead of the research that would stand it up, and put
 * here to be read and corrected rather than answered.
 *
 * What it is trying to be: the firm-facing half of the ethics module. The
 * ethics questions are about what one person owes. These are about what an
 * organisation has to be able to show, which is a different question and, for
 * a firm buying this as an induction, the one that matters.
 *
 * Where the ethics module could cite a practice note or a Bar Council circular,
 * this cannot yet. Firm-level obligations sit across professional conduct
 * rules, privacy law, client engagement terms and professional indemnity
 * requirements, and they differ between Australia and Malaysia in ways I have
 * not checked. The questions below state the shape of the obligation. The
 * research has to fill in what actually requires it.
 *
 * Specifically unresearched, and to be checked before any of this is published:
 *   - whether client consent to AI use is required, advisable, or neither, and
 *     under what instrument in each country
 *   - what privacy law requires when client material goes to a provider,
 *     including any cross-border disclosure rules
 *   - what a professional indemnity insurer expects to see, and whether use
 *     must be disclosed to them
 *   - what a regulator would actually ask for after an incident
 */
export const AI_COMPLIANCE_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'aic-approved-tools',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    tentative: true,
    stem: 'Who should decide which AI tools may be used on client matters?',
    options: [
      { id: 'a', text: 'Each practitioner, for their own work' },
      { id: 'b', text: 'The firm, as a policy decision, because it is a decision about client confidentiality and the firm carries that' },
      { id: 'c', text: 'The client, on each matter' },
      { id: 'd', text: 'Whoever has the budget for the subscription' },
    ],
    correct: ['b'],
    explanation:
      'Choosing a tool is choosing who else will hold client material and on what terms. That is a firm obligation, not an individual preference, and it cannot sensibly be made forty times by forty people reading forty sets of terms. A practitioner who adopts a tool privately has made a confidentiality decision on the firm’s behalf, usually without reading what the provider is permitted to do with the input.',
    whyItMatters:
      'It is the control that makes every other control possible. Without a list of approved tools there is nothing to train people on and nothing to audit.',
    concepts: ['ai-policy', 'ai-confidentiality'],
    skills: ['professional-judgment', 'commercial-reasoning'],
  },
  {
    slug: 'aic-vendor-terms',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    tentative: true,
    stem: 'What has to be established about a provider before client material goes near its system?',
    options: [
      { id: 'a', text: 'That it is a well-known company' },
      { id: 'b', text: 'What it may retain, for how long, whether it uses input for training, and where the data is held' },
      { id: 'c', text: 'That the subscription is a business plan rather than a free one' },
      { id: 'd', text: 'That other firms are using it' },
    ],
    correct: ['b'],
    explanation:
      'Retention, training use and location are the three things that decide whether sending material to a provider is consistent with the duty of confidence, and none of them is answered by the size of the company or the price of the plan. A paid tier often changes the answer, which is why it is worth checking, but the terms are what change it, not the invoice.',
    whyItMatters:
      'These are the questions a client, an insurer or a regulator would ask, and a firm that cannot answer them has not made a decision, it has made an assumption.',
    commonMisconception:
      'That a business subscription automatically means the material is safe. It usually helps a great deal. It is still the terms that decide.',
    concepts: ['ai-vendor-terms', 'ai-policy'],
    skills: ['commercial-reasoning', 'attention-to-detail'],
  },
  {
    slug: 'aic-client-consent',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    tentative: true,
    stem: 'What is the safest position on telling clients that AI may be used on their matter?',
    options: [
      { id: 'a', text: 'Say nothing; how work is produced is the firm’s business' },
      { id: 'b', text: 'Address it in the engagement terms, so the client knows before the matter starts rather than after something goes wrong' },
      { id: 'c', text: 'Ask for consent in writing before every individual use' },
      { id: 'd', text: 'Mention it only if the client raises it' },
    ],
    correct: ['b'],
    explanation:
      'Dealing with it in the engagement terms means the position is set once, in writing, before there is anything at stake. Per-use consent is unworkable and per-question consent is theatre. Saying nothing leaves the firm explaining its practice for the first time in the worst possible circumstances. Whether consent is required, as opposed to advisable, is a question this content has not established.',
    whyItMatters:
      'A client who learns after the fact that a tool was involved will ask when they could have been told, and "at the start" is the only comfortable answer.',
    concepts: ['ai-client-consent', 'ai-policy'],
    skills: ['professional-judgment', 'commercial-reasoning'],
  },
  {
    slug: 'aic-incident-path',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    tentative: true,
    scenario:
      'A paralegal realises they pasted a client’s statement into an unapproved tool last week.',
    stem: 'What should the firm’s policy tell them to do?',
    options: [
      { id: 'a', text: 'Nothing, if no harm seems to have come of it' },
      { id: 'b', text: 'Report it immediately to a named person, on a path they already know about' },
      { id: 'c', text: 'Delete their account with the tool and move on' },
      { id: 'd', text: 'Raise it at the next team meeting' },
    ],
    correct: ['b'],
    explanation:
      'The value of an incident path is that it is known in advance and that reporting is survivable. A policy which exists but which nobody can name, or under which reporting feels like confessing, produces silence, and silence is what turns a contained problem into a discovered one. The firm needs to know so it can assess whether the client must be told and whether anything else follows.',
    whyItMatters:
      'The person who notices is almost always the most junior person involved, and whether they speak up depends entirely on what they expect to happen next.',
    memoryTrick: 'A path nobody can name is not a path.',
    concepts: ['ai-incident', 'ai-supervision'],
    skills: ['professional-judgment'],
  },
  {
    slug: 'aic-records',
    domain: 'ethics-and-ai',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    tentative: true,
    stem: 'True or false: a firm should be able to show which documents involved AI assistance and how the output was checked.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True, and it has stopped being merely prudent. The Supreme Court of Victoria’s practice note requires a court user to be able to identify the parts of a document produced using AI and explain how the output was verified. A firm that keeps no record cannot answer that when asked, and the question will be asked at the point when answering it matters most.',
    whyItMatters:
      'It is also the only way a firm can demonstrate that its policy is real rather than a document nobody follows.',
    concepts: ['ai-records', 'ai-candour'],
    skills: ['attention-to-detail', 'professional-judgment'],
    sourceReference: 'Supreme Court of Victoria Practice Note SC Gen 25',
  },
  {
    slug: 'aic-supervision',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    tentative: true,
    stem: 'A supervising practitioner signs off work a junior produced with AI assistance. Where does responsibility sit?',
    options: [
      { id: 'a', text: 'With the junior, who did the work' },
      { id: 'b', text: 'With the supervising practitioner, who has adopted it by signing it' },
      { id: 'c', text: 'With the tool provider' },
      { id: 'd', text: 'Shared equally between the junior and the supervisor' },
    ],
    correct: ['b'],
    explanation:
      'Signing work is adopting it. Supervision is not a formality performed on a document someone else produced; it is the point at which a practitioner takes responsibility for the content. That does not excuse the junior from checking their own work, but it does mean a supervisor who signs without reading has not delegated the risk, they have accepted it.',
    whyItMatters:
      'It decides how much checking a supervisor should actually be doing, which is more than most assume when the draft reads well.',
    concepts: ['ai-supervision', 'ai-policy'],
    skills: ['professional-judgment'],
  },

  /* --- Malaysia ---------------------------------------------------------- */
  {
    slug: 'my-aic-approved-tools',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    tentative: true,
    stem: 'Who should decide which AI tools may be used on client matters?',
    options: [
      { id: 'a', text: 'Each advocate and solicitor, for their own work' },
      { id: 'b', text: 'The firm, as a policy decision, because it decides who else holds client material' },
      { id: 'c', text: 'The client, matter by matter' },
      { id: 'd', text: 'Whoever pays for the subscription' },
    ],
    correct: ['b'],
    explanation:
      'Choosing a tool is choosing who else will hold client material and on what terms, which engages the duty of confidence the firm carries. It cannot sensibly be decided forty times by forty people reading forty sets of terms. Bar Council guidance has consistently placed responsibility for the content and the advice on the practitioner, and a firm-level decision about which tools exist is what makes that responsibility discharegable.',
    whyItMatters:
      'Without a list of approved tools there is nothing to train anyone on and nothing to check.',
    concepts: ['ai-policy', 'ai-confidentiality'],
    skills: ['professional-judgment', 'commercial-reasoning'],
    sourceReference: 'Bar Council Circular No 342/2023; Circular No 242/2025',
  },
  {
    slug: 'my-aic-vendor-terms',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    tentative: true,
    stem: 'What must be established about a provider before client material goes near its system?',
    options: [
      { id: 'a', text: 'That it is a well-known company' },
      { id: 'b', text: 'What it may retain, for how long, whether input is used for training, and where the data is held' },
      { id: 'c', text: 'That the plan is paid rather than free' },
      { id: 'd', text: 'That other firms use it' },
    ],
    correct: ['b'],
    explanation:
      'Retention, training use and location decide whether sending material to a provider is consistent with the duty of confidence, and none of them follows from the size of the company or the price of the plan. Where the data is held matters additionally because it may engage data protection obligations on cross-border transfer, which is a question to check rather than assume.',
    whyItMatters:
      'These are the questions a client or a regulator would ask, and a firm that cannot answer them has assumed rather than decided.',
    concepts: ['ai-vendor-terms', 'ai-policy'],
    skills: ['commercial-reasoning', 'attention-to-detail'],
  },
  {
    slug: 'my-aic-incident-path',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    tentative: true,
    scenario: 'A pupil realises they pasted client instructions into an unapproved tool last week.',
    stem: 'What should the firm’s policy tell them to do?',
    options: [
      { id: 'a', text: 'Nothing, if no harm is apparent' },
      { id: 'b', text: 'Report it at once to a named person, on a path they already know' },
      { id: 'c', text: 'Delete the account and move on' },
      { id: 'd', text: 'Mention it at the next team meeting' },
    ],
    correct: ['b'],
    explanation:
      'An incident path is only worth having if it is known in advance and reporting is survivable. A policy nobody can name, or under which reporting feels like confessing, produces silence, and silence turns a contained problem into a discovered one. The firm needs to know so it can decide whether the client must be told.',
    whyItMatters:
      'The person who notices is almost always the most junior, and whether they speak depends on what they expect to happen next.',
    memoryTrick: 'A path nobody can name is not a path.',
    concepts: ['ai-incident', 'ai-supervision'],
    skills: ['professional-judgment'],
  },
  {
    slug: 'my-aic-records',
    domain: 'ethics-and-ai',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    tentative: true,
    stem: 'True or false: a firm should be able to show which documents involved AI assistance and how the output was checked.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True. A record is what lets a firm answer the question when it is asked, and it is the only way to demonstrate that a policy is real rather than a document nobody follows. Whether any Malaysian court or regulator presently requires such a record, as opposed to it being prudent practice, is a question this content has not established.',
    whyItMatters:
      'A policy without records is indistinguishable, from the outside, from no policy.',
    concepts: ['ai-records', 'ai-candour'],
    skills: ['attention-to-detail', 'professional-judgment'],
  },
  {
    slug: 'my-aic-supervision',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    tentative: true,
    stem: 'A supervising partner signs off work a pupil produced with AI assistance. Where does responsibility sit?',
    options: [
      { id: 'a', text: 'With the pupil, who did the work' },
      { id: 'b', text: 'With the supervising partner, who adopted it by signing it' },
      { id: 'c', text: 'With the tool provider' },
      { id: 'd', text: 'Shared equally' },
    ],
    correct: ['b'],
    explanation:
      'Signing work is adopting it. Supervision is not a formality performed over a document someone else produced; it is where a practitioner takes responsibility for the content. That does not excuse the pupil from checking their own work, but a partner who signs without reading has accepted the risk rather than delegated it.',
    whyItMatters:
      'It sets how much checking a supervisor should be doing, which is more than most assume when a draft reads well.',
    concepts: ['ai-supervision', 'ai-policy'],
    skills: ['professional-judgment'],
  },
];
