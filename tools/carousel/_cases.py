T = lambda w: f'<span class="term">{w}</span>'
CASES = [
("guss","Victorian Legal Services Board v Guss (Penalty) [2026] VSC 529 &middot; Finanzio J &middot; 20 August 2026",True,[
 ("A Case Study","lg","He is 88. He is going to prison for <em>seven days.</em>","SUB:Over a password he could have handed over in ten minutes."),
 ("The Facts","md","A manager was put in charge of his law practice.","BODY:<p>When a solicitor is under investigation, the regulator can appoint someone to run the practice so clients are not left stranded.</p><p>The court ordered him to give that manager the password to the email account he ran the practice from. He refused.</p>"),
 ("The Question","md","Is refusing a court order a <em>crime?</em>","BODY:<p>It is called "+T("contempt")+". Usually it is treated as a civil matter, and the point is just to force compliance.</p><p>It turns criminal when the refusal is deliberate defiance.</p>",
  "GLOSS:Contempt||Disobeying a court order, or interfering with the work of a court. It can be punished with a fine or with prison, even though it is not a crime anyone charges you with."),
 ("The Ruling","md","Conviction recorded. Forty five days.","BODY:<p>Seven days to actually serve. The other 38 were "+T("suspended")+".</p><p>At the penalty hearing his own IT expert said compliance would take ten minutes. He handed the password over that afternoon.</p>",
  "GLOSS:Suspended||The sentence is imposed but not served, so long as you stay out of trouble. Break that and it can be activated.",
  "LEARN:Learn this: an appeal does not pause an order. Until a court sets it aside, you obey it."),
 ("Why It Matters","md","Courts expect <em>more</em> of lawyers, not less.","BODY:<p>His age and experience counted against him, not for him, because a lawyer of all people should know what a court order is.</p><p>He had also stopped practising, so a fine would have meant nothing.</p>")]),

("bogo","DPP v Bogojevska [2026] VSC 534 &middot; Forbes J &middot; 20 August 2026",False,[
 ("A Case Study","lg","She pleaded guilty. The sentence turned on what came <em>after.</em>","SUB:Supreme Court of Victoria, 20 August 2026."),
 ("The Facts","md","An 85 year old neighbour died of a blocked airway.","BODY:<p>She pleaded guilty to "+T("manslaughter")+". She then hid the body for about a day, stole from the woman, used her bank card, and left her beside a river.</p>",
  "GLOSS:Manslaughter||An unlawful killing where there was no intention to kill. It carries a maximum of 25 years in Victoria."),
 ("The Question","md","How much does the <em>aftermath</em> count?","BODY:<p>The guilty plea accepted that the death was not intended. So the act itself was never going to set the sentence on its own.</p>"),
 ("The Ruling","md","Eight years. Six before parole.","BODY:<p>Without the guilty plea it would have been nine. She had already spent 755 days in custody, which counts towards it.</p><p>Six years is the "+T("non-parole period")+".</p>",
  "GLOSS:Non-parole period||The minimum you must serve before release can even be considered. It is not a release date, it is the earliest possible one.",
  "LEARN:Learn this: hiding or disposing of a body after a killing is treated as making the crime itself worse."),
 ("Why It Matters","md","Sentencing is not a <em>formula.</em>","BODY:<p>A brutal childhood, kidney failure in custody, an early guilty plea, and no real remorse. All of it weighed together, at once, by one judge.</p>")]),

("rm","RM v DPP [2026] VSC 544 &middot; Croucher J &middot; 21 August 2026",True,[
 ("A Case Study","lg","Ten months in detention. <em>Set aside.</em>","SUB:He was seventeen. He had already served five months."),
 ("The Facts","md","Stolen cars. Weapons. A loaded sawn off shotgun.","BODY:<p>The Children&rsquo;s Court sent him to a youth justice centre for ten months. He appealed.</p><p>By the time the appeal was heard he had served half of it.</p>"),
 ("The Question","md","Was locking him up the <em>right</em> answer?","BODY:<p>A youth appeal is "+T("heard completely fresh")+". And the law says a court must not pick a heavier sentence if a lighter one will do the job.</p>",
  "GLOSS:Heard completely fresh||Called a hearing de novo. The judge decides the sentence again from scratch, rather than hunting for a mistake in the court below."),
 ("The Ruling","md","Released. No conviction recorded.","BODY:<p>A six month supervision order with conditions for drugs, mental health and offending. The drug charges were dismissed outright. A TAFE place starts next month.</p><p>"+T("No conviction")+" matters more than it sounds.</p>",
  "GLOSS:No conviction recorded||He is still found guilty, but no conviction goes on his record. It is the difference between a mistake at seventeen and a lifelong tag on job applications.",
  "LEARN:Learn this: for children, the lightest sentence that will do the job is the only lawful one."),
 ("Why It Matters","md","Rehabilitation is a purpose of sentencing, not a <em>soft option.</em>","BODY:<p>The judge found more time inside carried a real risk of undoing the progress he had already made.</p>")]),

("marriott","Marriott v Grigorovitch [2026] VSC 535 &middot; Goulden AsJ &middot; 21 August 2026",False,[
 ("A Case Study","lg","She says she was assaulted at a <em>branch meeting.</em>","SUB:Then she sued the members who did not stop it."),
 ("The Facts","md","A political party meeting, October 2023.","BODY:<p>She alleges another member assaulted her. She sued him, and she also sued two <b>fellow members</b> for negligence, saying they should have protected her.</p>"),
 ("The Question","md","Do members of a club owe each other a <em>duty of care?</em>","BODY:<p>A political party is an "+T("unincorporated association")+". There is no automatic duty between its members. She had to build one from ordinary negligence principles.</p>",
  "GLOSS:Unincorporated association||A group with no legal existence separate from its members. A party, a club, a society. Nobody is the company, so nobody is automatically responsible."),
 ("The Ruling","md","One claim gone. One survives.","BODY:<p>Against the office holder, no real prospect: he never attended, knew nothing, promised nothing.</p><p>Against the other member, a real prospect, but the pleading was "+T("struck out")+".</p>",
  "GLOSS:Struck out||The written claim is cancelled because it is too vague to answer. The case itself can continue, but it has to be rewritten properly first.",
  "LEARN:Learn this: what turns a relationship into a duty is knowledge, plus taking responsibility."),
 ("Read This Twice","md","Nothing has been <em>decided.</em>","BODY:<p>The assault is alleged, not proven. This ruling was only about whether the claims are allowed to go forward at all.</p>")]),

("keycon","Keycon Pty Ltd v Modi [2026] VSC 533 &middot; Gray J &middot; 19 August 2026",True,[
 ("A Case Study","lg","He asked to move the hearing at <em>6:06pm</em> the night before.","SUB:It was refused. He appealed. He lost."),
 ("The Facts","md","A builder, and a $112,000 defects claim.","BODY:<p>The case was in "+T("VCAT")+". The director meant to run it could not attend, because his son was having surgery that day.</p><p>He emailed the evening before.</p>",
  "GLOSS:VCAT||The Victorian Civil and Administrative Tribunal. Cheaper and less formal than court, and where most consumer, tenancy and building disputes actually end up."),
 ("The Question","md","Was refusing to move it <em>unfair?</em>","BODY:<p>Every court and tribunal must give you a real chance to be heard. Refusing to postpone can breach that.</p>"),
 ("The Ruling","md","No. Permission to appeal refused.","BODY:<p>The hearing had been booked <b>seven months</b> ahead. No defence filed, no evidence filed. And the company never said what it would have argued if it had got the extra time.</p>",
  "LEARN:Learn this: to win on a refused adjournment, show what you would have said, and that it might have changed the result."),
 ("Why It Matters","md","It had a fair chance. It just did not <em>take</em> it.","BODY:<p>A court has to give you a reasonable opportunity to be heard. It does not have to make you ready to use it.</p>")]),

("coolbreeze","Re Cool Breeze Clothing Pty Ltd (No 1) [2026] VSC 530 &middot; Attiwill J &middot; 19 August 2026",False,[
 ("A Case Study","lg","They served the expert report <em>during the trial.</em>","SUB:It did not go well."),
 ("The Facts","md","A collapsed company, and who got paid first.","BODY:<p>"+T("Liquidators")+" sued to claw back payments made before the collapse. Whether the group could have borrowed money was central.</p><p>On day one of the trial, the defendants asked to add a new banking expert.</p>",
  "GLOSS:Liquidators||The people appointed to wind up a failed company, sell what is left, and share it among creditors. They can sue to undo payments made on the way down."),
 ("The Question","md","Can you add an expert <em>that</em> late?","BODY:<p>Only with the court&rsquo;s permission. It weighs the excuse for the delay, the unfairness to the other side, and the cost to everyone waiting for a courtroom.</p>"),
 ("The Ruling","md","Permission refused.","BODY:<p>The delay was long and badly explained. The other side would have needed their own expert, and the trial would have been adjourned "+T("part heard")+" for months.</p>",
  "GLOSS:Part heard||A trial that has started but not finished. Stopping one halfway is expensive, and getting the same judge and barristers back in a room can take a year.",
  "LEARN:Learn this: the harm to the other side and to the court&rsquo;s waiting list can outweigh the harm to you."),
 ("Why It Matters","md","Deadlines decide <em>cases.</em>","BODY:<p>Courts used to let almost anything in late if costs could fix it. Not any more. A party can now lose a good point purely because it arrived too late.</p>")]),

("lam","Lam v Leung (Costs) [2026] VSC 540 &middot; Attiwill J &middot; 21 August 2026",True,[
 ("A Case Study","lg","Both sides won. Both sides <em>paid.</em>","SUB:A costs ruling that splits neatly in two."),
 ("The Facts","md","One appeal. Two fights about documents.","BODY:<p>Both were about "+T("discovery")+". The first sought documents from the other side. The second went after a company that was not even a party.</p>",
  "GLOSS:Discovery||The stage where each side must hand over the documents relevant to the case, including the ones that hurt them. It is usually the most expensive part of a civil case."),
 ("The Question","md","Who pays when each side wins <em>half?</em>","BODY:<p>Normally the cost of a mid-case argument just gets rolled into the final bill. The court can decide otherwise.</p>"),
 ("The Ruling","md","Split. One each.","BODY:<p>He pays her costs of the fight he lost. She pays his, and the outside company&rsquo;s, for the application she abandoned and should never have brought.</p>",
  "LEARN:Learn this: costs follow the result, and the result can be each separate application rather than the case as a whole."),
 ("Why It Matters","md","Side arguments are where the <em>bill</em> is made.","BODY:<p>Students treat costs as a footnote. Clients never do. A fight about documents can cost more than the trial.</p>")]),

("doran","Doran v Astrazeneca Pty Ltd [2026] VSC 536 &middot; Keogh J &middot; 20 August 2026",False,[
 ("A Case Study","lg","Three class actions. Papers filed, never <em>sent.</em>","SUB:And the court let them stay alive."),
 ("The Facts","md","Filed July 2025. Still not served a year later.","BODY:<p>Three "+T("class actions")+" over a group of common heartburn medications. The papers were filed to protect people&rsquo;s rights while investigations continued.</p>",
  "GLOSS:Class action||One case run on behalf of a whole group of people harmed the same way. You can be part of one without ever filing anything yourself."),
 ("The Question","md","Can a case be kept alive without <em>serving</em> it?","BODY:<p>A "+T("writ")+" is only good for a year. A court can extend it, but only for a real reason.</p>",
  "GLOSS:Writ||The document that starts a court case. Filing it stops the clock on a deadline. Serving it, meaning formally delivering it, is what actually brings the other side in."),
 ("The Ruling","md","Extended. Another twelve months.","BODY:<p>The application was made in time, the investigations were genuine and ongoing, and several companies are overseas and must be served under an international treaty.</p>",
  "LEARN:Learn this: filing a case is not the same as starting it. Service is what counts, and it has a deadline too."),
 ("Why It Matters","md","The clock drives <em>everything.</em>","BODY:<p>These cases exist in this form because a time limit was closing in. A great deal of litigation strategy is arithmetic about dates.</p>")]),
]
