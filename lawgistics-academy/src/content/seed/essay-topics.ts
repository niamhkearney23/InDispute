/**
 * Comparison essay topics, as data.
 *
 * Assigned once, on a learner's first diagnostic, matched to their weakest
 * domain: see pickEssayTopic in src/lib/training/service.ts. Written for an
 * Australian student comparing what they already know against the Malaysian
 * equivalent, fitting a Kuala Lumpur placement: the brief for this feature
 * asks for "one point of Malaysian law against the Australian equivalent."
 *
 * NOT VERIFIED. Same standing as every other piece of content here: drafted
 * without a qualified reader, and to be checked before anyone learns from it.
 */

export interface EssayTopic {
  slug: string;
  domain: string;
  prompt: string;
}

export const ESSAY_TOPICS: EssayTopic[] = [
  {
    slug: 'court-hierarchy-au-my',
    domain: 'court-system',
    prompt:
      'Compare the path an appeal takes from a first-instance civil decision in Australia against the path it takes from the Malaysian Sessions Court to the Federal Court. Where do the two structures diverge, and what does that divergence assume about the case underneath it?',
  },
  {
    slug: 'monetary-jurisdiction-au-my',
    domain: 'court-system',
    prompt:
      'A civil claim is filed in the wrong court by value in Australia, and in Malaysia. Compare the consequence in each system, and what that comparison suggests about how seriously each treats a monetary jurisdiction limit.',
  },
  {
    slug: 'pleadings-au-my',
    domain: 'civil-procedure',
    prompt:
      'Compare what a statement of claim must plead in an Australian jurisdiction against what a statement of claim must plead under the Rules of Court 2012 in Malaysia. Where the two rules use different words for what looks like the same requirement, is the requirement actually the same?',
  },
  {
    slug: 'discovery-au-my',
    domain: 'civil-procedure',
    prompt:
      'Compare the discovery obligation in an Australian civil proceeding against discovery under the Rules of Court 2012. Where one system asks a party to do more work than the other, what does that extra work actually buy the case?',
  },
  {
    slug: 'hearsay-au-my',
    domain: 'evidence',
    prompt:
      'Compare the hearsay rule as applied in an Australian jurisdiction using the Uniform Evidence Acts against the hearsay rule under the Malaysian Evidence Act 1950. Pick one exception that exists clearly in one system and less clearly in the other, and explain what that gap would mean for a real piece of evidence.',
  },
  {
    slug: 'privilege-au-my',
    domain: 'evidence',
    prompt:
      'Compare client legal privilege in Australia against the equivalent protection under the Malaysian Evidence Act 1950. Where the two tests differ, construct a single set of facts that would be protected under one and not the other.',
  },
  {
    slug: 'cross-examination-au-my',
    domain: 'advocacy',
    prompt:
      'The rule in Browne v Dunn is cited in both Australian and Malaysian courts. Compare how strictly each system actually seems to apply it in practice, using what you have read rather than what the rule says on its face.',
  },
  {
    slug: 'duty-to-court-au-my',
    domain: 'advocacy',
    prompt:
      'Compare an advocate\'s duty to the court in Australia against the equivalent duty for an advocate and solicitor in Malaysia. Where the duty appears to conflict with a client\'s instructions, does each system resolve the conflict the same way?',
  },
  {
    slug: 'affidavits-au-my',
    domain: 'drafting',
    prompt:
      'Compare the formal requirements for an affidavit in an Australian jurisdiction against an affidavit under Order 41 of the Rules of Court 2012. If you drafted one correctly for Australia, list every change it would need to be filed in Malaysia.',
  },
  {
    slug: 'chronologies-au-my',
    domain: 'drafting',
    prompt:
      'A chronology is not a pleading in either system, but it is expected in both. Compare how each system treats a disputed chronology entry, and what a drafter should do differently depending on where the document will be read.',
  },
  {
    slug: 'binding-precedent-au-my',
    domain: 'legal-reasoning',
    prompt:
      'Compare how an Australian court treats a decision of an intermediate appellate court from a different state against how a Malaysian court treats a decision of the Court of Appeal in a matter from a different High Court. Is either system\'s answer to "does this bind me" actually simple?',
  },
  {
    slug: 'statutory-interpretation-au-my',
    domain: 'legal-reasoning',
    prompt:
      'Compare the purposive approach to statutory interpretation as applied in Australia against its Malaysian equivalent under the Interpretation Acts 1948 and 1967. Take one ambiguous provision and show how the same interpretive method could still produce different answers in each system.',
  },
  {
    slug: 'currency-of-authority-au-my',
    domain: 'legal-research',
    prompt:
      'Compare what "noting up" a case actually requires in Australia against what it requires in Malaysia, where fewer decisions are reported and updating services differ. What does a researcher trained only on the Australian databases risk missing?',
  },
  {
    slug: 'ai-confidentiality-au-my',
    domain: 'ethics-and-ai',
    prompt:
      'Compare the professional obligations around client confidentiality and generative AI tools that would apply to a solicitor in Australia against a peguam in Malaysia, referring to the Malaysian Bar\'s published guidance. Where the two are silent on the same question, what would you do and why?',
  },
];

const FALLBACK_TOPIC: EssayTopic = ESSAY_TOPICS[0];

/**
 * The best-matching topic for a learner's weakest domains, in order.
 *
 * Falls back through the list of priority domains before falling back to a
 * fixed default, so a domain with no topics of its own never leaves a
 * learner with nothing assigned.
 */
export function pickEssayTopic(priorityDomains: string[]): EssayTopic {
  for (const domain of priorityDomains) {
    const match = ESSAY_TOPICS.find((t) => t.domain === domain);
    if (match) return match;
  }
  return FALLBACK_TOPIC;
}

export function essayTopic(slug: string): EssayTopic | undefined {
  return ESSAY_TOPICS.find((t) => t.slug === slug);
}
