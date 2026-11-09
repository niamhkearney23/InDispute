import { type SeedQuestion } from '../types';

/**
 * Practice skills (the owner, November 2026: ten skills "the new generation
 * of lawyers" can build, "practical soft skills", and "also want questions
 * on this"): plain-language communication, precise drafting, legal research
 * and checking it, time management, commercial awareness, client care,
 * negotiation, business development, technology fluency, and resilience and
 * self-management.
 *
 * These are situational-judgement questions: a realistic moment and the
 * better of four ways to handle it. A chosen option shows what somebody knows
 * to do. It does not show how well they speak, write, negotiate or cope, and
 * nothing here says it does; the pages say the same.
 *
 * DRAFTED BY AN AI. NOT CHECKED BY A LAWYER. Like everything in the bank they
 * load waiting for review, and no learner sees one until a lawyer has signed
 * it off and it is published. They state almost no law: they are about
 * professional practice, so a senior lawyer's judgement is what signs them
 * off, and a firm may well want some of them answered its own way.
 *
 * TENTATIVE: three of them, marked below, touch the profession's own rules on
 * advertising, touting, confidentiality or the recording of a client call. Check
 * those against the current Legal Profession (Practice and Etiquette) Rules
 * and the Bar's guidance, not against how sure the wording sounds.
 *
 * Options were written to similar lengths, because the bank's right answer
 * is otherwise usually the longest; the sign-off page still flags any that
 * are not. Where the right answer sits was varied on purpose.
 */
const SOURCE = 'Professional practice; discuss with your supervisor';

export const PRACTICE_SKILLS_MY_QUESTIONS: SeedQuestion[] = [
  /* --- Plain-language communication --------------------------------------- */
  {
    slug: 'ps-my-plain-lead-with-advice',
    domain: 'plain-language',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'The owner of a small company must decide this week whether to settle a dispute with a supplier. You are drafting your advice to her. She is not a lawyer and has little time.',
    stem: 'What should the advice open with?',
    options: [
      { id: 'a', text: 'How the rule behind her claim developed over the years' },
      { id: 'b', text: 'Every possible outcome, in order of how likely it is' },
      { id: 'c', text: 'The cases you read while preparing the advice' },
      { id: 'd', text: 'Your recommendation, and the main reason for it' },
    ],
    correct: ['d'],
    explanation:
      'Someone who must decide needs the answer first and the reason second. Open with what you recommend and the one or two things it rests on, then give the detail beneath for those who want it. The history, the cases and the full list of outcomes belong further down, or in an attachment.',
    whyItMatters:
      'A client who has to dig for the point may not find it, and then decides without your advice.',
    commonMisconception: 'That a longer, more complete opening is more professional.',
    concepts: ['explain-to-decide'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-plain-define-the-term',
    domain: 'plain-language',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A client replies to your email: "You said the offer is ‘without prejudice’. What does that mean?"',
    stem: 'What is the best reply?',
    options: [
      { id: 'a', text: 'Say it in one plain sentence, and what it means for them' },
      { id: 'b', text: 'Copy the dictionary definition into your reply' },
      { id: 'c', text: 'Tell them it is a technical term they need not worry about' },
      { id: 'd', text: 'Send a link to a long article on the doctrine' },
    ],
    correct: ['a'],
    explanation:
      'Answer in the client’s own terms: for example, that what is said in the offer generally cannot be used against them in court if talks fail. Then say what it means for what they do next. A definition copied from a book, or a brush-off, leaves them as confused as before.',
    whyItMatters: 'Clients rarely ask twice. A confusing answer is usually the last one they ask for.',
    concepts: ['plain-words'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-plain-no-promises',
    domain: 'plain-language',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario: 'After you explain the claim, the client asks: "So, will we win?"',
    stem: 'Which answer serves the client best?',
    options: [
      { id: 'a', text: 'That nobody can promise a result, with what helps, what hurts and a realistic range' },
      { id: 'b', text: 'Yes: you think the case is strong and there is little for them to worry about at this stage' },
      { id: 'c', text: 'It depends on the judge, so there is no point in trying to say anything more than that' },
      { id: 'd', text: 'That it is a matter for the court and not something that you can comment on at all' },
    ],
    correct: ['a'],
    explanation:
      'A lawyer cannot promise a result, and a vague non-answer is no help either. Give an honest view: the points in the client’s favour, the points against, and how confident you are, in plain words. That lets the client make a real decision about whether to go on.',
    whyItMatters: 'Over-promising is the commonest source of a client’s later anger, long before a judgment.',
    commonMisconception: 'That being reassuring and being honest pull in opposite directions.',
    concepts: ['explain-to-decide', 'plain-words'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-plain-structure-long-email',
    domain: 'plain-language',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Your first draft of an advice email to a client runs to six pages. Your supervisor says it is accurate but the client will not get through it.',
    stem: 'What is the most useful change?',
    options: [
      { id: 'a', text: 'Cut every caution and qualification, so that the email reads as short and confident as possible' },
      { id: 'b', text: 'Put the decision needed and your view at the top, with the detail below under headings' },
      { id: 'c', text: 'Split it into six short emails, one for each issue, so that each one is easy to read' },
      { id: 'd', text: 'Keep the order of the draft but use a larger font and more space between the paragraphs' },
    ],
    correct: ['b'],
    explanation:
      'Length is rarely the problem; order is. State what the client has to decide and what you recommend at the top, then use headings so they can go straight to the part they need. Dropping cautions makes the advice less safe, and six emails make it harder to follow.',
    whyItMatters: 'A client who cannot find the point in your email will ring to ask for it, or act without it.',
    concepts: ['advice-structure'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-plain-check-understanding',
    domain: 'plain-language',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You have explained a settlement offer to a client over the phone. They said "yes, yes" throughout, but you suspect that they have not followed it.',
    stem: 'What is the best way to find out?',
    options: [
      { id: 'a', text: 'Ask “Does that make sense?” and take their yes as the sign that they have followed it' },
      { id: 'b', text: 'Repeat the whole explanation again, more slowly, and in exactly the same words as before' },
      { id: 'c', text: 'Ask them to tell you in their own words what they will decide and why' },
      { id: 'd', text: 'Send a longer written summary and ask them to read it carefully before the next call' },
    ],
    correct: ['c'],
    explanation:
      'People say yes to be polite. Asking the client to say it back in their own words shows quickly what they have understood and what they have not, and it puts any gap on you to fix, not on them. A longer document does not fix a gap you have not found.',
    whyItMatters: 'A decision made on a misunderstanding is not the client’s decision.',
    concepts: ['explain-to-decide'],
    skills: [],
    sourceReference: SOURCE,
  },

  /* --- Precise drafting (existing area) ----------------------------------- */
  {
    slug: 'ps-my-draft-seven-days',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You are drafting a letter to an opponent asking them to reply "within 7 days". The letter is dated on a Thursday, and a public holiday falls in the following week.',
    stem: 'How do you make the deadline exact?',
    options: [
      { id: 'a', text: 'State a date and day, for example "by 5pm on Thursday 19 November"' },
      { id: 'b', text: 'Keep “7 days” as the deadline, so that it matches the wording in the usual template' },
      { id: 'c', text: 'Write “within a week” so that the reader can choose the day that suits them best' },
      { id: 'd', text: 'Write “7 working days” and say nothing about how public holidays are to be counted' },
    ],
    correct: ['a'],
    explanation:
      'A count of days leaves room to argue about when it starts, whether weekends and holidays count, and when it ends. A named date and time leaves none. Choose the date yourself, allowing for the holiday, and write it out.',
    whyItMatters: 'A dispute about whether a deadline was met is a dispute you did not need.',
    concepts: ['precise-wording'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-draft-action-first',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You email your supervisor a draft of a letter and need her approval by Friday so that it goes out on Monday.',
    stem: 'Where does the request go?',
    options: [
      { id: 'a', text: 'In the final line, after the background she may need' },
      { id: 'b', text: 'In an attachment, so that the email itself stays short' },
      { id: 'c', text: 'In the subject line and the first sentence, with the date' },
      { id: 'd', text: 'In a separate message sent after she has read the draft' },
    ],
    correct: ['c'],
    explanation:
      'The reader should know within a few words what you want and by when: "Draft letter to X: please approve by Friday". Put the action and the date at the top, and the background after it. A request buried at the bottom is the one that gets missed.',
    whyItMatters: 'Busy readers act on what they see first.',
    concepts: ['precise-wording'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-draft-defined-terms',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'In a draft agreement you have defined "the Supplier" in clause 1, but in clause 9 you wrote "the Vendor" and in clause 14 "the Seller", all meaning the same company.',
    stem: 'What is the risk, and the fix?',
    options: [
      { id: 'a', text: 'No risk, as the reader will understand; leave the variety in' },
      { id: 'b', text: 'It may suggest three parties; use the defined term every time' },
      { id: 'c', text: 'It looks informal; replace all three with the company’s name' },
      { id: 'd', text: 'It breaks the clause numbering; renumber the agreement' },
    ],
    correct: ['b'],
    explanation:
      'A different word invites an argument that a different person or thing was meant. Define each term once and use exactly that term throughout, then search the document for stray variants before it goes out.',
    whyItMatters: 'A document that says exactly what it means is cheaper to enforce than one that is merely understood.',
    concepts: ['precise-wording'],
    skills: [],
    sourceReference: SOURCE,
  },

  /* --- Legal research and checking it (existing area) --------------------- */
  {
    slug: 'ps-my-research-when-to-ask',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You have spent two hours on a research question for a senior lawyer and have found nothing clear. The task was expected to take about an hour.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Keep going on your own until you find an answer, however long that takes you' },
      { id: 'b', text: 'Hand in what you have, without saying that you are unsure about any of it' },
      { id: 'c', text: 'Say what you have tried and ask where to look, before more time goes' },
      { id: 'd', text: 'Wait until the deadline, and only then say that you are still stuck on the question' },
    ],
    correct: ['c'],
    explanation:
      'Asking early, with a short note of what you searched and what you found, costs a senior a few minutes and saves hours. It also shows you have worked at it. Silence until the deadline wastes the client’s money and leaves no time to change course.',
    whyItMatters: 'Knowing when to ask is part of research, not a failure at it.',
    concepts: ['asking-a-senior'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-research-still-good-law',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A case you found in a database is exactly on point for your client. It is eleven years old and the headnote does not say whether it has been followed.',
    stem: 'What do you do before relying on it?',
    options: [
      { id: 'a', text: 'Rely on it, because a case in a database is good law' },
      { id: 'b', text: 'Check how later cases and any amending legislation treated it' },
      { id: 'c', text: 'Check that more than one report series printed it' },
      { id: 'd', text: 'Check who the judge was, and whether they still sit' },
    ],
    correct: ['b'],
    explanation:
      'Being in a database does not make a decision still good law. Find out whether it has since been followed, distinguished, doubted or overruled, and whether the statute it applied has changed. Then record that you checked, and when.',
    whyItMatters: 'Relying on a case that has been overruled is worse than citing no case.',
    concepts: ['noting-up', 'currency'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-research-record-your-search',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario: 'You are about to hand a research note to your supervisor.',
    stem: 'Which note is the most useful to her?',
    options: [
      { id: 'a', text: 'The conclusion only, in one sentence, so that she can read it fast' },
      { id: 'b', text: 'Every page you read, copied into one long document, so that nothing is left out' },
      { id: 'c', text: 'A list of cases, with no comment on whether you have read them or still rely on them' },
      { id: 'd', text: 'The answer, the sources, how current they are and what you did not check' },
    ],
    correct: ['d'],
    explanation:
      'A research note should let somebody else rely on it, or redo it. Give the answer, where it comes from, the date you checked it was current, and any gap you know of. A bare conclusion cannot be tested, and a heap of copied pages is not an answer.',
    whyItMatters: 'A note nobody can check is a guess with a footnote.',
    concepts: ['recording-research'],
    skills: [],
    sourceReference: SOURCE,
  },

  /* --- Time management ---------------------------------------------------- */
  {
    slug: 'ps-my-time-record-as-you-go',
    domain: 'time-management',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    scenario: 'Your firm bills many of its matters by the hour.',
    stem: 'When is the best time to record your time?',
    options: [
      { id: 'a', text: 'At the end of the month, from your diary and memory' },
      { id: 'b', text: 'As you work, or at the very latest at the end of each day' },
      { id: 'c', text: 'Only for the tasks that you are sure the client will pay for' },
      { id: 'd', text: 'Only on matters that have a court deadline attached' },
    ],
    correct: ['b'],
    explanation:
      'Time recorded soon after the work is accurate; time recorded a month later is a guess, and usually a low one. Record as you go, and record the work done, not only the work you expect to be paid for. Your supervisor decides what is billed.',
    whyItMatters: 'Accurate time is how a firm knows what a matter costs and what it can honestly charge.',
    concepts: ['time-recording'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-time-diary-the-dates',
    domain: 'time-management',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A court order sets a deadline for your side to file documents in ten days. Three tasks must be finished before then.',
    stem: 'What is the first thing to do?',
    options: [
      { id: 'a', text: 'Start on whichever task looks quickest and see how far you get' },
      { id: 'b', text: 'Wait until the week of the deadline so that the facts are settled' },
      { id: 'c', text: 'Ask the client to chase you for the documents nearer the time' },
      { id: 'd', text: 'Put the deadline and the dates for each task in the shared diary' },
    ],
    correct: ['d'],
    explanation:
      'Enter the deadline in the diary the whole team uses, and work back from it: when each task must be done, and when it must be with your supervisor for review. A deadline held only in your head is a deadline somebody can miss when you are away.',
    whyItMatters: 'A missed court deadline is one of the commonest and most damaging mistakes on a file.',
    concepts: ['deadlines'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-time-two-urgent',
    domain: 'time-management',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Two senior lawyers each give you a task at 3pm and each says it is urgent for tomorrow morning. You cannot do both well.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Do the one you were given last, since it is the freshest' },
      { id: 'b', text: 'Tell both what else you are doing and ask them to agree the order' },
      { id: 'c', text: 'Do the one for the more senior of the two, without saying why' },
      { id: 'd', text: 'Try to do both overnight and hope that neither notices' },
    ],
    correct: ['b'],
    explanation:
      'It is not your call which of two seniors wins. Tell each that the other has asked too, and ask them to settle the priority between them, or ask a supervisor to. Choosing silently, or taking both on and doing neither well, hides the problem until it is too late to fix.',
    whyItMatters: 'Saying early that you are at capacity is a skill; finding out at 9am that a task was missed is not.',
    concepts: ['prioritising'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-time-say-when-late',
    domain: 'time-management',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A draft is due to your supervisor at noon tomorrow. It is Tuesday afternoon and you now see that it will not be ready.',
    stem: 'When should you tell her?',
    options: [
      { id: 'a', text: 'At once, with when you now expect to finish it and what is left' },
      { id: 'b', text: 'At noon tomorrow, when she asks where the draft is and why it has not arrived' },
      { id: 'c', text: 'Once it is finished, with an apology for the delay and a promise to do better' },
      { id: 'd', text: 'Not at all, if you can finish it by the end of the week without anyone asking' },
    ],
    correct: ['a'],
    explanation:
      'Tell her as soon as you know, with a revised time and what remains. That gives her the chance to move her own plans, help you, or tell the client. A delay announced in advance is a manageable problem; the same delay discovered at the deadline is a failure.',
    whyItMatters: 'Seniors can plan round bad news but not round surprises.',
    concepts: ['deadlines', 'prioritising'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-time-late-entry',
    domain: 'time-management',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You see that a 40-minute client call from last week was never recorded on your timesheet. You cannot remember the exact length.',
    stem: 'What is the right way to deal with it?',
    options: [
      { id: 'a', text: 'Enter it now with your best honest estimate, noting that it is a late entry' },
      { id: 'b', text: 'Round it up to a full hour, since you are unsure how long the call really lasted' },
      { id: 'c', text: 'Leave it out of the timesheet, since nobody else knows about the call or its length' },
      { id: 'd', text: 'Add the time to another matter that has room in its budget, so that the total looks right' },
    ],
    correct: ['a'],
    explanation:
      'Record what happened, as accurately as you can, and say that the entry is late. Rounding up, hiding the time, or moving it to a different matter makes the records wrong, and a client may be charged for the wrong work. If in doubt about the figure, tell your supervisor.',
    whyItMatters: 'A firm’s time records are a record it relies on; they have to say what is true.',
    concepts: ['time-recording'],
    skills: [],
    sourceReference: SOURCE,
  },

  /* --- Commercial awareness ----------------------------------------------- */
  {
    slug: 'ps-my-commercial-cost-vs-claim',
    domain: 'commercial-awareness',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A restaurant owner wants to sue a supplier over a late delivery that cost her RM 8,000. You estimate that the legal costs of getting to trial would be several times that.',
    stem: 'What should you raise with her?',
    options: [
      { id: 'a', text: 'Only the legal merits of the claim, because the question of cost is for her to weigh' },
      { id: 'b', text: 'What it would cost, what she could recover, and other ways to resolve it' },
      { id: 'c', text: 'That she should sue on principle, whatever it costs her in time and in money' },
      { id: 'd', text: 'That she should drop it, as small claims like this are not worth a lawyer’s time' },
    ],
    correct: ['b'],
    explanation:
      'A client’s real question is whether it is worth it. Give her the likely cost, the likely recovery, the risk of losing, and cheaper routes such as a firm letter, negotiation, or a lower court or tribunal. Then it is her decision, made with the numbers in front of her.',
    whyItMatters: 'Winning a case that costs more than it recovers is not a win for the client.',
    concepts: ['cost-benefit'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-commercial-know-the-business',
    domain: 'commercial-awareness',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A manufacturing company is a new client, and you are to join your supervisor at the first meeting. You have a day to prepare.',
    stem: 'What is the best preparation?',
    options: [
      { id: 'a', text: 'Read the contract in dispute very closely, and every earlier letter between the two sides' },
      { id: 'b', text: 'Prepare a long list of questions about the law that the client may face in the future' },
      { id: 'c', text: 'Learn how the company makes money, who buys from it and who competes, as well as the file' },
      { id: 'd', text: 'Ask the client to send their full accounts and board papers before the first meeting' },
    ],
    correct: ['c'],
    explanation:
      'Read the file, and also learn what the company makes, who buys it, what matters most to its profit, and who it competes with, from its website, its public filings and the news. You will then see why the issue matters to them and ask better questions. Asking for accounts at the first stage is usually too much.',
    whyItMatters: 'Advice that ignores how the client makes money may be correct and still be no use.',
    concepts: ['client-business'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-commercial-relationship-matters',
    domain: 'commercial-awareness',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A client in a dispute with its main supplier says: "What I really want is for the supply to carry on." The client would probably win in court.',
    stem: 'What does that mean for your advice?',
    options: [
      { id: 'a', text: 'Nothing: advise as if only the chance of winning in court matters to the client here' },
      { id: 'b', text: 'That the client ought to settle at once, whatever the terms, to protect the supply' },
      { id: 'c', text: 'That you should weigh each option by what it does to the supply and the legal result' },
      { id: 'd', text: 'That you should recommend going to court, since the client would probably win there' },
    ],
    correct: ['c'],
    explanation:
      'What the client wants is part of the problem. A win in court may end the relationship that the client most needs. Set out the options, including negotiation and keeping the contract running, and say how each affects the supply, as well as who is likely to win. The choice is the client’s.',
    whyItMatters: 'A lawyer who solves the wrong problem has still failed the client.',
    concepts: ['commercial-outcome'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-commercial-fee-estimate',
    domain: 'commercial-awareness',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A prospective client asks you for a fixed fee for a piece of work whose scope is not yet clear. The firm wants the work.',
    stem: 'How should the estimate be put together?',
    options: [
      { id: 'a', text: 'Quote low so that the client says yes to the work, and revise the figure later on' },
      { id: 'b', text: 'State the assumptions, what is included, what falls outside it, and the main risks' },
      { id: 'c', text: 'Refuse to give any figure at all until every document in the matter has been read' },
      { id: 'd', text: 'Give a single round figure with no breakdown behind it, to keep the quote simple' },
    ],
    correct: ['b'],
    explanation:
      'A fee estimate is a promise about scope as much as price. Spell out what you assumed, what is covered, what would cost extra, and what could change the figure. That protects the client from surprise and the firm from an argument. A low quote to win the work only moves the argument to later.',
    whyItMatters: 'Surprises about cost are among the commonest reasons a client leaves.',
    concepts: ['cost-benefit'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-commercial-spot-the-lock-in',
    domain: 'commercial-awareness',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You are reviewing a contract for a client. You have found an unclear sentence, and you have also noticed that it locks the client into buying only from one supplier for five years.',
    stem: 'What should your review say?',
    options: [
      { id: 'a', text: 'Only the unclear sentence, since the commercial terms are for the client' },
      { id: 'b', text: 'The unclear sentence, and the five-year lock-in with what it could cost' },
      { id: 'c', text: 'A full rewrite of the contract, to remove the lock-in yourself' },
      { id: 'd', text: 'Nothing about it unless the client asks about the length of the term' },
    ],
    correct: ['b'],
    explanation:
      'The client may not have noticed the lock-in, or the cost of it if the supplier’s prices rise or its quality falls. Flag it, explain the effect in plain terms, and suggest options. Whether to accept it is the client’s call, but they should make it knowing what it is.',
    whyItMatters: 'A reviewer who reports only the legal wording misses the risk that matters most.',
    concepts: ['commercial-outcome'],
    skills: [],
    sourceReference: SOURCE,
  },

  /* --- Client care -------------------------------------------------------- */
  {
    slug: 'ps-my-client-acknowledge-promptly',
    domain: 'client-care',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A client emails on Monday morning with a question that will take you most of the week to answer properly. You are busy.',
    stem: 'What is the best reply?',
    options: [
      { id: 'a', text: 'None until you have the full answer, however long that takes' },
      { id: 'b', text: 'A short note soon, saying you have it and when they will hear more' },
      { id: 'c', text: 'A reply only if they email a second time to chase you for an answer' },
      { id: 'd', text: 'Ask a more senior lawyer to answer it so that you do not have to' },
    ],
    correct: ['b'],
    explanation:
      'A quick acknowledgement, with a time for the real answer, tells the client they have been heard and when to expect more. Silence while you work is read as being ignored. Passing it up without need adds to the delay.',
    whyItMatters: 'Clients judge a firm on how it communicates at least as much as on what it advises.',
    concepts: ['responsiveness'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-client-realistic-timeline',
    domain: 'client-care',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A client who has just started a court case says that they expect it to be finished within a month. In your experience it will take far longer.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Say nothing for now, and let them find out how long it takes as the case goes on' },
      { id: 'b', text: 'Agree with them, so that they stay happy and keep trusting you at the start' },
      { id: 'c', text: 'Tell them honestly how long it is likely to take and what could change it' },
      { id: 'd', text: 'Tell them it will take a very long time, without saying anything more than that' },
    ],
    correct: ['c'],
    explanation:
      'Correct a wrong expectation at the start, kindly and with reasons: the usual stages, how long each often takes, and what could make it quicker or slower. A client who is told early plans round it. One who is told late feels misled.',
    whyItMatters: 'Managing expectations is part of the service, not a way of avoiding it.',
    concepts: ['expectations'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-client-bad-news',
    domain: 'client-care',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'The court has dismissed an application that your client cared about. You learn of it late on a Friday afternoon.',
    stem: 'How should the client be told?',
    options: [
      { id: 'a', text: 'By a short email at 6pm, so that they can read it in their own time over the weekend' },
      { id: 'b', text: 'Promptly, ideally by phone with your supervisor, then in writing with next steps' },
      { id: 'c', text: 'On Monday morning, once you have had time over the weekend to think about how to put it' },
      { id: 'd', text: 'By softening it so that the client does not realise how bad the position really is' },
    ],
    correct: ['b'],
    explanation:
      'Bad news should come quickly and clearly, from a person, with the options for what happens next. Do it with your supervisor if you can, and follow it in writing. Waiting over the weekend, or hiding how serious it is, makes it worse when the client finds out.',
    whyItMatters: 'How bad news is delivered is remembered longer than the news.',
    concepts: ['keeping-informed'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-client-own-up-to-error',
    domain: 'client-care',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You notice that a letter you sent last week to the other side had the wrong date in it. No harm has been done, as far as you can tell.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Tell your supervisor at once, so it can be corrected and the client told if need be' },
      { id: 'b', text: 'Send a corrected letter quietly and say nothing about it to anyone at the firm' },
      { id: 'c', text: 'Wait and see whether the other side notices the mistake before saying anything' },
      { id: 'd', text: 'Say that the date was a typing error made by the administrative staff, not you' },
    ],
    correct: ['a'],
    explanation:
      'Report an error to your supervisor as soon as you see it, however small it looks. It may matter more than you think, and a quiet fix can make things worse. The firm may need to tell the client, and it can only decide that if it knows. Blaming someone else adds a second problem.',
    whyItMatters: 'Mistakes that are reported early are usually fixable; hidden ones are not.',
    concepts: ['keeping-informed'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-client-agree-update-rhythm',
    domain: 'client-care',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A client who is anxious about a long dispute rings you almost every day for news, even when nothing has happened.',
    stem: 'What is the best response?',
    options: [
      { id: 'a', text: 'Stop taking the calls, so that the client learns to stop ringing' },
      { id: 'b', text: 'Agree a regular update, such as every Friday, and keep to it' },
      { id: 'c', text: 'Tell the client that they are costing themselves money by ringing' },
      { id: 'd', text: 'Pass the client to the accounts team to handle the questions' },
    ],
    correct: ['b'],
    explanation:
      'Frequent calls usually mean the client is afraid of being left in the dark. Agree a rhythm that suits you both, such as a short update at the same time each week, plus a call whenever something real happens, and then stick to it. That meets the need behind the calls and saves time on both sides.',
    whyItMatters: 'A predictable update is often kinder, and cheaper, than reacting to calls.',
    concepts: ['responsiveness', 'expectations'],
    skills: [],
    sourceReference: SOURCE,
  },

  /* --- Negotiation -------------------------------------------------------- */
  {
    slug: 'ps-my-negotiate-prepare-the-three',
    domain: 'negotiation',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario: 'You are to join a settlement meeting tomorrow, with your supervisor leading.',
    stem: 'What should you have worked out beforehand?',
    options: [
      { id: 'a', text: 'Your opening offer, and the first reply that you will give to their opening offer' },
      { id: 'b', text: 'Your target, the lowest you would accept, and what the other side wants' },
      { id: 'c', text: 'Every weakness in the other side’s case, set out in one long and detailed list' },
      { id: 'd', text: 'A word-for-word script to read out, so that you never have to improvise' },
    ],
    correct: ['b'],
    explanation:
      'Know the outcome you are aiming for, the point at which you would rather not settle, and what the other side needs. With those you can tell a good offer from a bad one as it happens. An opening offer alone, or a script, falls apart at the first surprise.',
    whyItMatters: 'A negotiator who does not know their fallback cannot tell when to say no.',
    concepts: ['position-and-fallback'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-negotiate-compare-with-trial',
    domain: 'negotiation',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'The other side offers your client less than half of what was claimed. Your supervisor’s view is that, after costs and risk, going to trial would probably leave the client slightly better off.',
    stem: 'How should you respond to the offer?',
    options: [
      { id: 'a', text: 'Accept at once, since half is better than the risk of losing at trial altogether' },
      { id: 'b', text: 'Reject it and every later offer too, because an offer is never enough at first' },
      { id: 'c', text: 'Counter with the full claim and refuse to move from it, whatever they say next' },
      { id: 'd', text: 'Compare it with a realistic trial result after costs and risk, then advise the client' },
    ],
    correct: ['d'],
    explanation:
      'An offer is good or bad only against the client’s real alternative. Work out what trial is likely to bring after costs, delay and the chance of losing, set the offer beside it, and advise the client. The decision is theirs.',
    whyItMatters: 'Settling too cheaply and refusing a good offer are both avoidable mistakes.',
    concepts: ['position-and-fallback', 'settlement'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-negotiate-take-instructions',
    domain: 'negotiation',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You are the junior at a negotiation. The other side’s lawyer proposes terms that sound fair and asks you to agree them on the spot.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Agree if the terms seem fair, to keep the talks moving' },
      { id: 'b', text: 'Say that you will take instructions and come back' },
      { id: 'c', text: 'Agree now and tell your supervisor afterwards' },
      { id: 'd', text: 'Refuse, so that you give nothing away' },
    ],
    correct: ['b'],
    explanation:
      'You can only agree what your client has authorised, and a junior seldom has that authority alone. Say that you will take instructions and give a time for an answer. That keeps the talks alive without committing the client to something they have not seen.',
    whyItMatters: 'A deal agreed without authority can bind a client to terms they never approved.',
    concepts: ['settlement'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-negotiate-final-offer',
    domain: 'negotiation',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'At the start of talks, the other side says: "This is our final offer. Take it or leave it." It is below what your client hopes for.',
    stem: 'How do you treat that?',
    options: [
      { id: 'a', text: 'Walk out at once, since the talks cannot go anywhere after a statement like that' },
      { id: 'b', text: 'Accept it, since they have said that it is their last word and they mean it' },
      { id: 'c', text: 'As an opening position: ask for their reasons, test it, and take instructions' },
      { id: 'd', text: 'Reply with a threat of your own, so that they know that you are serious too' },
    ],
    correct: ['c'],
    explanation:
      'A "final offer" at the start is usually a position. Ask what it rests on, respond with your own reasons, and check with your client. If it is truly final, you will learn that from what they do, not from what they say.',
    whyItMatters: 'Reacting to a bluff as though it were a fact gives away value or ends talks that could have worked.',
    concepts: ['position-and-fallback'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-negotiate-write-it-down',
    domain: 'negotiation',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'After a long meeting, both sides have agreed a figure and some other terms. Everyone is tired and keen to leave.',
    stem: 'What should happen next?',
    options: [
      { id: 'a', text: 'Shake hands and go; the terms were clear enough, and a letter can follow later' },
      { id: 'b', text: 'Leave the written terms until the other side asks for them, or the client does' },
      { id: 'c', text: 'Write the agreed terms down at once and have your client confirm them' },
      { id: 'd', text: 'Tell the court only that talks have ended, with no detail about the terms' },
    ],
    correct: ['c'],
    explanation:
      'Agreements made out loud are remembered differently within days. Record the terms promptly, send them to the other side to confirm, and have your own client approve them. Follow the formalities that the type of agreement needs, and ask your supervisor if you are unsure.',
    whyItMatters: 'A settlement that is not recorded is one more dispute waiting to happen.',
    concepts: ['settlement'],
    skills: [],
    sourceReference: SOURCE,
  },

  /* --- Business development ----------------------------------------------- */
  {
    slug: 'ps-my-bd-reputation-is-the-work',
    domain: 'business-development',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    scenario: 'You have just started in practice and want to build a name.',
    stem: 'What builds a professional reputation most surely at the start?',
    options: [
      { id: 'a', text: 'Posting about every matter you work on' },
      { id: 'b', text: 'Collecting as many business cards as you can at events' },
      { id: 'c', text: 'Asking each client for referrals at the first meeting' },
      { id: 'd', text: 'Doing careful work, on time, and being easy to reach' },
    ],
    correct: ['d'],
    explanation:
      'Colleagues and clients recommend people they can rely on. Careful work delivered when promised, and prompt replies, are what is remembered. Publicity, cards and early requests for referrals add little if the work does not hold up, and some of them breach confidentiality or the profession’s rules.',
    whyItMatters: 'Everything else in building a practice rests on being dependable.',
    concepts: ['reputation'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-bd-keep-in-touch',
    domain: 'business-development',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A classmate has become in-house counsel at a company that sometimes needs outside lawyers. You have not spoken for a year.',
    stem: 'How do you keep the relationship alive?',
    options: [
      { id: 'a', text: 'Get in touch only when you are looking for work, and then ask for it plainly' },
      { id: 'b', text: 'Message every month to ask whether they have any new instructions for you' },
      { id: 'c', text: 'Stay in touch now and then, offering something useful with no request attached' },
      { id: 'd', text: 'Wait for them to contact you, since reaching out first would look rather pushy' },
    ],
    correct: ['c'],
    explanation:
      'Relationships last when they are not only about work. Share an article they would value, congratulate them on news, or suggest a coffee, and ask for nothing. When they have a need they will think of you. Monthly requests for work wear a friendship out.',
    whyItMatters: 'Most referrals come from people who already know and trust you.',
    concepts: ['relationships', 'referrals'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-bd-networking-listen',
    domain: 'business-development',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario: 'You are at an industry networking event where you know almost nobody.',
    stem: 'What approach works best?',
    options: [
      { id: 'a', text: 'Pitch your firm’s services to everyone you meet, before they can speak about themselves' },
      { id: 'b', text: 'Stay with the colleagues you came with all evening, and leave when they do' },
      { id: 'c', text: 'Hand out brochures to as many people as possible, and collect their cards in return' },
      { id: 'd', text: 'Ask people about their work and listen, then follow up with something relevant' },
    ],
    correct: ['d'],
    explanation:
      'People remember being listened to. Ask about what they do and what problems they face, and follow up in the next few days with something useful: an article, an introduction, a thank-you. Pitching at strangers, or hiding with colleagues, builds nothing.',
    whyItMatters: 'A few real conversations are worth more than a hundred cards.',
    concepts: ['relationships'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-bd-write-about-a-win',
    domain: 'business-development',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You helped win a case for a client, and you want to post about the result on social media to show what you can do.',
    stem: 'What must happen first?',
    options: [
      { id: 'a', text: 'Nothing, provided that you do not use the client’s name' },
      { id: 'b', text: 'Post it, and tell the client later if they ask about it' },
      { id: 'c', text: 'The client’s permission, and your firm’s and supervisor’s approval' },
      { id: 'd', text: 'Post it after changing the details so that nobody could tell' },
    ],
    correct: ['c'],
    explanation:
      'A client’s matter is confidential, and even a case without a name can identify them. The profession also limits how lawyers advertise. Do not post without the client’s permission and the firm’s approval, and check the current rules on publicity with your supervisor.',
    whyItMatters: 'A well-meant post can breach confidentiality and the rules on advertising at the same time.',
    concepts: ['reputation'],
    skills: [],
    sourceReference:
      'Legal Profession (Practice and Etiquette) Rules 1978 on publicity and confidentiality; check the current rules and Bar guidance',
    tentative: true,
  },
  {
    slug: 'ps-my-bd-thank-a-client',
    domain: 'business-development',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A client says that they are delighted with your work and that they would recommend the firm to their friends.',
    stem: 'What is the right response?',
    options: [
      { id: 'a', text: 'Offer a discount on fees to anyone that they send to you, to encourage them' },
      { id: 'b', text: 'Pay them a small amount for each person they introduce, as a thank-you for it' },
      { id: 'c', text: 'Thank them warmly, and tell your supervisor so that the firm can follow up properly' },
      { id: 'd', text: 'Ask for the contact details of their friends so that you can call them yourself' },
    ],
    correct: ['c'],
    explanation:
      'Thank the client, and let your supervisor know, because how the firm responds to a referral is a decision for the firm. Paying for referrals, offering inducements, or approaching people who have not asked to hear from you can breach the rules on touting and publicity.',
    whyItMatters: 'Good will earned by good work is easily lost by a clumsy ask.',
    concepts: ['referrals'],
    skills: [],
    sourceReference:
      'Legal Profession (Practice and Etiquette) Rules 1978 on touting and publicity; check the current rules and Bar guidance',
    tentative: true,
  },

  /* --- Technology fluency (existing area: ethics and AI) ------------------ */
  {
    slug: 'ps-my-tech-right-matter-folder',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You save a client’s signed letter to the document management system, and then notice that you filed it in a different client’s matter folder.',
    stem: 'What is the right thing to do?',
    options: [
      { id: 'a', text: 'Leave it where it is, as the system is searchable and so it can be found' },
      { id: 'b', text: 'Move it to the right folder, and tell your supervisor what happened' },
      { id: 'c', text: 'Delete it from both folders, and file it again later, when you have more time' },
      { id: 'd', text: 'Email it to the other client and ask whether they can see it in their folder' },
    ],
    correct: ['b'],
    explanation:
      'A document in the wrong matter may be seen by people who must not see it. Move it, tell your supervisor, and let the firm decide whether any further step is needed. Deleting it loses the record, and emailing it to the other client makes the confidentiality problem worse.',
    whyItMatters: 'Filing is a confidentiality control, not a tidiness habit.',
    concepts: ['document-management', 'ai-confidentiality'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-tech-privilege-review',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Your team uses e-discovery software to sort ten thousand documents before disclosure. The software marks about two hundred of them as "likely privileged" and the rest as "not privileged".',
    stem: 'What should happen before anything is disclosed?',
    options: [
      { id: 'a', text: 'Send everything marked "not privileged", since the tool has sorted it' },
      { id: 'b', text: 'Withhold all documents that the tool has marked as likely privileged' },
      { id: 'c', text: 'A lawyer reviews the tool’s calls, including a sample of those it cleared' },
      { id: 'd', text: 'Ask the other side to tell you which documents are privileged' },
    ],
    correct: ['c'],
    explanation:
      'A tool can sort documents; it cannot take responsibility for what goes out. A lawyer must review what it flags, and test a sample of what it clears, because a privileged document sent by mistake may be impossible to take back. The firm’s protocol and your supervisor decide the method.',
    whyItMatters: 'The cost of one privileged document disclosed by mistake can outweigh the savings from the tool.',
    concepts: ['e-discovery', 'ai-verification'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-tech-check-the-summary',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'An approved AI tool summarises a 60-page contract for you. The summary says that the notice period is 90 days. You cannot recall seeing that number in the contract.',
    stem: 'What should you do before relying on it?',
    options: [
      { id: 'a', text: 'Use it as it is, because the tool is one that the firm has approved for this work' },
      { id: 'b', text: 'Ask the tool whether it is sure about the figure, and use its answer if it says yes' },
      { id: 'c', text: 'Find the clause in the contract and check the number against it' },
      { id: 'd', text: 'Use it, but add the word “approximately” to your note, to cover any error' },
    ],
    correct: ['c'],
    explanation:
      'AI tools state wrong figures with confidence. An approved tool is one the firm accepts for use; it is not a promise that what it says is right. Go to the source, find the clause, and check it yourself, especially for numbers, dates and names.',
    whyItMatters: 'A wrong figure in a summary becomes a wrong figure in advice.',
    concepts: ['ai-verification'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-tech-ai-notetaker-on-a-call',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A colleague suggests switching on an AI note-taking tool for your call with a client, so that nobody has to write notes.',
    stem: 'What must be settled first?',
    options: [
      { id: 'a', text: 'Nothing, because the notes will only ever be seen by people inside the firm' },
      { id: 'b', text: 'Whether the firm has approved the tool and the client has agreed to it' },
      { id: 'c', text: 'Whether the tool is free, so that no extra cost falls on the client afterwards' },
      { id: 'd', text: 'Whether the call will be long enough to need notes at all, or short enough not to' },
    ],
    correct: ['b'],
    explanation:
      'Recording or transcribing a call with a client sends their confidential words to another company. Do it only with a tool your firm has approved for client work, and only if the client has been told and has agreed. Ask your supervisor first, and keep to the firm’s policy.',
    whyItMatters: 'Convenience does not change who is entitled to hear a client’s confidences.',
    concepts: ['ai-confidentiality', 'ai-client-consent'],
    skills: [],
    sourceReference:
      'The firm’s AI policy; the duty of confidentiality owed to clients; Malaysian Bar Circular No 342/2023',
    tentative: true,
  },

  /* --- Resilience and self-management ------------------------------------- */
  {
    slug: 'ps-my-resilience-critical-feedback',
    domain: 'resilience',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Your supervisor returns a draft with a lot of corrections and tells you that it was not what she wanted.',
    stem: 'What is the most useful way to respond?',
    options: [
      { id: 'a', text: 'Explain why each of your choices was reasonable, one by one, as she goes through them' },
      { id: 'b', text: 'Say little, and fix the errors without asking any questions about them afterwards' },
      { id: 'c', text: 'Listen, ask for an example of what better looks like, and apply it' },
      { id: 'd', text: 'Tell a colleague over lunch that she is hard to please and changes her mind often' },
    ],
    correct: ['c'],
    explanation:
      'Treat criticism as information. Listen, ask what she would like to see instead, ideally with an example, and then use it in the next draft. Defending each choice makes it harder to learn, and fixing the errors without understanding them means that they come back.',
    whyItMatters: 'Juniors who learn fast from feedback are trusted with more.',
    concepts: ['feedback'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-resilience-tell-someone-early',
    domain: 'resilience',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'For three weeks you have been working late almost every night. You are exhausted, and your work is starting to slip.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Say nothing and work harder, as everyone else in the team is busy as well as you' },
      { id: 'b', text: 'Tell a supervisor or mentor early, and agree how the workload is to be handled' },
      { id: 'c', text: 'Wait for your annual review, and raise the workload then, when it can be discussed' },
      { id: 'd', text: 'Resign, since the work is clearly too much for you and is unlikely to change' },
    ],
    correct: ['b'],
    explanation:
      'A heavy load that goes on is a problem to fix, not a test to endure. Tell someone you trust early, with specifics, and ask for help in prioritising or sharing the work. Most supervisors would rather know in week three than learn of it when something goes wrong.',
    whyItMatters: 'Silence about overload usually ends in mistakes or a resignation.',
    concepts: ['pressure', 'wellbeing'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-resilience-ask-for-feedback',
    domain: 'resilience',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario: 'You made your first appearance in court today, on a short procedural hearing.',
    stem: 'How should you ask for feedback?',
    options: [
      { id: 'a', text: 'Wait until your yearly review, and hear all of the feedback in one go then' },
      { id: 'b', text: 'Ask your supervisor for specific feedback on one or two things you tried' },
      { id: 'c', text: 'Ask everyone in the firm what they thought of it, and collect all of the replies' },
      { id: 'd', text: 'Assume that it went well if nobody mentions it, and go on to the next hearing' },
    ],
    correct: ['b'],
    explanation:
      'Specific questions get specific answers: "How was my opening? Should I have dealt with the costs differently?" Ask soon, while it is fresh, and ask the person who watched. A general "how did I do?" gets a polite answer, and waiting for a review is too late to improve the next hearing.',
    whyItMatters: 'Feedback is a skill to be sought, not a gift to be waited for.',
    concepts: ['feedback'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-resilience-support-for-wellbeing',
    domain: 'resilience',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You have felt anxious about work for months, you are sleeping badly, and it is getting hard to concentrate.',
    stem: 'What is the most helpful step?',
    options: [
      { id: 'a', text: 'Carry on alone, since feeling like this is a normal part of the job for lawyers' },
      { id: 'b', text: 'Use the firm’s support or a trusted person, and see a professional if it continues' },
      { id: 'c', text: 'Avoid thinking about work in the evenings, and see whether the feeling passes by itself' },
      { id: 'd', text: 'Work more hours, so that there is less to be anxious about in the first place' },
    ],
    correct: ['b'],
    explanation:
      'Lasting anxiety is a health matter, not a weakness or a work problem to push through. Talk to someone you trust, use any support your firm offers, and see a doctor or counsellor if it goes on. Lawyers who ask for help early do better, and stay in the profession longer.',
    whyItMatters: 'Looking after yourself is part of being able to look after clients.',
    concepts: ['wellbeing'],
    skills: [],
    sourceReference: SOURCE,
  },
  {
    slug: 'ps-my-resilience-learn-from-a-loss',
    domain: 'resilience',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You argued an application that you were sure you would win, and the court dismissed it. You feel low about it and are dreading the next one.',
    stem: 'What is the most constructive way forward?',
    options: [
      { id: 'a', text: 'Decide that the judge was unfair, put it out of your mind, and move on to the next matter' },
      { id: 'b', text: 'Review it with your supervisor, work out what to change, then prepare for the next one' },
      { id: 'c', text: 'Avoid arguing applications for a while, so that you do not lose in front of a judge again' },
      { id: 'd', text: 'Keep it to yourself, so that it does not count against you when your work is reviewed' },
    ],
    correct: ['b'],
    explanation:
      'Every advocate loses. What matters is what you take from it: go through the hearing with your supervisor, see what worked and what did not, and use it for the next one. Blaming the judge teaches nothing, and avoiding the work or hiding the result lets the dread grow.',
    whyItMatters: 'Resilience is what lets a young lawyer turn a bad day into a better one.',
    concepts: ['feedback', 'pressure'],
    skills: [],
    sourceReference: SOURCE,
  },
];
