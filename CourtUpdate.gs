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
// THE WHOLE PROCESS (no code editing needed after setup):
//   0. Once: run courtUpdateBootstrap() -- creates the two Sheet tabs
//      (CourtUpdateCases, CourtUpdateEditions), the "Court Update - To
//      Draft" / "- Drafted" Drive subfolders, and seeds the 20 July
//      2026 edition. Optionally run courtUpdateInstallTrigger() so
//      drafting runs itself every morning.
//   1. Judgments downloaded from the kehakiman portal go into the
//      "Court Update - To Draft" subfolder.
//   2. draftAllNewJudgments() (manual run or the daily trigger) drafts
//      every file there: text extraction (OCR for PDFs), Claude draft
//      in house style, a review Google Doc, and a DRAFT row in the
//      CourtUpdateCases tab. Processed files move to "- Drafted".
//   3. A human edits the row in the Sheet (checking quotes against the
//      paragraph refs in the review Doc), fills in Edition + Position,
//      and flips Status to READY. Edition-level pieces (intro, subject,
//      obiter pick, numbers) live in the CourtUpdateEditions tab.
//   4. sendCourtUpdateTest('you@firm.com') emails the latest READY
//      edition for a final check. Nothing mass-sends by design.
//   5. The lookup site (web app URL + ?action=cases) reads READY rows
//      live -- it updates the moment the Sheet does.
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
      area: 'Defamation',
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
      area: 'Security for costs',
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
      area: 'Probate',
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
      area: 'Insurance',
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
      area: 'Estate',
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
      area: 'Commercial contract',
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
      area: 'Civil procedure',
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
      area: 'Companies',
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
// DRAFTING  --  judgment text -> case object (Apps Script only)
// =====================================================================
//
// Feeds the full grounds of judgment (from the kehakiman portal) to
// Claude and gets back one case object in the edition schema, plus
// quoteCandidates: verbatim lines from the judgment with paragraph
// references, for the Obiter of the Week slot. The prompt forbids
// invention; the paragraph refs exist so every quote can be checked
// against the judgment in seconds before publication.
// =====================================================================

var CU_DRAFT_SYSTEM =
  'You draft one entry for "Court Update -- The Young Lawyers\' Edition", a newsletter for junior ' +
  'Malaysian lawyers published by a boutique litigation firm. You are given the full text of a single ' +
  'judgment. Write the entry from that text ONLY -- never invent facts, figures, names, or quotes. ' +
  'Tone: telling a colleague about the case over coffee. Short sentences, active voice, no headnote-speak. ' +
  'Humour must come from the facts and the court\'s own words, never from mocking a party; accuracy beats wit. ' +
  'If the judgment is in Bahasa Malaysia, write the entry in English but keep quotes in the original ' +
  'language followed by a bracketed English translation. Output JSON only, no prose around it.';

function buildDraftPrompt_(judgmentText) {
  var schema =
    '{\n' +
    '  "hook": "<headline, <=70 chars, story-first, no case name, no colon-cliches>",\n' +
    '  "area": "<one of: Defamation | Civil procedure | Commercial contract | Companies | Insurance | Probate | Estate | Land | Employment | Tort | Other>",\n' +
    '  "tags": ["<emoji + 1-3 words>", "<emoji + 1-3 words>", "<emoji + 1-3 words>"],\n' +
    '  "name": "<full case name>",\n' +
    '  "citation": "<case no> \\u00b7 <court> \\u00b7 <coram / judge>",\n' +
    '  "story": "<2-3 sentences: the human drama, facts only from the judgment>",\n' +
    '  "courtSaid": "<the holding and key orders/figures in <=2 plain-English sentences>",\n' +
    '  "whyYouCare": "<the practice point: what a junior lawyer does differently now, <=3 sentences>",\n' +
    '  "outcome": "<ALLOWED | ALLOWED IN PART | DISMISSED | STRUCK OUT | GRANTED | ...>",\n' +
    '  "quoteCandidates": [\n' +
    '    { "quote": "<verbatim from the judgment, <=160 chars>", "para": "<paragraph ref>" }\n' +
    '    // up to 3, the sharpest lines actually present; empty array if none stand out\n' +
    '  ]\n' +
    '}';
  return {
    system: CU_DRAFT_SYSTEM,
    user: 'JUDGMENT TEXT\n\n' + judgmentText +
          '\n\nReply with JSON matching exactly this schema:\n' + schema
  };
}

function cuParseJson_(text) {
  var t = String(text || '').trim();
  var fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  var a = t.indexOf('{');
  var b = t.lastIndexOf('}');
  if (a < 0 || b < 0) throw new Error('No JSON in drafting response');
  return JSON.parse(t.substring(a, b + 1));
}

// Judgments run long; keep the request within a sane budget. ~180k
// characters is roughly 45k tokens, comfortably inside the model's
// window while leaving room for the reply.
var CU_MAX_JUDGMENT_CHARS = 180000;

function draftCourtUpdateCase(judgmentText) {
  var text = String(judgmentText || '').trim();
  if (text.length < 500) throw new Error('That does not look like a full judgment (under 500 characters).');
  if (text.length > CU_MAX_JUDGMENT_CHARS) {
    Logger.log('Judgment truncated from ' + text.length + ' to ' + CU_MAX_JUDGMENT_CHARS + ' chars');
    text = text.substring(0, CU_MAX_JUDGMENT_CHARS);
  }
  var prompt = buildDraftPrompt_(text);
  var payload = {
    model: ANTHROPIC_MODEL,
    max_tokens: 3000,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }]
  };
  var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': prop('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  if (code !== 200) {
    throw new Error('Anthropic API ' + code + ': ' + response.getContentText().substring(0, 500));
  }
  var body = JSON.parse(response.getContentText());
  var out = '';
  for (var i = 0; i < body.content.length; i++) {
    if (body.content[i].type === 'text') { out = body.content[i].text; break; }
  }
  return cuParseJson_(out);
}

// Extract text from a Drive file: Google Docs directly; PDFs via the
// Drive API OCR conversion (enable the "Drive API" Advanced Service
// under Services in the Apps Script editor).
function cuExtractJudgmentText_(fileId) {
  var file = DriveApp.getFileById(fileId);
  var mime = file.getMimeType();

  if (mime === MimeType.GOOGLE_DOCS) {
    return DocumentApp.openById(fileId).getBody().getText();
  }
  if (mime === MimeType.PDF) {
    if (typeof Drive === 'undefined') {
      throw new Error('PDF extraction needs the Drive Advanced Service: in the Apps Script editor, ' +
                      'Services (+) -> Drive API -> Add, then run again.');
    }
    var temp = Drive.Files.copy(
      { title: '[temp OCR] ' + file.getName(), mimeType: MimeType.GOOGLE_DOCS },
      fileId,
      { ocr: true, ocrLanguage: 'ms' }
    );
    try {
      return DocumentApp.openById(temp.id).getBody().getText();
    } finally {
      try { DriveApp.getFileById(temp.id).setTrashed(true); } catch (e) {}
    }
  }
  if (mime === MimeType.PLAIN_TEXT) {
    return file.getBlob().getDataAsString();
  }
  throw new Error('Unsupported file type: ' + mime + ' (use a Google Doc, PDF, or plain text file).');
}

// One call does the whole drafting step for a single file: Drive file
// -> Claude draft -> review Doc + DRAFT row in the Sheet. Returns the
// case object. (For the folder-based batch, see draftAllNewJudgments.)
function draftCourtUpdateCaseFromDrive(fileId) {
  if (!fileId) throw new Error('Pass a Drive file ID for the judgment.');
  var file = DriveApp.getFileById(fileId);
  var judgmentText = cuExtractJudgmentText_(fileId);
  var drafted = draftCourtUpdateCase(judgmentText);
  cuRecordDraft_(drafted, file.getName());
  return drafted;
}

function cuWriteDraftDoc_(drafted) {
  var doc = DocumentApp.create('Court Update draft - ' + (drafted.name || 'untitled case'));
  var docBody = doc.getBody();
  docBody.appendParagraph('Court Update -- drafted entry (EDIT BEFORE USE)')
    .setHeading(DocumentApp.ParagraphHeading.TITLE);
  docBody.appendParagraph('Every figure and quote below must be checked against the judgment before publication.')
    .editAsText().setItalic(true);
  docBody.appendParagraph('Hook').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  docBody.appendParagraph(drafted.hook || '');
  docBody.appendParagraph('Case').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  docBody.appendParagraph((drafted.name || '') + '\n' + (drafted.citation || ''));
  docBody.appendParagraph('Tags').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  docBody.appendParagraph((drafted.tags || []).join('   '));
  docBody.appendParagraph('The story').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  docBody.appendParagraph(drafted.story || '');
  docBody.appendParagraph('The court said').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  docBody.appendParagraph(drafted.courtSaid || '');
  docBody.appendParagraph('Why you care').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  docBody.appendParagraph(drafted.whyYouCare || '');
  docBody.appendParagraph('Outcome').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  docBody.appendParagraph(drafted.outcome || '');
  docBody.appendParagraph('Obiter candidates (verify each against the paragraph cited)')
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  (drafted.quoteCandidates || []).forEach(function (q) {
    docBody.appendListItem('"' + q.quote + '" -- para ' + q.para);
  });
  doc.saveAndClose();

  try {
    var docFile = DriveApp.getFileById(doc.getId());
    DriveApp.getFolderById(prop('FOLDER_ID')).addFile(docFile);
    DriveApp.getRootFolder().removeFile(docFile);
  } catch (e) {
    Logger.log('Could not move draft Doc to folder: ' + e.message);
  }

  return doc.getUrl();
}

// Write the review Doc and the DRAFT row. The Sheet row is the source
// of truth for editing; the Doc is for reading the draft against the
// judgment (it carries the paragraph-referenced quote candidates).
function cuRecordDraft_(drafted, sourceFileName) {
  var docUrl = cuWriteDraftDoc_(drafted);
  var quotes = (drafted.quoteCandidates || []).map(function (q) {
    return '"' + q.quote + '" -- para ' + q.para;
  }).join('\n');
  cuCasesSheet_().appendRow([
    '',                                   // Edition -- editor fills in
    '',                                   // Position -- editor fills in
    'DRAFT',                              // Status
    drafted.hook || '',
    drafted.area || 'Other',
    (drafted.tags || []).join(', '),
    drafted.name || '',
    drafted.citation || '',
    drafted.story || '',
    drafted.courtSaid || '',
    drafted.whyYouCare || '',
    drafted.outcome || '',
    quotes,
    docUrl,
    sourceFileName || '',
    new Date()
  ]);
  drafted.draftDocUrl = docUrl;
  Logger.log('Draft recorded: ' + (drafted.name || 'untitled') + ' -> ' + docUrl);
  return docUrl;
}

// =====================================================================
// BATCH DRAFTING  --  "Court Update - To Draft" folder in, drafts out
// =====================================================================

var CU_TODRAFT_FOLDER = 'Court Update - To Draft';
var CU_DRAFTED_FOLDER = 'Court Update - Drafted';
var CU_BATCH_TIME_BUDGET_MS = 4.5 * 60 * 1000; // stop before the 6-min Apps Script limit

function cuSubfolder_(name) {
  var parent = DriveApp.getFolderById(prop('FOLDER_ID'));
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

// Draft every judgment sitting in "Court Update - To Draft". Safe to
// run any time (manually or on the daily trigger): each file is
// processed independently, moved to "- Drafted" on success, and left
// in place on failure so the next run retries it. Stops early if the
// execution-time budget runs out; leftovers are picked up next run.
function draftAllNewJudgments() {
  var t0 = Date.now();
  var toDraft = cuSubfolder_(CU_TODRAFT_FOLDER);
  var drafted = cuSubfolder_(CU_DRAFTED_FOLDER);
  var files = toDraft.getFiles();
  var done = 0, failed = 0;

  while (files.hasNext()) {
    if (Date.now() - t0 > CU_BATCH_TIME_BUDGET_MS) {
      Logger.log('Time budget reached -- remaining files will be drafted on the next run.');
      break;
    }
    var file = files.next();
    try {
      var text = cuExtractJudgmentText_(file.getId());
      var obj = draftCourtUpdateCase(text);
      cuRecordDraft_(obj, file.getName());
      file.moveTo(drafted);
      done++;
    } catch (e) {
      failed++;
      Logger.log('Draft failed for "' + file.getName() + '": ' + e.message);
      notifyOps_('Court Update draft failed', file.getName(), e);
    }
  }

  Logger.log('draftAllNewJudgments: ' + done + ' drafted, ' + failed + ' failed.');
  return { drafted: done, failed: failed };
}

// Optional: run the batch automatically every morning at 7am.
function courtUpdateInstallTrigger() {
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'draftAllNewJudgments';
  });
  if (exists) { Logger.log('Trigger already installed.'); return; }
  ScriptApp.newTrigger('draftAllNewJudgments').timeBased().atHour(7).everyDays(1).create();
  Logger.log('Daily 7am drafting trigger installed.');
}

// =====================================================================
// SHEET STORAGE  --  editions live in the spreadsheet, not in code
// =====================================================================

var CU_CASES_SHEET = 'CourtUpdateCases';
var CU_EDITIONS_SHEET = 'CourtUpdateEditions';

var CU_CASE_COLS = [
  'Edition',          //  A  e.g. "20 July 2026" -- groups cases into an issue
  'Position',         //  B  order within the edition (1, 2, 3...)
  'Status',           //  C  DRAFT until edited; READY to publish
  'Hook',             //  D
  'Area',             //  E  filter chip on the site
  'Tags',             //  F  comma-separated, each "emoji words"
  'Case Name',        //  G
  'Citation',         //  H
  'Story',            //  I
  'Court Said',       //  J
  'Why You Care',     //  K
  'Outcome',          //  L
  'Quote Candidates', //  M  verbatim quotes + para refs, for the obiter pick
  'Draft Doc',        //  N  review Doc URL
  'Source File',      //  O  judgment file name from the To Draft folder
  'Added'             //  P
];

var CU_EDITION_COLS = [
  'Edition',        // A  must match the Edition value on the case rows
  'Subject',        // B  email subject line (default generated if blank)
  'Intro',          // C  opening paragraph
  'Strapline',      // D  default "<n> decisions · 5 minutes · zero headnotes"
  'Obiter Quote',   // E  the week's pick (leave blank to omit the section)
  'Obiter Context', // F
  'Numbers'         // G  one per line: "RM42.3m | claimed in cancellation charges (case 6)"
];

var CU_EDITION_LABEL = "The Young Lawyers' Edition";
var CU_FOOTER =
  'Prepared from our reading of the judgments listed above. Figures and citations should be verified against the ' +
  'sealed judgments before being relied on or circulated further. This update is general information, not legal advice.';

function cuSheetTab_(name, cols) {
  var ss = SpreadsheetApp.openById(prop('SHEET_ID'));
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(cols);
    sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#0F1720').setFontColor('#F5F3EF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function cuCasesSheet_() { return cuSheetTab_(CU_CASES_SHEET, CU_CASE_COLS); }
function cuEditionsSheet_() { return cuSheetTab_(CU_EDITIONS_SHEET, CU_EDITION_COLS); }

// One-time setup: tabs, Drive subfolders, and the seed edition (the
// 20 July 2026 issue shipped in code) so the Sheet starts populated.
function courtUpdateBootstrap() {
  var cases = cuCasesSheet_();
  var editions = cuEditionsSheet_();
  cuSubfolder_(CU_TODRAFT_FOLDER);
  cuSubfolder_(CU_DRAFTED_FOLDER);

  if (cases.getLastRow() < 2) {
    EDITION_20260720.cases.forEach(function (c, i) {
      cases.appendRow([
        EDITION_20260720.date, i + 1, 'READY',
        c.hook, c.area || 'Other', (c.tags || []).join(', '),
        c.name, c.citation, c.story, c.courtSaid, c.whyYouCare, c.outcome,
        '', '', '', new Date()
      ]);
    });
    editions.appendRow([
      EDITION_20260720.date,
      EDITION_20260720.subject,
      EDITION_20260720.intro,
      EDITION_20260720.strapline,
      EDITION_20260720.obiter.quote,
      EDITION_20260720.obiter.context,
      EDITION_20260720.numbers.map(function (n) { return n.value + ' | ' + n.label; }).join('\n')
    ]);
    Logger.log('Seeded the 20 July 2026 edition into the Sheet.');
  }
  Logger.log('Court Update bootstrap complete.');
}

function cuReadRows_(sheet, cols) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, cols.length).getValues().map(function (row) {
    var obj = {};
    cols.forEach(function (name, i) { obj[name] = row[i]; });
    return obj;
  });
}

function cuCaseRowToObj_(r) {
  return {
    edition: String(r['Edition'] || '').trim(),
    position: Number(r['Position']) || 9999,
    status: String(r['Status'] || '').trim().toUpperCase(),
    hook: String(r['Hook'] || ''),
    area: String(r['Area'] || 'Other'),
    tags: String(r['Tags'] || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean),
    name: String(r['Case Name'] || ''),
    citation: String(r['Citation'] || ''),
    story: String(r['Story'] || ''),
    courtSaid: String(r['Court Said'] || ''),
    whyYouCare: String(r['Why You Care'] || ''),
    outcome: String(r['Outcome'] || '')
  };
}

// Build a renderable edition object from the Sheet. editionDate is
// optional -- defaults to the last row of the CourtUpdateEditions tab.
function readCourtUpdateEditionFromSheet(editionDate) {
  var editionRows = cuReadRows_(cuEditionsSheet_(), CU_EDITION_COLS);
  if (!editionRows.length) {
    throw new Error('No editions in the Sheet yet -- run courtUpdateBootstrap() first.');
  }
  var ed = null;
  if (editionDate) {
    for (var i = 0; i < editionRows.length; i++) {
      if (String(editionRows[i]['Edition']).trim() === String(editionDate).trim()) { ed = editionRows[i]; break; }
    }
    if (!ed) throw new Error('No edition row for "' + editionDate + '" in ' + CU_EDITIONS_SHEET + '.');
  } else {
    ed = editionRows[editionRows.length - 1];
  }

  var date = String(ed['Edition']).trim();
  var cases = cuReadRows_(cuCasesSheet_(), CU_CASE_COLS)
    .map(cuCaseRowToObj_)
    .filter(function (c) { return c.status === 'READY' && c.edition === date; })
    .sort(function (a, b) { return a.position - b.position; });
  if (!cases.length) {
    throw new Error('No READY cases for edition "' + date + '" -- set Status to READY on the rows to include.');
  }

  var numbers = String(ed['Numbers'] || '').split(/\r?\n/)
    .map(function (line) {
      var parts = line.split('|');
      if (parts.length < 2) return null;
      return { value: parts[0].trim(), label: parts.slice(1).join('|').trim() };
    })
    .filter(Boolean);

  return {
    date: date,
    edition: CU_EDITION_LABEL,
    strapline: String(ed['Strapline'] || '').trim() || (cases.length + ' decisions · 5 minutes · zero headnotes'),
    intro: String(ed['Intro'] || '').trim(),
    subject: String(ed['Subject'] || '').trim() || ('Court Update · ' + date),
    obiter: String(ed['Obiter Quote'] || '').trim()
      ? { quote: String(ed['Obiter Quote']).trim(), context: String(ed['Obiter Context'] || '').trim() }
      : null,
    numbers: numbers,
    cases: cases,
    footer: CU_FOOTER
  };
}

// =====================================================================
// SENDER  --  Apps Script only
// =====================================================================

// Code-registered editions are only the seed for courtUpdateBootstrap()
// and the static-site export (court-updates/build-site.js). The live
// source of truth is the Sheet.
var COURT_UPDATE_EDITIONS = [EDITION_20260720];

// Test-send an edition (default: the latest in the Sheet) to a single
// address. Never sends to a list -- distribution stays a deliberate,
// manual step.
function sendCourtUpdateTest(recipient, editionDate) {
  if (!recipient) throw new Error('Pass a recipient email address.');
  var edition = readCourtUpdateEditionFromSheet(editionDate);
  var html = renderCourtUpdateHtml_(edition);
  GmailApp.sendEmail(recipient, edition.subject,
    'Court Update · ' + edition.date + ' — open in an HTML-capable mail client to read this edition.',
    { name: COURT_UPDATE_FROM_NAME, htmlBody: html });
  Logger.log('Court Update test sent to ' + recipient);
  return { ok: true, sentTo: recipient, subject: edition.subject };
}

// =====================================================================
// CASE-LOOKUP SITE  --  served live from the web app (?action=cases)
// =====================================================================
//
// buildCaseLookupHtml_ is pure JS shared with court-updates/build-site.js
// (the static GitHub Pages export). The live route reads READY rows
// straight from the Sheet, so the site updates the moment the Sheet does.
// NOTE: the page template below deliberately avoids backslashes and
// ${...} in client-side code -- it lives inside a template literal.
// =====================================================================

function cuDeriveCourt_(citation) {
  return /court of appeal/i.test(String(citation)) ? 'Court of Appeal' : 'High Court';
}

function cuSiteCase_(c, editionDate) {
  return {
    hook: c.hook, area: c.area || 'Other', tags: c.tags || [],
    name: c.name, citation: c.citation, story: c.story,
    courtSaid: c.courtSaid, whyYouCare: c.whyYouCare, outcome: c.outcome,
    edition: editionDate, court: cuDeriveCourt_(c.citation)
  };
}

// Static-export path: flatten code-registered editions, newest first.
function cuCasesFromEditions_(editionsArr) {
  var out = [];
  editionsArr.slice().reverse().forEach(function (ed) {
    ed.cases.forEach(function (c) { out.push(cuSiteCase_(c, ed.date)); });
  });
  return out;
}

// Live path: READY rows from the Sheet, grouped newest edition first.
// A case only appears once its edition has a row in CourtUpdateEditions
// AND its Status is READY -- so drafts never leak onto the site.
function getCaseLookupCases_() {
  var editionOrder = cuReadRows_(cuEditionsSheet_(), CU_EDITION_COLS)
    .map(function (r) { return String(r['Edition']).trim(); })
    .filter(Boolean);
  var all = cuReadRows_(cuCasesSheet_(), CU_CASE_COLS)
    .map(cuCaseRowToObj_)
    .filter(function (c) { return c.status === 'READY'; });

  var out = [];
  editionOrder.slice().reverse().forEach(function (date) {
    all.filter(function (c) { return c.edition === date; })
       .sort(function (a, b) { return a.position - b.position; })
       .forEach(function (c) { out.push(cuSiteCase_(c, date)); });
  });
  return out;
}

function caseLookupPage() {
  return HtmlService.createHtmlOutput(buildCaseLookupHtml_(getCaseLookupCases_()))
    .setTitle('Court Update · Case Lookup');
}

function buildCaseLookupHtml_(cases) {
  var areas = [];
  var editions = [];
  cases.forEach(function (c) {
    if (areas.indexOf(c.area) < 0) areas.push(c.area);
    if (editions.indexOf(c.edition) < 0) editions.push(c.edition);
  });
  areas.sort();

  var data = JSON.stringify({ cases: cases, areas: areas, editions: editions })
    .replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Court Update · Case Lookup — Thomas Philip</title>
<style>
  :root {
    --navy: #0F1720; --gold: #B89554; --cream: #F5F3EF; --ink: #2c3440;
    --paper: #ffffff; --line: #EAE5D9; --muted: #8a8578;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--cream); color: var(--ink); font-family: Georgia, 'Times New Roman', serif; }
  .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }

  header { background: var(--navy); text-align: center; padding: 40px 20px 34px; }
  header .firm { color: var(--gold); font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px; }
  header h1 { color: #fff; font-size: 30px; font-weight: normal; letter-spacing: 1px; }
  header .rule { width: 40px; height: 2px; background: var(--gold); margin: 16px auto; }
  header .sub { color: #C8C2B4; font-style: italic; font-size: 15px; }

  .controls { position: sticky; top: 0; z-index: 5; background: var(--paper);
    border-bottom: 1px solid var(--line); padding: 16px 20px; box-shadow: 0 2px 10px rgba(15,23,32,.05); }
  .controls-inner { max-width: 860px; margin: 0 auto; }
  .search { width: 100%; font-size: 16px; padding: 12px 16px; border: 1px solid #d8d2c4;
    border-radius: 8px; background: #FBFAF7; color: var(--ink); font-family: inherit; }
  .search:focus { outline: 2px solid var(--gold); border-color: var(--gold); }
  .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }
  .chip { font-size: 13px; padding: 5px 14px; border-radius: 16px; border: 1px solid #ddd6c6;
    background: #F7F4EC; color: #6B5B33; cursor: pointer; }
  .chip.on { background: var(--navy); color: #fff; border-color: var(--navy); }
  .chip:hover:not(.on) { border-color: var(--gold); }
  select { font-size: 13px; padding: 5px 10px; border-radius: 8px; border: 1px solid #ddd6c6;
    background: #F7F4EC; color: #6B5B33; }
  .count { font-size: 13px; color: var(--muted); margin-left: auto; }

  main { max-width: 860px; margin: 0 auto; padding: 24px 20px 60px; }
  .card { background: var(--paper); border: 1px solid var(--line); border-radius: 10px;
    margin-bottom: 16px; overflow: hidden; }
  .card summary { list-style: none; cursor: pointer; padding: 22px 24px; }
  .card summary::-webkit-details-marker { display: none; }
  .card summary:hover { background: #FDFCF9; }
  .meta { display: flex; align-items: baseline; gap: 10px; font-size: 12px; color: var(--muted); margin-bottom: 8px; }
  .outcome { font-weight: 700; letter-spacing: 1px; margin-left: auto; }
  .hook { font-size: 20px; font-weight: 700; color: var(--navy); line-height: 1.3; margin-bottom: 8px; }
  .case-name { font-style: italic; font-size: 14px; color: #777; }
  .citation { font-size: 12px; color: #999; line-height: 1.5; margin-top: 2px; }
  .tagrow { margin-top: 10px; }
  .tag { display: inline-block; background: #F0EBDF; color: #6B5B33; border: 1px solid #E0D6C0;
    border-radius: 12px; padding: 2px 10px; font-size: 11px; margin: 0 6px 4px 0; letter-spacing: .3px; }
  .body { padding: 0 24px 24px; border-top: 1px solid var(--line); }
  .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin: 18px 0 4px; }
  .text { font-size: 15px; line-height: 1.7; }
  .open-hint { font-size: 12px; color: var(--gold); margin-top: 10px; }
  details[open] .open-hint { display: none; }

  .empty { text-align: center; color: var(--muted); padding: 60px 0; font-style: italic; }
  footer { text-align: center; font-size: 11px; color: #999; padding: 30px 20px 50px; line-height: 1.6; }
  footer .firmline { letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  mark { background: #F3E5C3; color: inherit; padding: 0 1px; }
  @media (max-width: 600px) { .hook { font-size: 18px; } header h1 { font-size: 24px; } }
</style>
</head>
<body>

<header>
  <div class="firm sans">Thomas Philip</div>
  <h1>COURT UPDATE · CASE LOOKUP</h1>
  <div class="rule"></div>
  <div class="sub">Every case we’ve covered, searchable</div>
</header>

<div class="controls sans">
  <div class="controls-inner">
    <input id="q" class="search" type="search"
      placeholder="Search cases — try &ldquo;security for costs&rdquo;, &ldquo;nominee&rdquo;, &ldquo;winding-up&rdquo;, a party name&hellip;"
      autocomplete="off">
    <div class="filters">
      <div id="areaChips"></div>
      <select id="court">
        <option value="">All courts</option>
        <option>Court of Appeal</option>
        <option>High Court</option>
      </select>
      <select id="edition"><option value="">All editions</option></select>
      <span class="count" id="count"></span>
    </div>
  </div>
</div>

<main id="results"></main>

<footer class="sans">
  <div class="firmline">Thomas Philip &middot; Advocates &amp; Solicitors</div>
  Summaries prepared from our reading of the judgments; verify figures and citations against the sealed
  judgments before relying on them. General information, not legal advice.
</footer>

<script>
var DB = ${data};

var q = document.getElementById('q');
var courtSel = document.getElementById('court');
var editionSel = document.getElementById('edition');
var areaChips = document.getElementById('areaChips');
var results = document.getElementById('results');
var count = document.getElementById('count');
var activeArea = '';

DB.editions.forEach(function (e) {
  var o = document.createElement('option');
  o.textContent = e;
  editionSel.appendChild(o);
});

['All areas'].concat(DB.areas).forEach(function (a, i) {
  var b = document.createElement('button');
  b.className = 'chip' + (i === 0 ? ' on' : '');
  b.textContent = a;
  b.onclick = function () {
    activeArea = i === 0 ? '' : a;
    Array.prototype.forEach.call(areaChips.children, function (c) {
      c.classList.toggle('on', c === b);
    });
    render();
  };
  areaChips.appendChild(b);
});

function esc(s) {
  return String(s).split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;');
}

function hi(s, terms) {
  var out = esc(s);
  terms.forEach(function (t) {
    if (t.length < 2) return;
    var low = out.toLowerCase();
    var tl = t.toLowerCase();
    var res = '';
    var idx = 0;
    while (true) {
      var p = low.indexOf(tl, idx);
      if (p < 0) { res += out.substring(idx); break; }
      res += out.substring(idx, p) + '<mark>' + out.substring(p, p + t.length) + '</mark>';
      idx = p + t.length;
    }
    out = res;
  });
  return out;
}

function outcomeColor(o) {
  o = (o || '').toUpperCase();
  if (o.indexOf('DISMISS') >= 0 || o.indexOf('STRUCK') >= 0) return '#8A3B3B';
  if (o.indexOf('PART') >= 0) return '#8A6D3B';
  return '#3B6E4F';
}

function render() {
  var terms = q.value.toLowerCase().split(' ').filter(Boolean);
  var rows = DB.cases.filter(function (c) {
    if (activeArea && c.area !== activeArea) return false;
    if (courtSel.value && c.court !== courtSel.value) return false;
    if (editionSel.value && c.edition !== editionSel.value) return false;
    if (!terms.length) return true;
    var hay = [c.hook, c.name, c.citation, c.story, c.courtSaid, c.whyYouCare,
               c.area, c.outcome, c.tags.join(' ')].join(' ').toLowerCase();
    return terms.every(function (t) { return hay.indexOf(t) >= 0; });
  });

  count.textContent = rows.length + ' case' + (rows.length === 1 ? '' : 's');
  if (!rows.length) {
    results.innerHTML = '<div class="empty sans">No cases match — try fewer words, or clear a filter.</div>';
    return;
  }

  results.innerHTML = rows.map(function (c) {
    return '<details class="card">' +
      '<summary>' +
        '<div class="meta sans">' +
          '<span>' + esc(c.edition) + '</span><span>·</span>' +
          '<span>' + esc(c.court) + '</span><span>·</span>' +
          '<span>' + esc(c.area) + '</span>' +
          '<span class="outcome" style="color:' + outcomeColor(c.outcome) + '">' + esc(c.outcome) + '</span>' +
        '</div>' +
        '<div class="hook">' + hi(c.hook, terms) + '</div>' +
        '<div class="case-name">' + hi(c.name, terms) + '</div>' +
        '<div class="citation sans">' + hi(c.citation, terms) + '</div>' +
        '<div class="tagrow">' + c.tags.map(function (t) {
          return '<span class="tag sans">' + esc(t) + '</span>';
        }).join('') + '</div>' +
        '<div class="open-hint sans">Read the case &darr;</div>' +
      '</summary>' +
      '<div class="body">' +
        '<div class="label sans">The story</div><div class="text">' + hi(c.story, terms) + '</div>' +
        '<div class="label sans">The court said</div><div class="text">' + hi(c.courtSaid, terms) + '</div>' +
        '<div class="label sans">Why you care</div><div class="text">' + hi(c.whyYouCare, terms) + '</div>' +
      '</div>' +
    '</details>';
  }).join('');
}

q.addEventListener('input', render);
courtSel.addEventListener('change', render);
editionSel.addEventListener('change', render);
render();
</script>
</body>
</html>
`;
}
