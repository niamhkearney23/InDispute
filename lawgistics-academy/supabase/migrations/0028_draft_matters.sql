-- =============================================================================
-- Five draft Malaysian matters, unchecked
-- =============================================================================
-- Written with AI assistance as a starting point, on invented facts. They go
-- in unpublished and unsigned, with no author recorded, so that a lawyer can
-- read each one, correct it, and sign it off in the admin area before any
-- learner sees it. Nothing here is a statement of the law until then: the
-- schema refuses to publish a matter nobody has signed off.
--
-- Re-running this file does nothing to a matter that is already there, so a
-- lawyer's corrections are never overwritten.
-- =============================================================================

insert into public.matters (slug, number, title, country, area, brief, time_limit_minutes, model_answer, sources)
values
(
  'my-statutory-demand', 1, 'A statutory demand', 'MY', 'Companies and insolvency',
  $b$Your client, Harimau Fabrication Sdn Bhd, has received a notice of demand under section 466 of the Companies Act 2016 from a supplier, Kilang Besi Utara Sdn Bhd, for RM180,000 said to be due on three invoices. The demand was served at the client's registered office nine days ago.

The client's managing director tells you the steel delivered under the second and third invoices (RM120,000 together) was the wrong grade and was rejected in writing within a week of delivery. The supplier never replied to the rejection. The first invoice (RM60,000) is not disputed, but the client says it has been short of cash since a large customer paid late.

The managing director wants to know whether the company is about to be wound up, and what it should do this week.$b$,
  45,
  $m$How a lawyer would approach it

1. Work out the clock first. A company that does not pay, secure or compound the sum within the time stated in a section 466 demand is deemed unable to pay its debts, which opens the door to a winding-up petition. Check the period the Act now gives and the current prescribed threshold, count from service, and diarise the last day. With nine days gone there is little time.

2. Separate the undisputed part from the disputed part. RM60,000 is admitted. The disputed RM120,000 turns on rejection of the goods, and there is a written rejection the supplier never answered. That is the kind of evidence a court looks for before accepting a dispute is genuine.

3. Identify the procedure. Malaysian practice does not have a separate application to set aside a statutory demand. The usual protective step is an application for an injunction to restrain the presentation of a winding-up petition, on the basis that the debt is bona fide disputed on substantial grounds. A court will also ask whether the company is solvent and whether the undisputed part has been paid or tendered.

4. Advise on the undisputed RM60,000. Paying or tendering it, or offering security, removes the easiest ground for a petition and strengthens the injunction application on the rest. If cash is short, a written proposal to pay by instalments is better than silence.

5. Write to the supplier now: set out the rejection, attach the correspondence, state that RM120,000 is disputed, and ask for an undertaking not to present a petition. Keep it factual.

6. Gather the evidence an affidavit will need: the purchase orders, specifications, delivery orders, the rejection letter and proof it was sent, and any test results on the steel.

The advice to the client, in one line: the company is not wound up by the demand itself, but it must act before the period runs out; pay or offer terms on the RM60,000, dispute the RM120,000 in writing with the evidence, and be ready to apply for an injunction if the supplier will not undertake to hold off.$m$,
  $s$Companies Act 2016, ss 465 and 466. Rules of Court 2012, O 29 (injunctions). Draft written with AI assistance, not yet checked by a lawyer.$s$
),
(
  'my-default-judgment', 2, 'Judgment in default', 'MY', 'Civil procedure',
  $b$Your client, Puan Rosnah, runs a small catering business. She tells you a sealed writ and statement of claim from a party-hire company, Majlis Ceria Enterprise, were left with her son at her house five weeks ago. She thought it was a sales letter and put it in a drawer. Yesterday she received a judgment in default of appearance for RM46,500, with costs.

She says she never agreed the price claimed. She hired tents and chairs for a wedding, but half the chairs never arrived, she complained by WhatsApp on the day, and the company's manager replied that they would "sort out the bill later". She has the messages.

She wants the judgment gone.$b$,
  40,
  $m$How a lawyer would approach it

1. Read the judgment and the court file before anything else: which court, the date of service on the affidavit of service, the date the judgment was entered, and on what basis.

2. Identify the procedure. A judgment entered in default of appearance can be set aside by the court under the Rules of Court 2012 (O 13 r 8), on application by summons supported by an affidavit.

3. Ask whether the judgment is regular or irregular. If service was not properly effected, or the judgment was entered too early, it is irregular and the defendant is generally entitled to have it set aside. Check how the writ was served (leaving it with a family member at home may or may not be good service depending on the mode used) and count the days allowed to enter appearance from the date of service.

4. If it is regular, the client needs to show a defence on the merits: an issue that deserves to be tried. Here, the missing chairs, the complaint on the day and the manager's reply about sorting out the bill go to the amount claimed. Exhibit the messages.

5. Explain the delay honestly in the affidavit. Courts look at how promptly the application is made once the defendant knows of the judgment. File quickly, and ask for a stay of execution in the meantime if enforcement is threatened.

6. Prepare the draft defence to exhibit, so the court can see the defence is real.

The advice to the client, in one line: the judgment can be challenged, but she must move now; we will check whether it was properly obtained, and if it was, we will ask the court to set it aside because she has a real defence on the amount, supported by her messages.$m$,
  $s$Rules of Court 2012, O 12, O 13 r 8. Draft written with AI assistance, not yet checked by a lawyer.$s$
),
(
  'my-limitation', 3, 'An old debt', 'MY', 'Limitation',
  $b$A new client, Encik Farid, lent RM75,000 to a former business partner, Mr Tan, under a written loan agreement signed in March 2019. The full sum was repayable in one lump on 1 March 2020. Mr Tan paid nothing.

In June 2023 Mr Tan sent Encik Farid a WhatsApp message: "I know I owe you the 75k, give me until end of year." Nothing more was paid. Encik Farid has now come to you, in October 2026, asking to sue.

He wants to know if it is too late.$b$,
  35,
  $m$How a lawyer would approach it

1. Identify the cause of action and when it accrued. This is a claim in contract for a debt. The cause of action accrued when the money became repayable and was not paid: 1 March 2020.

2. Identify the limitation period. Under the Limitation Act 1953 (Peninsular Malaysia), an action founded on a contract may not be brought after six years from the date on which the cause of action accrued. Six years from 1 March 2020 ends on 1 March 2026, so on that count the claim is already out of time in October 2026.

3. Look for anything that restarts the clock. The Act provides that where a debt is acknowledged in writing signed by the person liable, the right of action is treated as accruing on the date of the acknowledgment. The June 2023 message admits the debt. If it qualifies as a signed written acknowledgment, time runs afresh from June 2023 and the claim is in time until June 2029.

4. That turns on the message. Check the exact words, that it clearly came from Mr Tan's number, and whether an electronic message satisfies the requirements of writing and signature. Preserve it properly: screenshots, the phone itself, and the chat export.

5. Check the place. If the parties or the transaction are in Sabah or Sarawak, the limitation law there is different and must be checked separately.

6. Act promptly either way: send a letter of demand, then file.

The advice to the client, in one line: on the original dates the claim would be out of time, but Mr Tan's 2023 message admitting the debt is likely to restart the clock, so the claim can probably still be brought; we need to secure that message and issue soon.$m$,
  $s$Limitation Act 1953, ss 6 and 26. Draft written with AI assistance, not yet checked by a lawyer.$s$
),
(
  'my-summary-judgment', 4, 'A defence that does not hold', 'MY', 'Civil procedure',
  $b$Your firm acts for Sinar Logistik Sdn Bhd, which delivered goods for a retailer, Kedai Rumah Hijau Sdn Bhd, for twelve months. Kedai Rumah Hijau stopped paying in the last three months and owes RM212,400 on invoices it signed for on delivery. Its finance manager confirmed the amount in an email in August.

You issued a writ. The defendant entered appearance and has now filed a two-paragraph defence saying only that "the Defendant denies being indebted to the Plaintiff and puts the Plaintiff to strict proof".

Your partner asks you how to bring this to an end without a full trial.$b$,
  45,
  $m$How a lawyer would approach it

1. Identify the procedure: summary judgment under Order 14 of the Rules of Court 2012. It is available where the defendant has entered appearance, and the plaintiff says there is no defence to the claim.

2. Prepare the application: a summons in Form 14 (check the current form), supported by an affidavit verifying the facts and stating the deponent's belief that there is no defence. Exhibit the signed delivery orders, the invoices, the statement of account, and the finance manager's email confirming the amount.

3. Understand the test. Once the plaintiff shows a prima facie case, the burden moves to the defendant to show a triable issue or some other reason for a trial. A bare denial, as here, is generally not enough; the court looks for a real dispute supported by facts.

4. Watch the timing. Check the time limits in Order 14 for filing the application after the defence is served, and diarise them.

5. Expect the defendant to respond with an affidavit raising new points (quality, set-off, a disputed rate). Prepare for that: are any of those points answered by the signed delivery orders and the August email?

6. Ask for interest and costs in the summons, and consider whether part of the claim should be pursued separately if a genuine dispute appears on part only.

The advice, in one line: apply for summary judgment under Order 14 now, with the signed documents and the August email; a bare denial does not raise a triable issue.$m$,
  $s$Rules of Court 2012, O 14. Draft written with AI assistance, not yet checked by a lawyer.$s$
),
(
  'my-interim-injunction', 5, 'Stop the sale', 'MY', 'Injunctions',
  $b$Your client, Dr Leela, is one of two equal shareholders and directors of a clinic company, Klinik Seri Pagi Sdn Bhd. She learned this morning that the other director has signed an agreement to sell the clinic's only premises to his brother-in-law for well below market value. Completion is set for Friday, four days away. No board meeting was held and Dr Leela was not told.

She has the land search, a valuation from last year, and a message from the clinic's accountant mentioning the sale.

She wants it stopped before Friday.$b$,
  45,
  $m$How a lawyer would approach it

1. Identify the procedure: an application for an interim injunction under Order 29 of the Rules of Court 2012, made urgently and, if necessary, ex parte first, given the four days. An ex parte injunction is short-lived and is followed by an inter partes hearing.

2. Identify the underlying claim the injunction protects. The injunction is not free-standing: there must be a cause of action, for example breach of directors' duties, lack of authority to sell without a board resolution, or a shareholder's remedy. A writ or originating process should be filed with, or immediately after, the application.

3. Apply the test the Malaysian courts follow for interim injunctions: is there a bona fide serious issue to be tried; where does the balance of convenience lie, including whether damages would be an adequate remedy; and the court's overall sense of where the least injustice lies. Land is usually treated as unique, which helps on adequacy of damages.

4. Full and frank disclosure. On an ex parte application the client must put everything material before the court, including points against her. Failure can lose the injunction.

5. The undertaking as to damages. The court will usually require the applicant to undertake to pay damages if the injunction turns out to have been wrongly granted. Explain this to Dr Leela, and check she can stand behind it.

6. Evidence by Friday: an affidavit exhibiting the land search, the valuation, the accountant's message, the company's constitution on directors' powers, and any minutes. Consider also lodging a private caveat if there is a caveatable interest, and writing to the purchaser putting them on notice.

The advice, in one line: we can ask the court for an urgent injunction to stop completion, on the basis that the sale was not authorised and is at an undervalue, but she must give an undertaking as to damages and we must disclose everything relevant.$m$,
  $s$Rules of Court 2012, O 29. Companies Act 2016 (directors' duties). Draft written with AI assistance, not yet checked by a lawyer.$s$
)
on conflict (slug) do nothing;
