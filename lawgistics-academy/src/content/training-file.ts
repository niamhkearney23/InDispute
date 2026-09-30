/**
 * The training file.
 *
 * One invented matter that every trainee carries through the month, so the
 * moot is fair, the marking is comparable, and the pleadings can be talked
 * about in the open. Every person, company, address and document in it is
 * made up. Any resemblance to a real matter is coincidence, and the page
 * that shows it says so in its first line.
 *
 * It is a set of facts, not a statement of law. Nothing here says what
 * the rules are, which court has jurisdiction, or what a deadline is: those
 * are the questions the trainee is meant to answer, and the answers are
 * the supervisor's to mark. It is built so that a lower-court civil claim
 * with a defence and counterclaim can be run from it end to end.
 *
 * Gaps are deliberate. The contract has no completion clause beyond a
 * number of weeks, the variations were never put in writing, the handover
 * date is disputed, and it is not clear whether the defects were notified
 * in writing. A file with no gaps teaches nothing about fact investigation.
 *
 * NOT YET REVIEWED BY THE FIRM. Drafted as a starting file; the firm's
 * lawyers should read it before it is put in front of an intake, and change
 * anything that would not happen in practice here.
 */

export interface FileDocument {
  /** Short heading, as it would appear on a bundle index. */
  title: string;
  date: string;
  /** Who produced it. */
  from: string;
  /** The document, as text. Paragraphs separated by blank lines. */
  body: string;
}

export interface FilePerson {
  name: string;
  role: string;
  /** What they know, and how they come across. For the lawyer playing them. */
  brief: string;
}

export const TRAINING_FILE = {
  name: 'Setia Bina Interiors Sdn Bhd v Farid Aziz (trading as Kopi Ampang)',
  shortName: 'The Kopi Ampang file',
  fictional:
    'This matter is invented for training. Every person, company, address, amount and document in it is made up. It is not based on any real matter.',

  client: {
    name: 'Encik Farid Aziz',
    description:
      'Sole proprietor of Kopi Ampang, a café at a shoplot in Ampang, Kuala Lumpur. Forty-one, former bank officer, opened the café in July 2025 after leaving his job. He is the defendant. He has been served with a writ and wants to know whether he has to pay, and whether he can claim for the defects.',
  },

  /* The client's own account, as told at the first meeting. Written as he
     would say it, with the vagueness a client actually has. */
  instructions: [
    'I got a quotation from Setia Bina in February last year to fit out the shoplot as a café. The price was RM268,000 for everything: the counter, the kitchen, the seating, the ceiling, the electrical work, the signage. It was supposed to take eight weeks from when they started. They started on 3 March 2025.',
    'I paid the deposit of RM80,400 before they started and the second payment of RM107,200 in April when they said the kitchen and ceiling were done. The last payment was supposed to be on completion.',
    'It was not finished in eight weeks. It was not finished in twelve. Mr Chong, their foreman, kept saying two more weeks. I have the WhatsApp messages. We finally got the keys back around 20 June. They say it was 6 June but nobody could have opened on 6 June, half the wiring was not done.',
    'I opened on 1 July 2025. Within a few weeks the counter top had cracked along the join, the extraction fan in the kitchen did not extract, two of the ceiling panels came down after rain, and the floor in the kitchen was not level so water pooled by the back door. I told Mr Chong on WhatsApp. He came once, looked, and said it was the building and not their work.',
    'I got another contractor, Bala, to look at it in August. He said the extraction ducting was undersized and the counter was not supported properly. He gave me a quote of RM42,000 to fix everything. I have not had it done because I could not afford it while paying the loan.',
    'They sent me the final invoice for RM80,400 at the end of June and then another invoice in July for RM106,000 for "variations". I never agreed to RM106,000 of variations. I asked for some extra shelving in the storeroom and a second sink, and Mr Chong said it would be "a bit more". That is all. Nothing was put in writing.',
    'In January this year I got a letter from their lawyers demanding RM186,400. I did not reply because I did not know what to say. Last week a man came into the café and handed me a writ and a statement of claim. That was 22 September 2026.',
    'What I want to know is: do I have to pay the RM186,400, can I claim back the RM42,000 for the defects and something for the two months I could not open, and what happens now that I have been served.',
  ],

  documents: [
    {
      title: 'Quotation No. SB/2025/031, with acceptance',
      date: '10 February 2025, accepted 17 February 2025',
      from: 'Setia Bina Interiors Sdn Bhd',
      body: `SETIA BINA INTERIORS SDN BHD
Quotation No. SB/2025/031

To: Encik Farid Aziz, Kopi Ampang
Site: Lot G-7, Jalan Ampang Mewah 3, Ampang, Kuala Lumpur

Scope of works:
1. Demolition of existing partitions and ceiling.
2. Supply and install suspended plaster ceiling with LED downlights.
3. Electrical rewiring to the café area and kitchen, including DB upgrade.
4. Supply and install front counter (solid surface top, 6.2m) with under-counter cabinets.
5. Kitchen fit-out: stainless steel benches, one sink, extraction hood and ducting to rear.
6. Flooring: tiles to café area, epoxy to kitchen.
7. Seating: 12 tables and 30 chairs as per catalogue selection.
8. Signage: front fascia sign with lighting.
9. Painting throughout.

Contract sum: RM268,000.00

Payment: 30% on acceptance (RM80,400), 40% on completion of ceiling, electrical and kitchen (RM107,200), 30% on completion (RM80,400).

Duration: 8 weeks from commencement.

Defects: Any defects notified within 3 months of completion will be rectified by us within 14 days of notice.

Variations: Additional works will be charged at cost plus 15%.

Validity: 30 days.

Accepted: (signed) Farid Aziz, 17 February 2025.`,
    },
    {
      title: 'Payment record',
      date: 'February to April 2025',
      from: 'Client’s bank statements (extract)',
      body: `18 Feb 2025  Transfer to Setia Bina Interiors Sdn Bhd  RM80,400.00  Ref: SB/2025/031 deposit
14 Apr 2025  Transfer to Setia Bina Interiors Sdn Bhd  RM107,200.00  Ref: SB/2025/031 2nd payment

No further payments to Setia Bina appear on the statements to date.`,
    },
    {
      title: 'WhatsApp messages between Farid Aziz and Chong (Setia Bina foreman), extract',
      date: '28 April 2025 to 4 August 2025',
      from: 'Client’s phone, screenshots',
      body: `28 Apr 2025, 09:12  Farid: Morning Mr Chong, today is the 8 weeks. When can I get the keys?
28 Apr 2025, 11:40  Chong: Boss sorry, electrical inspection delay. 2 more weeks max.

14 May 2025, 17:05  Farid: Any update? I have staff starting 1 June.
14 May 2025, 18:22  Chong: Kitchen hood coming next week. Then finish. 2 weeks.

30 May 2025, 08:50  Farid: Mr Chong this is very late already. My rent is running.
30 May 2025, 09:31  Chong: Understand boss. Also the extra shelving and second sink you asked, we are doing now. A bit more cost ok.
30 May 2025, 09:33  Farid: Ok but please finish.

6 Jun 2025, 16:10  Chong: Works complete boss. Can hand over.
6 Jun 2025, 16:45  Farid: Half the sockets in the front not working and the sign is not up. How is that complete?
6 Jun 2025, 17:02  Chong: Will finish sockets and sign next week.

20 Jun 2025, 14:30  Chong: Sign up, sockets done. Keys with your staff.
20 Jun 2025, 14:52  Farid: Ok thank you.

15 Jul 2025, 10:15  Farid: Mr Chong the counter top has a crack along the join near the till. And the kitchen fan is not pulling air, whole cafe smells of frying.
15 Jul 2025, 13:40  Chong: Crack is from heat, your staff put hot pot on it? Fan is ok, maybe your cooking heavy.

2 Aug 2025, 08:05  Farid: Two ceiling panels fell last night after the rain. Kitchen floor has water by back door every time we wash. Please come.
2 Aug 2025, 12:20  Chong: Ceiling is building leak, not our work. Floor also building. Will come see.

4 Aug 2025, 15:00  Chong: Came today. As I said, building problem. Not under our scope.`,
    },
    {
      title: 'Invoice No. SB/INV/2025/118 (final payment)',
      date: '30 June 2025',
      from: 'Setia Bina Interiors Sdn Bhd',
      body: `INVOICE SB/INV/2025/118
To: Farid Aziz, Kopi Ampang
Re: Quotation SB/2025/031, Lot G-7 Jalan Ampang Mewah 3

Final payment on completion (30%)  RM80,400.00

Works completed and handed over on 6 June 2025.
Payment due within 14 days.`,
    },
    {
      title: 'Invoice No. SB/INV/2025/124 (variations)',
      date: '14 July 2025',
      from: 'Setia Bina Interiors Sdn Bhd',
      body: `INVOICE SB/INV/2025/124
To: Farid Aziz, Kopi Ampang
Re: Additional works, Lot G-7 Jalan Ampang Mewah 3

1. Additional storeroom shelving, powder-coated steel, 4 bays  RM18,500.00
2. Second kitchen sink with plumbing and drainage  RM9,800.00
3. Upgrade of extraction ducting to 300mm  RM22,400.00
4. Additional electrical points, café area (14 nos)  RM11,200.00
5. Change of floor tiles to premium range as selected on site  RM30,100.00
6. Extended site supervision, 7 weeks  RM14,000.00

Subtotal  RM106,000.00
As instructed on site by the client. Payment due within 14 days.`,
    },
    {
      title: 'Inspection report',
      date: '19 August 2025',
      from: 'Balasubramaniam Renovation (En. Bala), engaged by the client',
      body: `Site: Kopi Ampang, Lot G-7 Jalan Ampang Mewah 3
Inspected: 18 August 2025, in the presence of the owner.

Findings:
1. Front counter: solid surface top cracked along the factory join near the till. The top is supported on cabinets at 1.2m centres with no intermediate support under the join. In my opinion the crack is from lack of support, not heat.
2. Kitchen extraction: hood installed with 200mm ducting over a 9m run with two bends. Airflow at the hood is weak. For a hood this size over this run, 300mm ducting is the usual minimum.
3. Ceiling: two panels fallen at the rear of the café area. There is a water stain on the slab above. The panels were fixed with clips only, no secondary wire. Cannot say from inspection whether the leak is from the roof or from the kitchen extraction outlet, which discharges near the rear wall.
4. Kitchen floor: epoxy floor falls towards the back door rather than towards the floor trap. Water pools at the door.
5. Electrical: DB is labelled, sockets tested working. No fault found.

Estimate to rectify items 1 to 4: RM42,000.00, excluding any roof repair.`,
    },
    {
      title: 'Letter of demand',
      date: '12 January 2026',
      from: 'Solicitors for Setia Bina Interiors Sdn Bhd',
      body: `Dear Sir,

RE: OUTSTANDING SUM OF RM186,400.00 DUE TO OUR CLIENT, SETIA BINA INTERIORS SDN BHD

We act for Setia Bina Interiors Sdn Bhd.

Our client carried out renovation works at Lot G-7, Jalan Ampang Mewah 3, Ampang, pursuant to Quotation No. SB/2025/031 accepted by you on 17 February 2025, together with additional works instructed by you on site. The works were completed and handed over on 6 June 2025.

Our client’s Invoice No. SB/INV/2025/118 dated 30 June 2025 for RM80,400.00 and Invoice No. SB/INV/2025/124 dated 14 July 2025 for RM106,000.00 remain wholly unpaid despite repeated reminders.

TAKE NOTICE that unless the sum of RM186,400.00 is paid to our client within fourteen (14) days of the date of this letter, our client will commence legal proceedings against you without further reference to you, and will seek interest and costs.

Yours faithfully,`,
    },
    {
      title: 'Writ and statement of claim, served',
      date: 'Served 22 September 2026',
      from: 'Setia Bina Interiors Sdn Bhd, plaintiff',
      body: `The plaintiff claims against the defendant:

(a) the sum of RM186,400.00 being the balance due under a contract for renovation works at Lot G-7, Jalan Ampang Mewah 3, Ampang, made by the defendant’s acceptance on 17 February 2025 of the plaintiff’s Quotation No. SB/2025/031, and for additional works instructed by the defendant;
(b) interest;
(c) costs.

The statement of claim pleads that the works were completed and handed over on 6 June 2025; that the defendant instructed the additional works set out in Invoice SB/INV/2025/124 on site; and that the defendant has failed to pay either invoice despite demand.

The writ bears the café’s address. The process server’s note records personal service on the defendant at the café at 11.20am on 22 September 2026.`,
    },
  ] satisfies FileDocument[],

  people: [
    {
      name: 'Farid Aziz',
      role: 'The client. Defendant.',
      brief:
        'Honest and organised about money, vague about dates and about what he actually agreed to. Kept every message. Will say he "asked for a bit of extra shelving" and admit, if pressed, that he saw the premium tiles being laid and said nothing. Does not know whether the roof leaks. Angry about the two months of rent with no income.',
    },
    {
      name: 'Aina Rosli',
      role: 'Café manager. Client’s witness.',
      brief:
        'Started on 1 June 2025 and was on site most days from then. Saw the sockets not working on 6 June and the sign going up on 20 June. Was there when the ceiling panels fell. Did not see the hot pot on the counter but cannot say it never happened. Reliable on what she saw, keen to help, inclined to say more than she knows.',
    },
    {
      name: 'Balasubramaniam (Bala)',
      role: 'Renovation contractor who inspected. Independent, engaged by the client.',
      brief:
        'Twenty years in fit-outs. Careful about what he did and did not see; will not say the ceiling leak is the contractor’s fault without opening the roof. Would quote for the repair work himself, which the other side will point out.',
    },
    {
      name: 'Chong Wei Lun',
      role: 'Setia Bina’s site foreman. The other side’s witness.',
      brief:
        'Says the client asked for everything on the variation invoice, in person, on site. Says handover was 6 June and the sockets and sign were "snagging". Says the ceiling and floor are building defects. Has no written variation orders and knows it.',
    },
  ] satisfies FilePerson[],

  /* For the coach only. What the file is built to test, so the marking has
     something to mark against. Not shown to trainees. */
  coachNotes: [
    'Handover: 6 June (plaintiff) or 20 June (client). The messages support 20 June for practical completion. Which date matters, and for what, is for the research memo.',
    'Variations: nothing in writing. The 30 May message is the only contemporaneous evidence of any instruction, and it covers shelving and a sink, not tiles, ducting or supervision. Items 3 to 6 of the variation invoice are the ones to attack; items 1 and 2 are the ones to concede.',
    'Defects: the inspection report is the client’s strongest document and its weakness is that its author would do the repair. The ceiling is genuinely uncertain. Whether the 15 July and 2 August messages amount to notice under the defects clause is a live question.',
    'The counterclaim: RM42,000 rectification, and something for the delay. The contract has no liquidated damages clause and no completion date beyond "8 weeks from commencement". What the client can prove he lost in June and July is thin, and he should be pushed on it.',
    'Procedure: served 22 September 2026. Every deadline from that date is for the trainee to work out, and the case management plan should show them working it out rather than being told.',
    'The moot: the plaintiff’s application for summary judgment on the RM80,400 final payment is the natural interlocutory fight. One side argues no triable issue on the contract sum; the other argues the defects counterclaim and the handover dispute.',
  ],
} as const;
