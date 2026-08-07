import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

/**
 * Ethics and AI, Australia.
 *
 * Written as duties rather than as tool behaviour. Which model is capable of
 * what changes every few months; the obligations do not, and a module built on
 * the former is out of date before anyone sits it.
 *
 * That is also why there are few citations here. The specific practice notes
 * governing disclosure of AI use to a court are recent, differ between courts,
 * and are being revised: pinning content to one of them would teach a rule that
 * may not apply in the court the learner is standing in. The safer and more
 * useful instruction is to read the practice note of the court you are in, and
 * that is what these questions say.
 *
 * NOT VERIFIED. Drafted without a qualified reader, like everything else here,
 * and this is the module most likely to be relied on directly, so it wants a
 * careful one.
 */
export const ETHICS_AI_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'ai-confidentiality-public-tool',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'You are drafting a chronology and paste the client’s statement, including their name and the amounts in dispute, into a free public AI chatbot to have it summarised.',
    stem: 'What is the primary problem with that?',
    options: [
      { id: 'a', text: 'The summary might be poorly written' },
      { id: 'b', text: 'Client information has been disclosed to a third party, which may breach confidentiality' },
      { id: 'c', text: 'It is slower than doing it yourself' },
      { id: 'd', text: 'Nothing, provided you check the summary' },
    ],
    correct: ['b'],
    explanation:
      'A practitioner must not disclose confidential client information without authority. Entering that information into a system operated by someone else is a disclosure to that operator, and on many consumer services the terms permit the provider to retain the input and use it. Checking the output does not undo the disclosure, because the disclosure happened when you pressed enter.',
    whyItMatters:
      'It is the single most common way this goes wrong, and it usually happens without any intention to disclose anything. The habit forms in the first week, which is why it is worth naming in the first week.',
    commonMisconception:
      'That anonymising a name is enough. A matter can be identifiable from the facts alone, and in a small market it usually is.',
    memoryTrick: 'Pressing enter is sending it.',
    concepts: ['ai-confidentiality', 'ai-supervision'],
    skills: ['professional-judgment', 'attention-to-detail'],
    sourceReference: 'Australian Solicitors’ Conduct Rules r 9',
  },
  {
    slug: 'ai-fabricated-citation',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'An AI tool drafts a submission for you. It cites a case that supports your argument perfectly. You cannot find the case on any database.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Cite it; the tool must have found it somewhere' },
      { id: 'b', text: 'Remove it, and check every other authority in the draft' },
      { id: 'c', text: 'Cite it but note that it could not be verified' },
      { id: 'd', text: 'Ask the tool to confirm the case exists' },
    ],
    correct: ['b'],
    explanation:
      'These systems generate text that reads like a citation whether or not the case exists. If you cannot find it, treat it as not existing. And one fabrication in a draft is a reason to check every other authority in it, not just that one, because the same process produced them all. Asking the tool to confirm its own output is worthless: it will confirm it.',
    whyItMatters:
      'Citing an authority that does not exist misleads the court. That it was not deliberate is mitigation, not a defence, and practitioners have been referred to regulators for exactly this.',
    commonMisconception:
      'That a plausible citation format means a real case. The format is the easiest part to generate.',
    memoryTrick: 'If you have not read it, you cannot cite it.',
    concepts: ['ai-verification', 'ai-candour'],
    skills: ['professional-judgment', 'attention-to-detail'],
  },
  {
    slug: 'ai-duty-to-court-paramount',
    domain: 'ethics-and-ai',
    type: 'true_false',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: using an AI tool to prepare a document reduces your responsibility for what is in it.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False, and this is the foundation of everything else in this area. A document filed under your name or your firm’s name is your work. The tool is not a person, cannot owe a duty to the court, and cannot be disciplined. Responsibility does not move, which means the checking has to happen before the document leaves you.',
    whyItMatters:
      'Every other rule here follows from this one. If responsibility moved, none of the rest would matter.',
    concepts: ['ai-supervision', 'ai-verification'],
    skills: ['professional-judgment'],
  },
  {
    slug: 'ai-disclosure-to-court',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'You used a generative AI tool to help prepare submissions. What should you do about telling the court?',
    options: [
      { id: 'a', text: 'Nothing; how a document was drafted is not the court’s concern' },
      { id: 'b', text: 'Check the practice note of the court you are in, because several now require disclosure' },
      { id: 'c', text: 'Always disclose, in every court, in every document' },
      { id: 'd', text: 'Disclose only if the other side asks' },
    ],
    correct: ['b'],
    explanation:
      'Australian courts have been issuing practice notes and guidelines on generative AI, and they do not all say the same thing. Some require disclosure in defined circumstances, some restrict use in preparing affidavit evidence, some are silent. The obligation is on you to know the rule in the court you are appearing in, and it is a rule that has been changing quickly.',
    whyItMatters:
      'A junior is often the one who actually prepares the document, and so is often the only person who knows how it was prepared.',
    commonMisconception:
      'That there is one national rule. There is not, and assuming the rule from your last matter is how you get caught out.',
    concepts: ['ai-candour', 'ai-competence'],
    skills: ['professional-judgment', 'procedural-sequencing'],
  },
  {
    slug: 'ai-privilege-third-party',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'Why does putting privileged material into an AI system raise a privilege question?',
    options: [
      { id: 'a', text: 'Because privilege does not apply to electronic documents' },
      { id: 'b', text: 'Because privilege depends on confidentiality being maintained, and disclosure to a third party can put it at risk' },
      { id: 'c', text: 'Because the tool becomes a party to the proceeding' },
      { id: 'd', text: 'It raises no question at all' },
    ],
    correct: ['b'],
    explanation:
      'Client legal privilege protects confidential communications. Confidentiality is not a formality attached to the document; it is a condition of the protection. Disclosing the material to an outside party can be inconsistent with maintaining it. Whether privilege is actually lost turns on the circumstances and the terms under which the provider holds the material, which is precisely why the firm decides which tools may be used and on what terms.',
    whyItMatters:
      'Losing privilege over a document is not recoverable by apologising. It is one of the few mistakes in litigation that cannot be undone.',
    commonMisconception:
      'Assuming a paid or business account solves it automatically. It may help a great deal, but it is the terms that matter, not the price.',
    concepts: ['ai-privilege', 'ai-confidentiality'],
    skills: ['professional-judgment', 'evidence-analysis'],
  },
  {
    slug: 'ai-competence-obligation',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'A solicitor must deliver legal services competently and diligently. How does that apply to a tool they use?',
    options: [
      { id: 'a', text: 'It does not; competence is about legal knowledge only' },
      { id: 'b', text: 'You must understand the tool well enough to know what it can get wrong, and to check for that' },
      { id: 'c', text: 'You must be able to explain how the model works technically' },
      { id: 'd', text: 'It applies only if the client asks about the tool' },
    ],
    correct: ['b'],
    explanation:
      'Competence extends to the means you use to do the work. You are not expected to explain the mathematics, any more than you must explain how a search database indexes. You are expected to know the characteristic failures of the thing you are relying on: that it invents citations, that it is confident when wrong, that it does not know what it does not know, and that its training has a cutoff and so it does not know recent law.',
    whyItMatters:
      'It is the difference between using a tool and being used by one. The failure modes are knowable, which is what makes not knowing them a choice.',
    concepts: ['ai-competence', 'ai-verification'],
    skills: ['professional-judgment'],
    sourceReference: 'Australian Solicitors’ Conduct Rules r 4.1.3',
  },
  {
    slug: 'ai-billing-time',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'A task that would have taken you four hours takes forty minutes with an AI tool. The client is billed at an hourly rate.',
    stem: 'What may you bill?',
    options: [
      { id: 'a', text: 'Four hours, because that is what the work is worth' },
      { id: 'b', text: 'The time actually spent, including the time spent checking the output' },
      { id: 'c', text: 'Four hours, provided the client is not told how it was done' },
      { id: 'd', text: 'Nothing, because a machine did the work' },
    ],
    correct: ['b'],
    explanation:
      'On an hourly basis you bill time spent, and that includes the time spent reviewing and correcting what the tool produced, which is real work. Billing time you did not spend is not an efficiency gain, it is a false statement about the bill. If the value of the work exceeds the time it took, that is an argument for a different fee arrangement, made openly, not for inflating an hourly figure.',
    whyItMatters:
      'This is where the commercial pressure of these tools lands, and it lands on juniors first, because juniors record the time.',
    concepts: ['ai-billing'],
    skills: ['professional-judgment', 'commercial-reasoning'],
  },
  {
    slug: 'ai-advice-is-yours',
    domain: 'ethics-and-ai',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: an AI tool can give legal advice to your client if a solicitor reviews it afterwards.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False, and the distinction is not pedantic. Advice is the exercise of professional judgment on a client’s circumstances. A tool can produce a draft, and a solicitor can adopt it after applying their own judgment, at which point the advice is the solicitor’s. What cannot happen is the judgment itself being delegated, with review reduced to a glance for tone.',
    whyItMatters:
      'It marks the line between using a tool to work faster and letting it do the part of the job you are actually paid for.',
    commonMisconception:
      'That a review step launders the output. It only counts if judgment was genuinely applied.',
    concepts: ['ai-supervision', 'ai-competence'],
    skills: ['professional-judgment'],
  },
  {
    slug: 'ai-correcting-the-record',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'A submission was filed last week. You now realise one of the authorities in it does not exist; it came from an AI draft that was not checked.',
    stem: 'What do you do?',
    options: [
      { id: 'a', text: 'Say nothing unless the court raises it' },
      { id: 'b', text: 'Tell your supervisor immediately, and correct it with the court' },
      { id: 'c', text: 'Quietly file an amended submission without mentioning why' },
      { id: 'd', text: 'Wait to see whether the other side notices' },
    ],
    correct: ['b'],
    explanation:
      'A practitioner who has misled the court, however inadvertently, must correct it at the earliest opportunity. The duty to the court is paramount and it does not soften because the error is embarrassing. Correcting it promptly is treated very differently from leaving it and being found out, and that difference is usually the whole difference.',
    whyItMatters:
      'The instinct to hide a mistake like this is strong and entirely human. Knowing in advance what you are supposed to do is what makes it possible to do it on the day.',
    memoryTrick: 'The mistake is survivable. Concealing it is not.',
    concepts: ['ai-candour', 'ai-verification'],
    skills: ['professional-judgment'],
  },
];
