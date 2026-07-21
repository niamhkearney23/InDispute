// =====================================================================
// COURT UPDATE  --  "Young Lawyers' Edition" newsletter
// =====================================================================
//
// Turns a structured edition (array of case objects) into a branded
// HTML email in the firm's navy-and-gold house style, written for
// junior lawyers: hook headline first, case name second, then the
// story, the holding in one sentence, and a "why you care" practice
// point. Recurring segments: Obiter of the Week and By the Numbers.
//
// The renderer is pure JavaScript (no Apps Script services), so the
// same file can be run under Node to generate a static preview.
//
// Usage inside Apps Script:
//   sendCourtUpdateTest('you@firm.com')   -> emails the latest edition
//
// Editorial rules baked into the data below:
//   - Every figure, citation and quote comes from the source brief;
//     nothing is invented. Verify against the judgments before any
//     official circulation.
//   - Humour comes from the facts and the courts' own words, never
//     from mocking a party or bending the law.
// =====================================================================

var COURT_UPDATE_FROM_NAME = 'Thomas Philip Advocates & Solicitors';

var EDITION_20260720 = {
  date: '20 July 2026',
  edition: "The Young Lawyers' Edition",
  strapline: '8 decisions · 5 minutes · zero headnotes',
  intro: 'We read eight judgments from the Court of Appeal and the High Courts so you don’t have to. ' +
         'Here is what actually matters on Monday morning — the stories, the holdings, and what to do differently because of them.',
  subject: 'Court Update · 20 July 2026 — the RM42m email that wasn’t, six BMWs with no cover, and a grievance in search of a case',
  obiter: {
    quote: 'A grievance in search of a case.',
    context: 'The High Court at Kuala Lumpur (Arziah binti Mohamed Apandi J), striking out a will-forgery claim ' +
             'supported by nothing more than the plaintiff’s own eyesight — case 3 above.'
  },
  numbers: [
    { value: 'RM42.3m', label: 'claimed in cancellation charges — dismissed (case 6)' },
    { value: 'RM9,459.14', label: 'what the claimant was ordered to pay instead (case 6)' },
    { value: 'RM300,000', label: 'global defamation award after the Court of Appeal raised it (case 1)' },
    { value: '14 days', label: 'to find RM50,000 security — or the whole suit dies (case 2)' },
    { value: '6 BMWs', label: 'destroyed in one overturned trailer, with no transit indemnity (case 4)' },
    { value: '12 policies', label: 'whose payouts were clawed back into an intestate estate (case 5)' }
  ],
  cases: [
    {
      hook: 'The RM300,000 front page',
      tags: ['📰 Defamation', '⚖️ Court of Appeal', '🔥 Damages raised'],
      name: 'Star Media Group Bhd & Ors v Jason Jonathan Lo',
      citation: 'B-02(NCvC)(W)-2076 & 2096-12/2023 · Court of Appeal · Collin Lawrence Sequerah JCA (now FCJ), Faizah binti Jamaludin JCA, Ong Chee Kwan JCA',
      story: 'A national daily ran two articles pinning allegations of serious criminal misconduct on an identifiable man — ' +
             'and could not prove them. The High Court awarded him RM200,000. The Court of Appeal decided that was not enough, ' +
             'and threw in a mandatory retraction in The Star and on The Star Online for good measure.',
      courtSaid: 'Justification and qualified privilege only protect responsible journalism — publishing unproven allegations ' +
                 'of serious crime is not that. General damages went up to a global RM300,000, though the refusal of aggravated ' +
                 'and exemplary damages (and of a compelled apology) stood, and the paper’s cross-appeal on liability was dismissed.',
      whyYouCare: 'Two takeaways for the price of one. If you act for publishers: the responsible-journalism standard has real teeth, ' +
                  'and “we reported the allegation” is not a defence to unproven claims of crime. If you draft pleadings: ' +
                  'English impugned words reproduced verbatim in an otherwise Bahasa Malaysia pleading, without translation, ' +
                  'do not nullify the claim — substance prevails over form, and the Rekha Munisamy line did not defeat the action.',
      outcome: 'ALLOWED IN PART'
    },
    {
      hook: 'One defendant asked for security. The whole suit is now on the line.',
      tags: ['⏳ 14-day deadline', '💣 Automatic strike-out', '💰 Security for costs'],
      name: 'Dato’ Richard Dilaan Morais v Raam Kumar & Ors',
      citation: 'AA-22NCvC-34-04/2024 · High Court of Malaya at Ipoh · Moses Susayan J',
      story: 'The plaintiff has been an undischarged bankrupt since 2013 — which is a problem when you’re suing several ' +
             'defendants who would like their costs back if they win. Only the 4th defendant applied for security. ' +
             'The order it got protects everyone.',
      courtSaid: 'RM50,000 in security within 14 days, failing which the entire action against all defendants is automatically ' +
                 'struck out on day 15, no further order required. Where the claims are so intertwined that a partial strike-out ' +
                 'would give the applicant “no meaningful protection”, the whole-action sanction is proportionate.',
      whyYouCare: 'If you act for one of several defendants against an impecunious or bankrupt plaintiff, your security application ' +
                  'may be able to carry a whole-action sanction — the plaintiff cannot ring-fence the rest of the suit just because ' +
                  'only your client asked. And if you act for the plaintiff: diarise that deadline like your practising certificate depends on it.',
      outcome: 'ALLOWED'
    },
    {
      hook: '“A grievance in search of a case”',
      tags: ['🪦 Probate', '✂️ Struck out pre-trial', '🔍 No particulars'],
      name: 'Manjula a/p Manikah v Sharmila Nageswaran',
      citation: 'WA-22NCvC-674-11/2025 · High Court of Malaya at Kuala Lumpur · Arziah binti Mohamed Apandi J',
      story: 'The youngest daughter said her late parent’s Rockwills will was forged and the testator lacked capacity. ' +
             'Her evidence of forgery: her own eyesight. Her medical evidence of incapacity: none. ' +
             'The prayers also named the wrong deceased person.',
      courtSaid: 'Struck out in its entirety before trial. The threshold for striking out is deliberately high — ' +
                 'but a claim built on conclusions rather than facts, suspicion rather than evidence, and aspersions rather than ' +
                 'particulars fails even that generous test.',
      whyYouCare: 'Fraud and forgery are the easiest things to allege and the hardest to plead properly. If you’re challenging a will: ' +
                  'particulars, an expert or documentary basis, medical records for incapacity — and proofread the prayers, ' +
                  'because misnaming the deceased is the kind of detail a strike-out application feasts on.',
      outcome: 'STRUCK OUT'
    },
    {
      hook: 'Six new BMWs, one overturned trailer, no indemnity',
      tags: ['🚛 Goods-in-transit', '🧾 Escape clause', '🔁 Subrogation'],
      name: 'BLG Swift Logistics Sdn Bhd v Pantrans Haulage Sdn Bhd (Tokio Marine Insurans, Third Party)',
      citation: 'WA-22NCvC-1012-12/2019 · High Court of Malaya at Kuala Lumpur · Raja Ahmad Mohzanuddin Shah J',
      story: 'A trailer carrying six new BMWs overturned between Kulim and Port Klang. The haulier had already lost the negligence ' +
             'claim, so it turned to its goods-in-transit insurer for indemnity — which pointed calmly at the ' +
             '“other insurance” escape clause.',
      courtSaid: 'Third-party claim dismissed. The cargo interest’s insurer (Lonpac) had already paid and taken subrogation, ' +
                 'so the non-contribution / escape clause was engaged and the GIT policy did not respond to the indemnity claimed.',
      whyYouCare: 'Before advising a haulier that “the insurer will pick this up”, read the non-contribution clause. ' +
                  'Once the goods-owner’s own insurer has paid and stepped into the claim, your client’s transit cover ' +
                  'may be out of the picture entirely — and the haulier is left holding the judgment alone.',
      outcome: 'DISMISSED'
    },
    {
      hook: 'Being the named nominee doesn’t make it your money',
      tags: ['🧾 12 policies', '⚖️ Statutory trust', '🏛️ Order 80'],
      name: 'Chung Soh Eng v Chung Yang Huang & Ors',
      citation: 'WA-24NCvC-5928-12/2025 · High Court of Malaya at Kuala Lumpur · Nixon anak Kennedy Kumbong JC',
      story: 'A man died intestate, and the proceeds of twelve insurance policies — nine of them AIA life policies — ' +
             'were paid out to the named nominees. No assignment was ever made. One nominee quietly handed the money back. ' +
             'The rest were sued by an estate beneficiary under Order 80.',
      courtSaid: 'Allowed. Absent a valid assignment, a nominee outside the protected class holds the proceeds as executor or ' +
                 'trustee for the estate under Schedule 10 of the Financial Services Act 2013 — not beneficially. ' +
                 'Pay it back, with accounts and disclosure by affidavit.',
      whyYouCare: 'Clients routinely believe a nomination is estate planning. It isn’t — outside the protected class, ' +
                  'the nominee is a statutory trustee, and an estate beneficiary can use Order 80 as a fast preservatory route ' +
                  'to claw the proceeds back before administration even begins. Useful sword; sobering client-advice point.',
      outcome: 'ALLOWED'
    },
    {
      hook: 'The RM42 million email that wasn’t a variation',
      tags: ['✈️ Aircraft charter', '📉 Formalities matter', '💸 Costs pain'],
      name: 'P-Cube Aviation Pte Ltd v J&T International Logistics (Malaysia) Sdn Bhd',
      citation: 'WA-27NCC-28-05/2024 · High Court of Malaya at Kuala Lumpur (Commercial Division) · Quay Chew Soon J',
      story: 'The charterer used the aircraft arrangement exactly once. The owner claimed RM42,315,000 in cancellation charges, ' +
             'resting a “guaranteed minimum of four flights daily” on a variation it said was made by a 9 October 2022 email. ' +
             'The case ended with money flowing the other way.',
      courtSaid: 'Claim dismissed. Clause 3 of the charter permitted variation of the schedule, route and aircraft type only — ' +
                 'not the rate, the guaranteed minimum or the minimum weight — and the clause 18(d) formalities were never satisfied, ' +
                 'so the email could not operate as a variation. The claimant was ordered to pay the RM9,459.14 counterclaim ' +
                 'with 5% interest, plus RM50,000 costs.',
      whyYouCare: 'A variation clause covers what it says it covers — you cannot import words into it, however large the invoice ' +
                  'built on top. Before pleading a varied term, check (1) whether the clause reaches that term at all and ' +
                  '(2) whether the prescribed variation procedure was actually followed. An email trail is not a substitute for either.',
      outcome: 'DISMISSED'
    },
    {
      hook: 'The defence nobody turned up to defend',
      tags: ['🏚️ Liquidation', '📄 Abandoned defence', '🛠️ O.34 r.6(1)'],
      name: 'Tan Kok Aun & Anor v Prolific Properties Sdn Bhd (in liquidation)',
      citation: 'MA-22NCvC-25-04/2024 · High Court of Malaya at Melaka · Dato’ Sri Raja Segaran JC',
      story: 'The defendant company was wound up in 2024, after which it could act only through its liquidators. ' +
             'A defence sat on the file — but despite exhaustive, acknowledged notice, no one with authority maintained it. ' +
             'The plaintiffs asked for judgment on RM285,923.83 anyway.',
      courtSaid: 'Granted. With section 471(1) Companies Act 2016 leave already in hand, the abandoned defence was struck out ' +
                 'under Order 34 rule 6(1) read with Order 92 rule 4, and judgment entered on the unchallenged affidavit evidence — ' +
                 'the Court will not read the Rules to leave a claimant without a remedy.',
      whyYouCare: 'A defence is not a shield by mere existence on the file — someone with authority has to keep maintaining it. ' +
                  'Acting against a company in liquidation: get your s 471 leave, put the liquidators on full notice, then move on the ' +
                  'abandoned defence. Instructed by liquidators: parking a defended file is how judgments get entered behind you.',
      outcome: 'GRANTED'
    },
    {
      hook: 'Unopposed is not the same as automatic',
      tags: ['🏢 Winding-up', '🧱 Petition dismissed', '📋 Plead the limb'],
      name: 'Koperasi Tunas Muda Sungai Ara Bhd v Hype Lifestyle Sdn Bhd',
      citation: 'MA-28NCC-23-04/2026 · High Court of Malaya at Melaka · Dato’ Sri Raja Segaran JC',
      story: 'A creditor holding a Sessions Court default judgment presented a winding-up petition. Nobody opposed it. ' +
             'It looked like a walkover — right up until the Court read the petition.',
      courtSaid: 'Dismissed. The petition never identified or proved which limb of section 466(1) it relied on ' +
                 '(such as an unsatisfied statutory demand). A winding-up order operates in rem, so an unopposed petition attracts ' +
                 'stricter scrutiny, not lighter — and a defect going to the statutory ground itself cannot be cured by adjournment. ' +
                 'Dismissal was without prejudice to a fresh, properly framed petition.',
      whyYouCare: 'A judgment debt alone does not wind a company up. Serve the statutory demand, plead the specific s 466(1) limb, ' +
                  'and prove it — even (especially) when nobody shows up on the other side. The good news for your client: ' +
                  'a properly framed re-petition remains open.',
      outcome: 'DISMISSED'
    }
  ],
  footer: 'Prepared from our reading of the judgments listed above. Figures and citations should be verified against the ' +
          'sealed judgments before being relied on or circulated further. This update is general information, not legal advice.'
};

// =====================================================================
// RENDERER  --  pure JS, no Apps Script services
// =====================================================================

var CU_NAVY = '#0F1720';
var CU_GOLD = '#B89554';
var CU_CREAM = '#F5F3EF';
var CU_INK = '#2c3440';

function cuOutcomeColor_(outcome) {
  var o = String(outcome || '').toUpperCase();
  if (o.indexOf('DISMISS') >= 0 || o.indexOf('STRUCK') >= 0) return '#8A3B3B';
  if (o.indexOf('PART') >= 0) return '#8A6D3B';
  return '#3B6E4F';
}

function cuTagChips_(tags) {
  return (tags || []).map(function (t) {
    return '<span style="display:inline-block;background:#F0EBDF;color:#6B5B33;border:1px solid #E0D6C0;' +
           'border-radius:12px;padding:2px 10px;font-size:11px;font-family:-apple-system,system-ui,sans-serif;' +
           'margin:0 6px 6px 0;letter-spacing:0.3px;">' + t + '</span>';
  }).join('');
}

function cuSection_(label, html) {
  return '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + CU_GOLD + ';' +
         'font-family:-apple-system,system-ui,sans-serif;margin:18px 0 4px;">' + label + '</div>' +
         '<div style="font-size:15px;line-height:1.7;color:' + CU_INK + ';">' + html + '</div>';
}

function cuCaseBlock_(c, i) {
  return (
    '<div style="padding:32px 40px;border-top:1px solid #EAE5D9;">' +
      '<div style="font-family:-apple-system,system-ui,sans-serif;font-size:12px;color:#999;margin-bottom:8px;">' +
        'CASE ' + (i + 1) + ' OF 8' +
        '<span style="float:right;color:' + cuOutcomeColor_(c.outcome) + ';font-weight:bold;letter-spacing:1px;">' +
          c.outcome +
        '</span>' +
      '</div>' +
      '<div style="font-size:22px;line-height:1.3;color:' + CU_NAVY + ';font-weight:bold;margin-bottom:10px;">' +
        c.hook +
      '</div>' +
      '<div style="margin-bottom:10px;">' + cuTagChips_(c.tags) + '</div>' +
      '<div style="font-size:13px;color:#777;line-height:1.5;margin-bottom:4px;"><em>' + c.name + '</em></div>' +
      '<div style="font-size:11px;color:#999;font-family:-apple-system,system-ui,sans-serif;line-height:1.5;">' +
        c.citation +
      '</div>' +
      cuSection_('The story', c.story) +
      cuSection_('The court said', c.courtSaid) +
      cuSection_('Why you care', c.whyYouCare) +
    '</div>'
  );
}

function cuObiterBlock_(obiter) {
  if (!obiter) return '';
  return (
    '<div style="padding:32px 40px;background:' + CU_NAVY + ';">' +
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:' + CU_GOLD + ';' +
        'font-family:-apple-system,system-ui,sans-serif;margin-bottom:12px;">Obiter of the week</div>' +
      '<div style="font-size:24px;line-height:1.4;color:#ffffff;font-style:italic;">' +
        '“' + obiter.quote + '”' +
      '</div>' +
      '<div style="width:40px;height:2px;background:' + CU_GOLD + ';margin:16px 0;"></div>' +
      '<div style="font-size:13px;line-height:1.6;color:#C8C2B4;">' + obiter.context + '</div>' +
    '</div>'
  );
}

function cuNumbersBlock_(numbers) {
  if (!numbers || !numbers.length) return '';
  var rows = numbers.map(function (n) {
    return '<tr>' +
      '<td style="padding:10px 16px 10px 0;font-size:20px;font-weight:bold;color:' + CU_GOLD + ';' +
        'white-space:nowrap;vertical-align:top;font-family:Georgia,serif;">' + n.value + '</td>' +
      '<td style="padding:10px 0;font-size:13px;line-height:1.5;color:' + CU_INK + ';vertical-align:middle;">' +
        n.label + '</td>' +
    '</tr>';
  }).join('');
  return (
    '<div style="padding:32px 40px;background:#FAF7F0;border-top:1px solid #EAE5D9;">' +
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:' + CU_GOLD + ';' +
        'font-family:-apple-system,system-ui,sans-serif;margin-bottom:8px;">By the numbers</div>' +
      '<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">' + rows + '</table>' +
    '</div>'
  );
}

function cuIndexBlock_(cases) {
  var items = cases.map(function (c, i) {
    return '<div style="padding:6px 0;font-size:14px;line-height:1.5;color:' + CU_INK + ';">' +
      '<span style="color:' + CU_GOLD + ';font-weight:bold;">' + (i + 1) + '.</span> ' + c.hook +
    '</div>';
  }).join('');
  return (
    '<div style="padding:28px 40px;background:#FAF7F0;border-top:1px solid #EAE5D9;">' +
      '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:' + CU_GOLD + ';' +
        'font-family:-apple-system,system-ui,sans-serif;margin-bottom:8px;">In this edition</div>' +
      items +
    '</div>'
  );
}

function renderCourtUpdateHtml_(edition) {
  return (
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Court Update · ' + edition.date + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + CU_CREAM + ';font-family:Georgia,\'Times New Roman\',serif;color:' + CU_NAVY + ';">' +
    '<div style="max-width:640px;margin:0 auto;background:#ffffff;">' +

      // Masthead
      '<div style="background:' + CU_NAVY + ';padding:36px 40px;text-align:center;">' +
        '<div style="font-size:13px;letter-spacing:3px;color:' + CU_GOLD + ';text-transform:uppercase;margin-bottom:6px;">Thomas Philip</div>' +
        '<div style="font-size:28px;color:#ffffff;letter-spacing:1px;">COURT UPDATE</div>' +
        '<div style="width:40px;height:2px;background:' + CU_GOLD + ';margin:16px auto;"></div>' +
        '<div style="font-size:14px;color:#C8C2B4;font-style:italic;">' + edition.edition + '</div>' +
        '<div style="font-size:12px;color:#8B8574;font-family:-apple-system,system-ui,sans-serif;margin-top:10px;letter-spacing:1px;">' +
          edition.strapline + ' · ' + edition.date +
        '</div>' +
      '</div>' +

      // Intro
      '<div style="padding:28px 40px 4px;font-size:15px;line-height:1.7;color:' + CU_INK + ';">' +
        '<p style="margin:0;">' + edition.intro + '</p>' +
      '</div>' +

      cuIndexBlock_(edition.cases) +

      // Cases 1-3, then the obiter interlude, then the rest
      edition.cases.slice(0, 3).map(cuCaseBlock_).join('') +
      cuObiterBlock_(edition.obiter) +
      edition.cases.slice(3).map(function (c, i) { return cuCaseBlock_(c, i + 3); }).join('') +

      cuNumbersBlock_(edition.numbers) +

      // Footer
      '<div style="background:#FAF7F0;padding:24px 40px;font-size:11px;line-height:1.6;color:#888;' +
        'border-top:1px solid #e5e0d5;">' +
        '<div style="text-align:center;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">' +
          'Thomas Philip · Advocates &amp; Solicitors' +
        '</div>' +
        '<div>' + edition.footer + '</div>' +
      '</div>' +

    '</div></body></html>'
  );
}

// =====================================================================
// SENDER  --  Apps Script only
// =====================================================================

function getLatestCourtUpdateEdition_() {
  return EDITION_20260720;
}

// Test-send the latest edition to a single address. Never sends to a
// list -- distribution stays a deliberate, manual step.
function sendCourtUpdateTest(recipient) {
  if (!recipient) throw new Error('Pass a recipient email address.');
  var edition = getLatestCourtUpdateEdition_();
  var html = renderCourtUpdateHtml_(edition);
  GmailApp.sendEmail(recipient, edition.subject,
    'Court Update · ' + edition.date + ' — open in an HTML-capable mail client to read this edition.',
    { name: COURT_UPDATE_FROM_NAME, htmlBody: html });
  Logger.log('Court Update test sent to ' + recipient);
  return { ok: true, sentTo: recipient, subject: edition.subject };
}
