// =====================================================================
// CONFIG  --  Script Properties + constants
// =====================================================================
//
// FIRM_PASSWORD MUST be set in Script Properties (Project Settings ->
// Script Properties). It used to default to a placeholder, which was a
// security hole because anyone reading the script could see the key
// for the protected write/read endpoints. There is no default any more.
//
// ANTHROPIC_API_KEY also MUST be in Script Properties.
//
// SHEET_ID, FOLDER_ID, LETTERHEAD_FILE_ID can be overridden in Script
// Properties; if not set, the dev defaults below are used.
// =====================================================================

var DEFAULTS = {
  SHEET_ID:           '12OrO5UGRMwMFq6TsqsgKWx7wvPGSPfOZZPzAL2-8UHk',
  FOLDER_ID:          '1kiuD0jXwtScnjhQK2I8OyPGTdMAZv6Eh',
  LETTERHEAD_FILE_ID: '1tCpXsxDZbdnA6ONBv2399mbNvTG-6YAA'
  // FIRM_PASSWORD intentionally not defaulted: must be in Script Properties.
  // ANTHROPIC_API_KEY intentionally not defaulted: must be in Script Properties.
};

var SHEET_NAME           = 'Applications';
var SCORES_SHEET_NAME    = 'Scores';
var ACTIVITY_SHEET_NAME  = 'ActivityLog';
var RAW_INTAKE_SHEET     = 'RawIntake';
var DEAD_LETTER_SHEET    = 'IntakeDeadLetter';

var FIRM_NAME    = 'Thomas Philip Advocates & Solicitors';
var FIRM_EMAIL   = 'nmk@lawgistics.my';
var DIVIYA_EMAIL = 'div@thomasphilip.com.my';
var CALENDLY_LINK = 'https://calendly.com/nmk-lawgistics/30min';

var ANTHROPIC_MODEL    = 'claude-sonnet-4-6';
var EMAIL_DELAY_HOURS  = 24;
var CACHE_TTL_SECONDS  = 300; // 5 minutes
var SLOW_DOPOST_MS     = 8000; // log a SLOW warning above this

// Status workflow values (partner-editable)
var STATUS = {
  NEW:           'NEW',
  SHORTLIST:     'SHORTLIST',
  UNDER_REVIEW:  'UNDER REVIEW',
  DECLINE:       'DECLINE',
  INTERVIEWED:   'INTERVIEWED',
  OFFERED:       'OFFERED',
  CANCELLED:     'CANCELLED'
};

var STATUS_VALUES = [
  STATUS.NEW, STATUS.SHORTLIST, STATUS.UNDER_REVIEW,
  STATUS.DECLINE, STATUS.INTERVIEWED, STATUS.OFFERED, STATUS.CANCELLED
];

// AI Decision values (immutable, set at intake)
var AI_DECISION = { YES: 'YES', NO: 'NO' };

function aiDecisionToStatus(decision) {
  var d = String(decision || '').toUpperCase();
  if (d.indexOf('YES') >= 0) return STATUS.SHORTLIST;
  return STATUS.DECLINE;
}

function prop(key) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  if (v) return v;
  if (DEFAULTS[key]) return DEFAULTS[key];
  throw new Error('Missing Script Property: ' + key);
}

function propOptional(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || DEFAULTS[key] || '';
}

// =====================================================================
// SCHEMA  --  sheet column layout, headers, validation
// =====================================================================

var COLS = [
  'Candidate ID',          //  1  A  -- opaque UUID, primary key
  'Applied',               //  2  B  -- submission timestamp
  'Full Name',             //  3  C
  'Email',                 //  4  D
  'Phone',                 //  5  E
  'IC Name',               //  6  F
  'IC Number',             //  7  G
  'Address',               //  8  H
  'Education',             //  9  I  -- qualification + university freeform
  'AI Decision',           // 10  J  -- YES / NO
  'AI Rationale',          // 11  K  -- one-line summary, ~140 chars
  'Score',                 // 12  L  -- overall /100
  'Status',                // 13  M  -- partner-editable workflow state
  'CV Link',               // 14  N
  'Answers Doc Link',      // 15  O
  'Interview Booked',      // 16  P  -- populated by Calendly webhook
  'Email Status',          // 17  Q  -- SCHEDULED / SENT / FAILED / CANCELLED
  'Send At',               // 18  R  -- ISO timestamp
  'Newsletter Opt-in',     // 19  S
  'CRM Opt-in',            // 20  T
  'Time Used',             // 21  U
  'Post-Interview',        // 22  V  -- ACCEPT / REJECT (after Calendly call)
  'Diviya Notified',       // 23  W
  'Letter Sent',           // 24  X  -- checkbox
  'Sent On'                // 25  Y
];

function colIndex(name) {
  var i = COLS.indexOf(name);
  if (i < 0) throw new Error('Unknown column: ' + name);
  return i + 1; // 1-based for Sheets API
}

var SCORE_COLS = [
  'Candidate ID',
  'Critical Thinking',
  'Written Communication',
  'Judgement',
  'Self-Awareness',
  'Attitude',
  'Problem-Solving',
  'Attention to Detail',
  'Time Management',
  'Resilience',
  'Integrity',
  'Per-Answer Notes JSON',
  'Strengths',
  'Concerns',
  'Recommendation',
  'Updated'
];

var ACTIVITY_COLS = ['Timestamp', 'Candidate ID', 'Event', 'Actor', 'Detail'];

function bootstrapSheet() {
  var ss = SpreadsheetApp.openById(prop('SHEET_ID'));

  var apps = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (apps.getLastRow() === 0) {
    apps.appendRow(COLS);
    apps.getRange(1, 1, 1, COLS.length).setFontWeight('bold').setBackground('#0F1720').setFontColor('#F5F3EF');
    apps.setFrozenRows(1);
  }
  applyValidation_(apps);

  var scores = ss.getSheetByName(SCORES_SHEET_NAME) || ss.insertSheet(SCORES_SHEET_NAME);
  if (scores.getLastRow() === 0) {
    scores.appendRow(SCORE_COLS);
    scores.getRange(1, 1, 1, SCORE_COLS.length).setFontWeight('bold').setBackground('#0F1720').setFontColor('#F5F3EF');
    scores.setFrozenRows(1);
  }

  var activity = ss.getSheetByName(ACTIVITY_SHEET_NAME) || ss.insertSheet(ACTIVITY_SHEET_NAME);
  if (activity.getLastRow() === 0) {
    activity.appendRow(ACTIVITY_COLS);
    activity.getRange(1, 1, 1, ACTIVITY_COLS.length).setFontWeight('bold').setBackground('#0F1720').setFontColor('#F5F3EF');
    activity.setFrozenRows(1);
  }

  Logger.log('Bootstrap complete.');
}

function applyValidation_(sheet) {
  var lastRow = Math.max(sheet.getLastRow(), 1);
  var rangeRows = Math.max(lastRow - 1, 1) + 50;

  var statusCol = colIndex('Status');
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_VALUES, true).setAllowInvalid(false).build();
  sheet.getRange(2, statusCol, rangeRows, 1).setDataValidation(statusRule);

  var aiCol = colIndex('AI Decision');
  var aiRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['YES', 'NO'], true).setAllowInvalid(false).build();
  sheet.getRange(2, aiCol, rangeRows, 1).setDataValidation(aiRule);

  var piCol = colIndex('Post-Interview');
  var piRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['ACCEPT', 'REJECT'], true).setAllowInvalid(false)
    .setHelpText('Set after the Calendly screening call. Diviya will be notified.').build();
  sheet.getRange(2, piCol, rangeRows, 1).setDataValidation(piRule);

  if (lastRow > 1) {
    var lsCol = colIndex('Letter Sent');
    var lsRule = SpreadsheetApp.newDataValidation().requireCheckbox().setAllowInvalid(false).build();
    sheet.getRange(2, lsCol, lastRow - 1, 1).setDataValidation(lsRule);
  }
}

function trimBlankRows() {
  var sheet = getApplicationsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var idCol = colIndex('Candidate ID');
  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();

  var lastDataRow = 1;
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || '').trim()) lastDataRow = i + 2;
  }

  if (lastDataRow < lastRow) {
    sheet.deleteRows(lastDataRow + 1, lastRow - lastDataRow);
    Logger.log('Trimmed ' + (lastRow - lastDataRow) + ' blank rows.');
  } else {
    Logger.log('No blank rows to trim.');
  }
  cacheBustAll();
}

// =====================================================================
// SHEET  --  read/write helpers for Applications, Scores, ActivityLog
// =====================================================================

function getSpreadsheet_() {
  return SpreadsheetApp.openById(prop('SHEET_ID'));
}

function getApplicationsSheet_() {
  return getSpreadsheet_().getSheetByName(SHEET_NAME);
}

function getScoresSheet_() {
  return getSpreadsheet_().getSheetByName(SCORES_SHEET_NAME);
}

function getActivitySheet_() {
  return getSpreadsheet_().getSheetByName(ACTIVITY_SHEET_NAME);
}

// -- Applications --------------------------------------------------------

function readAllCandidates() {
  var sheet = getApplicationsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, COLS.length).getValues();
  var idIndex = COLS.indexOf('Candidate ID');
  return values
    .filter(function (r) { return String(r[idIndex] || '').trim().length > 0; })
    .map(rowToCandidate_);
}

function findCandidateRow(candidateId) {
  if (!candidateId) return -1;
  var sheet = getApplicationsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var idCol = colIndex('Candidate ID');
  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(candidateId)) return i + 2;
  }
  return -1;
}

function readCandidate(candidateId) {
  var row = findCandidateRow(candidateId);
  if (row < 0) return null;
  var sheet = getApplicationsSheet_();
  var values = sheet.getRange(row, 1, 1, COLS.length).getValues()[0];
  return rowToCandidate_(values);
}

function appendCandidate(record) {
  var sheet = getApplicationsSheet_();
  var row = COLS.map(function(name) {
    var v = record[name];
    return v == null ? '' : v;
  });
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function updateCandidateField(candidateId, columnName, value) {
  var row = findCandidateRow(candidateId);
  if (row < 0) throw new Error('Candidate not found: ' + candidateId);
  var sheet = getApplicationsSheet_();
  sheet.getRange(row, colIndex(columnName)).setValue(value);
  return true;
}

// Multi-field update -- one row lookup, N writes.
function updateCandidateFields(candidateId, pairs) {
  var row = findCandidateRow(candidateId);
  if (row < 0) throw new Error('Candidate not found: ' + candidateId);
  var sheet = getApplicationsSheet_();
  pairs.forEach(function(p) {
    sheet.getRange(row, colIndex(p[0])).setValue(p[1]);
  });
  return true;
}

function rowToCandidate_(values) {
  var obj = {};
  for (var i = 0; i < COLS.length; i++) {
    obj[COLS[i]] = values[i];
  }
  ['Applied', 'Send At', 'Sent On', 'Interview Booked', 'Diviya Notified'].forEach(function(k) {
    if (obj[k] instanceof Date) obj[k] = obj[k].toISOString();
  });
  return obj;
}

// -- Scores --------------------------------------------------------------

function findScoreRow(candidateId) {
  var sheet = getScoresSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(candidateId)) return i + 2;
  }
  return -1;
}

function readScores(candidateId) {
  var row = findScoreRow(candidateId);
  if (row < 0) return null;
  var sheet = getScoresSheet_();
  var values = sheet.getRange(row, 1, 1, SCORE_COLS.length).getValues()[0];
  var obj = {};
  for (var i = 0; i < SCORE_COLS.length; i++) obj[SCORE_COLS[i]] = values[i];
  if (obj['Per-Answer Notes JSON']) {
    try { obj.perAnswerNotes = JSON.parse(obj['Per-Answer Notes JSON']); }
    catch (e) { obj.perAnswerNotes = []; }
  } else {
    obj.perAnswerNotes = [];
  }
  if (obj['Updated'] instanceof Date) obj['Updated'] = obj['Updated'].toISOString();
  return obj;
}

function writeScores(candidateId, scoring) {
  var sheet = getScoresSheet_();
  var dims = scoring.dimensions || {};
  var row = [
    candidateId,
    dims['Critical Thinking']     || 0,
    dims['Written Communication'] || 0,
    dims['Judgement']             || 0,
    dims['Self-Awareness']        || 0,
    dims['Attitude']              || 0,
    dims['Problem-Solving']       || 0,
    dims['Attention to Detail']   || 0,
    dims['Time Management']       || 0,
    dims['Resilience']            || 0,
    dims['Integrity']             || 0,
    JSON.stringify(scoring.perAnswerNotes || []),
    scoring.strengths      || '',
    scoring.concerns       || '',
    scoring.recommendation || '',
    new Date()
  ];
  var existing = findScoreRow(candidateId);
  if (existing > 0) {
    sheet.getRange(existing, 1, 1, SCORE_COLS.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

// -- Activity log --------------------------------------------------------

function logActivity(candidateId, event, actor, detail) {
  var sheet = getActivitySheet_();
  sheet.appendRow([new Date(), candidateId || '', event || '', actor || 'system', detail || '']);
}

function readActivity(candidateId) {
  var sheet = getActivitySheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, ACTIVITY_COLS.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][1]) !== String(candidateId)) continue;
    out.push({
      timestamp: values[i][0] instanceof Date ? values[i][0].toISOString() : values[i][0],
      event: values[i][2],
      actor: values[i][3],
      detail: values[i][4]
    });
  }
  out.sort(function(a, b) { return a.timestamp < b.timestamp ? -1 : 1; });
  return out;
}

function generateCandidateId() {
  var rand = Utilities.getUuid().replace(/-/g, '').substr(0, 10);
  return 'c_' + rand;
}

// =====================================================================
// CACHE  --  5-minute TTL wrappers around CacheService
// =====================================================================

var CACHE_VERSION = 'v1';

function cacheKey_(parts) {
  return [CACHE_VERSION].concat(parts).join(':');
}

function cacheGetJson(parts) {
  var raw = CacheService.getScriptCache().get(cacheKey_(parts));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function cachePutJson(parts, value, ttl) {
  var key = cacheKey_(parts);
  var json = JSON.stringify(value);
  if (json.length < 95000) {
    CacheService.getScriptCache().put(key, json, ttl || CACHE_TTL_SECONDS);
    return;
  }
  var chunks = [];
  for (var i = 0; i < json.length; i += 90000) chunks.push(json.substring(i, i + 90000));
  var meta = { chunked: true, count: chunks.length };
  CacheService.getScriptCache().put(key, JSON.stringify(meta), ttl || CACHE_TTL_SECONDS);
  for (var j = 0; j < chunks.length; j++) {
    CacheService.getScriptCache().put(key + ':' + j, chunks[j], ttl || CACHE_TTL_SECONDS);
  }
}

function cacheBust(parts) {
  CacheService.getScriptCache().remove(cacheKey_(parts));
}

function cacheBustAll() {
  try {
    CacheService.getScriptCache().removeAll([
      cacheKey_(['list']),
      cacheKey_(['stats'])
    ]);
  } catch (e) {}
}

// =====================================================================
// SCORING  --  Anthropic API call, 10-dimension rubric
// =====================================================================

var DIMENSIONS = [
  'Critical Thinking',
  'Written Communication',
  'Judgement',
  'Self-Awareness',
  'Attitude',
  'Problem-Solving',
  'Attention to Detail',
  'Time Management',
  'Resilience',
  'Integrity'
];

var QUESTIONS = [
  'About Themselves (hobbies, spare time)',
  'When Something Went Wrong',
  'Three Urgent Tasks',
  'Friday 4:45 PM Scenario',
  'What a Paralegal Actually Does',
  'Email Rewrite Exercise',
  'Client Wants to Sue (Critical Thinking)',
  'Anything Else'
];

function scoreApplication(answers) {
  var prompt = buildScoringPrompt_(answers);
  var raw = callAnthropic_(prompt);
  var parsed = parseScoringResponse_(raw);
  parsed.decision = thresholdDecision_(parsed.overallScore);
  return parsed;
}

function thresholdDecision_(score) {
  var s = Number(score) || 0;
  if (s >= 50) return AI_DECISION.YES;
  return AI_DECISION.NO;
}

function buildScoringPrompt_(answers) {
  var system =
    'You are assessing a candidate for a paralegal role at a boutique commercial litigation firm in Kuala Lumpur. ' +
    'Read only the eight written answers below. Do not invent biographical details. ' +
    'Score each of the ten dimensions from 0-10. Be honest, not generous. ' +
    'A 7 is a strong answer; a 5 is acceptable; a 3 is weak. Reserve 9-10 for genuinely excellent reasoning. ' +
    'Then write a concise one-line rationale (<=140 chars), short strengths/concerns/recommendation paragraphs, ' +
    'and one short note per question. Output JSON only, no prose around it.';

  var qaBlocks = QUESTIONS.map(function(q, i) {
    var ans = answers['q' + (i + 1)] || answers[String(i + 1)] || '';
    return 'Q' + (i + 1) + '. ' + q + '\n' + (ans || '(no answer)');
  }).join('\n\n');

  var schema =
    '{\n' +
    '  "dimensions": {\n' +
    DIMENSIONS.map(function(d) { return '    "' + d + '": <0-10>'; }).join(',\n') + '\n' +
    '  },\n' +
    '  "overallScore": <0-100, the sum of dimensions>,\n' +
    '  "rationale": "<<=140 chars, one line>",\n' +
    '  "strengths": "<short paragraph>",\n' +
    '  "concerns": "<short paragraph>",\n' +
    '  "recommendation": "<short paragraph>",\n' +
    '  "perAnswerNotes": [\n' +
    '    { "question": "Q1 short title", "note": "<<=200 chars>" },\n' +
    '    ... eight entries total ...\n' +
    '  ]\n' +
    '}';

  return {
    system: system,
    user: 'CANDIDATE ANSWERS\n\n' + qaBlocks + '\n\nReply with JSON matching exactly this schema:\n' + schema
  };
}

function callAnthropic_(prompt) {
  var url = 'https://api.anthropic.com/v1/messages';
  var payload = {
    model: ANTHROPIC_MODEL,
    max_tokens: 2000,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }]
  };
  var response = UrlFetchApp.fetch(url, {
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
  var text = '';
  for (var i = 0; i < body.content.length; i++) {
    if (body.content[i].type === 'text') { text = body.content[i].text; break; }
  }
  return text;
}

function parseScoringResponse_(text) {
  var jsonText = text.trim();
  var fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonText = fenceMatch[1].trim();
  var braceStart = jsonText.indexOf('{');
  var braceEnd = jsonText.lastIndexOf('}');
  if (braceStart < 0 || braceEnd < 0) throw new Error('No JSON in scoring response');
  jsonText = jsonText.substring(braceStart, braceEnd + 1);

  var parsed = JSON.parse(jsonText);

  if (!parsed.overallScore && parsed.dimensions) {
    var total = 0;
    DIMENSIONS.forEach(function(d) { total += Number(parsed.dimensions[d] || 0); });
    parsed.overallScore = total;
  }
  return parsed;
}

function fallbackScoring_() {
  return {
    dimensions: {
      'Critical Thinking': 0, 'Written Communication': 0, 'Judgement': 0,
      'Self-Awareness': 0, 'Attitude': 0, 'Problem-Solving': 0,
      'Attention to Detail': 0, 'Time Management': 0, 'Resilience': 0, 'Integrity': 0
    },
    overallScore: 0,
    decision: AI_DECISION.NO,
    rationale: 'Auto-scoring failed - manual review required.',
    strengths: '', concerns: '', recommendation: 'Review this candidate manually.',
    perAnswerNotes: []
  };
}

// =====================================================================
// DOC  --  generate one Google Doc per candidate
// =====================================================================

function generateAnswersDoc(candidateId, candidate, answers, scoring, cvLink) {
  var safeName = String(candidate['Full Name'] || 'Unknown').replace(/[^a-zA-Z0-9 ]/g, '');
  var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var docName = safeName + ' - Answers & AI Notes - ' + dateStr;

  var doc = DocumentApp.create(docName);
  var body = doc.getBody();
  body.clear();

  body.appendParagraph('Paralegal Assessment').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(FIRM_NAME).setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  body.appendParagraph('Candidate ID: ' + candidateId);
  body.appendParagraph('Generated: ' + new Date().toLocaleString('en-GB'));
  body.appendHorizontalRule();

  body.appendParagraph('Candidate').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  appendKV_(body, 'Full Name', candidate['Full Name']);
  appendKV_(body, 'IC Name', candidate['IC Name']);
  appendKV_(body, 'IC Number', candidate['IC Number']);
  appendKV_(body, 'Email', candidate['Email']);
  appendKV_(body, 'Phone', candidate['Phone']);
  appendKV_(body, 'Address', candidate['Address']);
  appendKV_(body, 'Education', candidate['Education']);
  appendKV_(body, 'CV', cvLink || '(none)');

  body.appendParagraph('AI Assessment').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  appendKV_(body, 'Decision', scoring.decision + '  (Score: ' + scoring.overallScore + '/100)');
  appendKV_(body, 'Rationale', scoring.rationale || '');
  if (scoring.strengths)      { body.appendParagraph('Strengths').setHeading(DocumentApp.ParagraphHeading.HEADING2); body.appendParagraph(scoring.strengths); }
  if (scoring.concerns)       { body.appendParagraph('Concerns').setHeading(DocumentApp.ParagraphHeading.HEADING2); body.appendParagraph(scoring.concerns); }
  if (scoring.recommendation) { body.appendParagraph('Recommendation').setHeading(DocumentApp.ParagraphHeading.HEADING2); body.appendParagraph(scoring.recommendation); }

  body.appendParagraph('Score Breakdown').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  var scoreRows = DIMENSIONS.map(function(d) {
    return [d, String((scoring.dimensions || {})[d] || 0) + ' / 10'];
  });
  body.appendTable(scoreRows);

  body.appendParagraph('Answers & AI Notes').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  for (var i = 0; i < QUESTIONS.length; i++) {
    var qNum = i + 1;
    body.appendParagraph('Q' + qNum + '. ' + QUESTIONS[i]).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(answers['q' + qNum] || '(no answer)');
    var note = (scoring.perAnswerNotes && scoring.perAnswerNotes[i] && scoring.perAnswerNotes[i].note) || '';
    if (note) {
      var notePara = body.appendParagraph('AI note: ' + note);
      notePara.editAsText().setItalic(true).setForegroundColor('#6B6B6B');
    }
  }

  doc.saveAndClose();

  try {
    var docFile = DriveApp.getFileById(doc.getId());
    var folder = DriveApp.getFolderById(prop('FOLDER_ID'));
    folder.addFile(docFile);
    DriveApp.getRootFolder().removeFile(docFile);
  } catch (e) {
    Logger.log('Could not move Doc to folder: ' + e.message);
  }

  return doc.getUrl();
}

function appendKV_(body, key, value) {
  var p = body.appendParagraph('');
  p.appendText(key + ': ').setBold(true);
  p.appendText(String(value == null ? '' : value)).setBold(false);
}

// =====================================================================
// EMAIL  --  branded HTML templates + 24-hour delayed sender
// =====================================================================

function htmlEmailWrap_(bodyHtml) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
    "<body style=\"margin:0;padding:0;background:#F5F3EF;font-family:Georgia,'Times New Roman',serif;color:#0F1720;\">" +
    "<div style=\"max-width:600px;margin:0 auto;background:#ffffff;font-family:Georgia,'Times New Roman',serif;\">" +
      '<div style="background:#0F1720;padding:32px 40px;text-align:center;">' +
        '<div style="font-size:13px;letter-spacing:3px;color:#B89554;text-transform:uppercase;margin-bottom:6px;">Thomas Philip</div>' +
        '<div style="font-size:20px;color:#ffffff;">Advocates &amp; Solicitors</div>' +
        '<div style="width:40px;height:2px;background:#B89554;margin:16px auto 0;"></div>' +
      '</div>' +
      '<div style="padding:40px;font-size:15px;line-height:1.7;color:#2c3440;">' + bodyHtml + '</div>' +
      '<div style="background:#FAF7F0;padding:20px 40px;text-align:center;font-size:11px;color:#888;letter-spacing:1px;text-transform:uppercase;border-top:1px solid #e5e0d5;">' +
        'Thomas Philip &middot; Advocates &amp; Solicitors' +
      '</div>' +
    '</div></body></html>';
}

function getAcceptEmail_(name) {
  var hasCalendly = CALENDLY_LINK && CALENDLY_LINK.indexOf('YOUR-LINK') < 0;
  var bookingHtml = hasCalendly
    ? '<p><strong style="color:#0F1720;">Next step: a 15-minute screening call</strong></p>' +
      '<p>Please book a time that suits you using the link below:</p>' +
      '<p style="text-align:center;">' +
        '<a href="' + CALENDLY_LINK + '" style="display:inline-block;background:#B89554;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:6px;font-family:-apple-system,system-ui,sans-serif;font-size:14px;letter-spacing:0.5px;">Book Your Screening Call &rarr;</a>' +
      '</p>' +
      '<p style="color:#555;font-size:14px;">Available Monday to Friday. You will receive a confirmation email with the video call link once booked.</p>'
    : '<p><strong style="color:#0F1720;">Next step: a 15-minute screening call</strong></p>' +
      '<p>A member of our team will be in touch within 3 business days to arrange a time.</p>';

  var html =
    '<p>Dear ' + name + ',</p>' +
    '<p>Thank you for completing the paralegal assessment. We were impressed with your application and would like to invite you to the next stage.</p>' +
    bookingHtml +
    '<p>If we decide to proceed after the screening call, our team will be in touch with a formal acceptance and details of the 2-week trial.</p>' +
    '<p style="margin-top:32px;">Yours sincerely,</p>' +
    '<p><em>' + FIRM_NAME + '</em></p>';

  return {
    subject: "Thomas Philip: You've Been Shortlisted",
    body: 'Dear ' + name + ',\n\nThank you for completing the paralegal assessment. We were impressed with your application and would like to invite you to the next stage.\n\n' +
          (hasCalendly ? 'Please book a 15-minute screening call: ' + CALENDLY_LINK + '\n\n' : 'A member of our team will be in touch within 3 business days.\n\n') +
          'Yours sincerely,\n' + FIRM_NAME,
    htmlBody: htmlEmailWrap_(html)
  };
}

function getRejectEmail_(name) {
  var html =
    '<p>Dear ' + name + ',</p>' +
    '<p>Thank you for taking the time to complete the paralegal assessment at Thomas Philip. We appreciate the effort you put into your application.</p>' +
    '<p>After careful review, we regret to inform you that we are unable to offer you a place on the paralegal programme at this time.</p>' +
    "<p>Please don't take this as a reflection on your potential. There are always more strong candidates than positions available. We encourage you to continue developing your skills, and you are welcome to reapply in future.</p>" +
    '<p>We wish you every success in your legal journey.</p>' +
    '<p style="margin-top:32px;">Yours sincerely,</p>' +
    '<p><em>' + FIRM_NAME + '</em></p>';

  return {
    subject: 'Thomas Philip: Your Paralegal Application',
    body: 'Dear ' + name + ',\n\nThank you for completing the paralegal assessment. After careful review, we are unable to offer you a place on the programme at this time. We wish you every success in your legal journey.\n\nYours sincerely,\n' + FIRM_NAME,
    htmlBody: htmlEmailWrap_(html)
  };
}

function emailForDecision_(decision, name) {
  var d = String(decision || '').toUpperCase();
  if (d.indexOf('YES') >= 0) return getAcceptEmail_(name);
  return getRejectEmail_(name);
}

function sendCandidateEmail(candidateEmail, candidateName, decision) {
  if (!candidateEmail) return false;
  var email = emailForDecision_(decision, candidateName);
  try {
    GmailApp.sendEmail(candidateEmail, email.subject, email.body, {
      name: FIRM_NAME, cc: FIRM_EMAIL, replyTo: FIRM_EMAIL, htmlBody: email.htmlBody
    });
    return true;
  } catch (err) {
    Logger.log('Email send error: ' + err.message);
    return false;
  }
}

function sendInterviewInviteNow(candidateIdArg) {
  var candidateId = candidateIdArg || '';
  if (!candidateId) throw new Error('Pass a candidate ID, or paste it in the function body and Run.');
  var c = readCandidate(candidateId);
  if (!c) throw new Error('Candidate not found: ' + candidateId);

  var email = String(c['Email'] || '').trim();
  if (!email) throw new Error('Candidate has no email on file');
  var name = String(c['Full Name'] || '').trim();

  var ok = sendCandidateEmail(email, name, AI_DECISION.YES);
  if (!ok) throw new Error('Send failed - see Apps Script Logger');

  var pairs = [
    ['Email Status', 'SENT - ' + new Date().toISOString() + ' - INVITE (manual)'],
    ['Status', STATUS.SHORTLIST]
  ];
  if (String(c['AI Decision'] || '').toUpperCase() !== 'YES') {
    pairs.push(['AI Decision', AI_DECISION.YES]);
  }
  updateCandidateFields(candidateId, pairs);

  logActivity(candidateId, 'Interview invite sent (manual)', 'partner', email);
  cacheBust(['candidate', candidateId]);
  cacheBustAll();

  Logger.log('Sent interview invite to ' + name + ' <' + email + '>');
  return { ok: true, sentTo: email };
}

function sendDeclineNow(candidateIdArg) {
  var candidateId = candidateIdArg || '';
  if (!candidateId) throw new Error('Pass a candidate ID, or paste it in the function body and Run.');
  var c = readCandidate(candidateId);
  if (!c) throw new Error('Candidate not found: ' + candidateId);

  var email = String(c['Email'] || '').trim();
  if (!email) throw new Error('Candidate has no email on file');
  var name = String(c['Full Name'] || '').trim();

  var ok = sendCandidateEmail(email, name, AI_DECISION.NO);
  if (!ok) throw new Error('Send failed - see Apps Script Logger');

  var pairs = [
    ['Email Status', 'SENT - ' + new Date().toISOString() + ' - DECLINE (manual)'],
    ['Status', STATUS.DECLINE]
  ];
  if (String(c['AI Decision'] || '').toUpperCase() !== 'NO') {
    pairs.push(['AI Decision', AI_DECISION.NO]);
  }
  updateCandidateFields(candidateId, pairs);

  logActivity(candidateId, 'Decline email sent (manual)', 'partner', email);
  cacheBust(['candidate', candidateId]);
  cacheBustAll();

  Logger.log('Sent decline to ' + name + ' <' + email + '>');
  return { ok: true, sentTo: email };
}

function declineMuslim() {
  var rows = readAllCandidates();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['Email'] || '').toLowerCase().trim() === 'muslimradzuan2208@gmail.com') {
      return sendDeclineNow(rows[i]['Candidate ID']);
    }
  }
  throw new Error('Muslim not found in sheet - run importMuslim first.');
}

// -- Hourly trigger: process scheduled queue ----------------------------

function processPendingEmails() {
  var sheet = getApplicationsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var values = sheet.getRange(2, 1, lastRow - 1, COLS.length).getValues();
  var emailStatusCol = colIndex('Email Status');
  var sentCount = 0;

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var rowNum = i + 2;
    var cand = rowToCandidate_(row);

    if (cand['Email Status'] !== 'SCHEDULED') continue;
    if (!cand['Send At']) continue;

    var sendAt = new Date(cand['Send At']);
    if (isNaN(sendAt.getTime()) || sendAt > new Date()) continue;

    var ok = sendCandidateEmail(cand['Email'], cand['Full Name'], cand['AI Decision']);
    var newStatus = ok
      ? 'SENT - ' + new Date().toISOString()
      : 'FAILED - ' + new Date().toISOString();
    sheet.getRange(rowNum, emailStatusCol).setValue(newStatus);

    logActivity(cand['Candidate ID'], ok ? 'Email sent' : 'Email failed', 'system', cand['AI Decision']);
    sentCount++;
  }

  cacheBustAll();
  Logger.log('processPendingEmails: ' + sentCount + ' email(s) sent');
}

function notifyDiviya(candidateId, decision) {
  var c = readCandidate(candidateId);
  if (!c) return;
  var isAccept = String(decision).toUpperCase() === 'ACCEPT';
  var subject = (isAccept ? 'Paralegal ACCEPTANCE to send - ' : 'Paralegal REJECTION to send - ') + c['Full Name'];
  var body =
    'Hi Diviya,\n\n' +
    'Post-interview decision from Niamh: ' + decision + '\n\n' +
    'CANDIDATE\n' +
    '  Name:   ' + c['Full Name'] + '\n' +
    '  Email:  ' + c['Email'] + '\n' +
    '  Phone:  ' + c['Phone'] + '\n' +
    '  Doc:    ' + c['Answers Doc Link'] + '\n\n' +
    (isAccept
      ? 'Please send the formal acceptance email with details of the 2-week trial.'
      : 'Please send a polite decline email thanking them for their time.') +
    '\n\n-- Auto-generated from the Paralegal Recruitment System';

  GmailApp.sendEmail(DIVIYA_EMAIL, subject, body, {
    name: FIRM_NAME, cc: FIRM_EMAIL, replyTo: FIRM_EMAIL
  });
  updateCandidateField(candidateId, 'Diviya Notified', new Date());
  logActivity(candidateId, 'Diviya notified', 'system', decision);
}

// =====================================================================
// INTAKE  --  defensive form-submission handler
// =====================================================================
//
// Order of operations matters. We persist the candidate row BEFORE any
// risky operation (Anthropic call, Doc creation, Drive upload) so that
// even a total crash leaves a visible record. Each side-effect is
// wrapped so one failure cannot sink the others.
//
// Three new safety nets:
//   1. RawIntake tab stores the raw payload, replayable.
//   2. notifyOps_ emails FIRM_EMAIL on every recoverable failure.
//   3. doPost logs a SLOW warning above SLOW_DOPOST_MS (default 8s).
// =====================================================================

function handleIntake(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
  if (!payload.email) throw new Error('Missing email');
  if (!payload.name)  throw new Error('Missing name');

  var candidateId = generateCandidateId();
  var answers = {
    q1: payload.q1 || '', q2: payload.q2 || '', q3: payload.q3 || '', q4: payload.q4 || '',
    q5: payload.q5 || '', q6: payload.q6 || '', q7: payload.q7 || '', q8: payload.q8 || ''
  };

  // 1. PERSIST FIRST -- placeholder row so the candidate is never lost.
  var candidate = {
    'Candidate ID':      candidateId,
    'Applied':           new Date(),
    'Full Name':         payload.name || '',
    'Email':             payload.email || '',
    'Phone':             payload.phone || '',
    'IC Name':           payload.icName || '',
    'IC Number':         payload.ic || '',
    'Address':           payload.address || '',
    'Education':         payload.edu || '',
    'AI Decision':       '',
    'AI Rationale':      'Pending scoring...',
    'Score':             0,
    'Status':            STATUS.NEW,
    'CV Link':           '',
    'Answers Doc Link':  '',
    'Interview Booked':  '',
    'Email Status':      'PENDING_INTAKE',
    'Send At':           '',
    'Newsletter Opt-in': payload.crmMTP  ? 'YES' : 'NO',
    'CRM Opt-in':        payload.crmTPAS ? 'YES' : 'NO',
    'Time Used':         payload.timeUsed || '',
    'Post-Interview':    '',
    'Diviya Notified':   '',
    'Letter Sent':       false,
    'Sent On':           ''
  };
  appendCandidate(candidate);
  stashRawPayload_(candidateId, payload, answers);
  logActivity(candidateId, 'Applied (intake started)', 'candidate', '');

  // 2. CV upload -- isolated.
  var cvLink = '';
  try {
    if (payload.resumeData && payload.resumeName) cvLink = uploadCV_(payload, candidateId);
    if (cvLink) updateCandidateField(candidateId, 'CV Link', cvLink);
  } catch (e) {
    logActivity(candidateId, 'CV upload failed', 'system', e.message);
    notifyOps_('CV upload failed', candidateId, e);
  }

  // 3. Scoring -- has its own fallback.
  var scoring;
  try { scoring = scoreApplication(answers); }
  catch (e) {
    logActivity(candidateId, 'Scoring failed (using fallback)', 'system', e.message);
    notifyOps_('Scoring failed', candidateId, e);
    scoring = fallbackScoring_();
  }
  updateCandidateFields(candidateId, [
    ['AI Decision',  scoring.decision],
    ['AI Rationale', (scoring.rationale || '').substring(0, 200)],
    ['Score',        scoring.overallScore || 0],
    ['Status',       aiDecisionToStatus(scoring.decision)],
    ['Email Status', 'SCHEDULED'],
    ['Send At',      new Date(Date.now() + EMAIL_DELAY_HOURS * 3600 * 1000).toISOString()]
  ]);
  try { writeScores(candidateId, scoring); }
  catch (e) { notifyOps_('writeScores failed', candidateId, e); }

  // 4. Doc generation -- isolated. If it fails we still have the row.
  var docLink = '';
  try {
    docLink = generateAnswersDoc(candidateId, readCandidate(candidateId), answers, scoring, cvLink);
    updateCandidateField(candidateId, 'Answers Doc Link', docLink);
  } catch (e) {
    logActivity(candidateId, 'Doc generation failed', 'system', e.message);
    notifyOps_('Doc generation failed', candidateId, e);
  }

  cacheBustAll();
  return {
    candidateId: candidateId,
    decision: scoring.decision,
    score: scoring.overallScore,
    cvLink: cvLink,
    docLink: docLink,
    emailScheduledFor: new Date(Date.now() + EMAIL_DELAY_HOURS * 3600 * 1000).toISOString()
  };
}

function uploadCV_(payload, candidateId) {
  var folder = DriveApp.getFolderById(prop('FOLDER_ID'));
  var decoded = Utilities.base64Decode(payload.resumeData);
  var blob = Utilities.newBlob(decoded, payload.resumeType || 'application/pdf', payload.resumeName);
  var file = folder.createFile(blob);
  var safeName = String(payload.name || 'Unknown').replace(/[^a-zA-Z0-9 ]/g, '');
  file.setName(safeName + ' [' + candidateId + '] - ' + payload.resumeName);
  return file.getUrl();
}

// Drop the raw payload into a hidden tab so any intake can be replayed.
function stashRawPayload_(candidateId, payload, answers) {
  try {
    var ss = getSpreadsheet_();
    var sheet = ss.getSheetByName(RAW_INTAKE_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(RAW_INTAKE_SHEET);
      sheet.appendRow(['Timestamp', 'Candidate ID', 'Payload JSON']);
      sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.hideSheet();
    }
    // Strip the base64 CV blob -- it's huge and already in Drive.
    var safe = {};
    for (var k in payload) if (k !== 'resumeData') safe[k] = payload[k];
    sheet.appendRow([new Date(), candidateId, JSON.stringify(safe)]);
  } catch (e) {
    Logger.log('stashRawPayload_ failed: ' + e.message);
  }
}

// Email an alert to FIRM_EMAIL whenever an isolated step fails.
function notifyOps_(stage, candidateId, err) {
  Logger.log(stage + ' [' + candidateId + ']: ' + err.message + (err.stack ? ('\n' + err.stack) : ''));
  try {
    MailApp.sendEmail({
      to: FIRM_EMAIL,
      subject: 'Intake error: ' + stage + ' (' + candidateId + ')',
      body: 'Stage: ' + stage + '\nCandidate: ' + candidateId +
            '\nTime: ' + new Date().toISOString() +
            '\n\nError: ' + err.message +
            '\n\nStack:\n' + (err.stack || '(no stack)')
    });
  } catch (mailErr) {
    Logger.log('notifyOps_ email send failed: ' + mailErr.message);
  }
}

// Replay a failed/incomplete intake from the RawIntake tab. Pass a
// candidate ID; we look up the most recent raw payload for that ID
// (or, if none found, you can pass the raw JSON string directly).
function replayFromRaw(candidateId) {
  if (!candidateId) throw new Error('Pass a candidate ID');
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(RAW_INTAKE_SHEET);
  if (!sheet) throw new Error('No RawIntake tab found');
  var values = sheet.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][1]) === String(candidateId)) {
      var payload = JSON.parse(values[i][2]);
      Logger.log('Replaying intake for ' + candidateId);
      return handleIntake(payload);
    }
  }
  throw new Error('No raw payload found for ' + candidateId);
}

// =====================================================================
// CALENDLY  --  webhook receiver for invitee.created events
// =====================================================================

function handleCalendlyWebhook(payload) {
  if (!payload || !payload.payload) {
    return { ok: false, reason: 'no payload' };
  }

  var p = payload.payload;
  var inviteeEmail = (p.email || (p.invitee && p.invitee.email) || '').toLowerCase().trim();
  var startTime = p.scheduled_event && p.scheduled_event.start_time;

  if (!inviteeEmail) return { ok: false, reason: 'no invitee email' };

  var sheet = getApplicationsSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: false, reason: 'no candidates' };

  var emailCol = colIndex('Email');
  var idCol = colIndex('Candidate ID');
  var values = sheet.getRange(2, 1, lastRow - 1, COLS.length).getValues();

  for (var i = 0; i < values.length; i++) {
    var rowEmail = String(values[i][emailCol - 1] || '').toLowerCase().trim();
    if (rowEmail !== inviteeEmail) continue;
    var candidateId = values[i][idCol - 1];

    var bookedDate = startTime ? new Date(startTime) : new Date();
    sheet.getRange(i + 2, colIndex('Interview Booked')).setValue(bookedDate);
    logActivity(candidateId, 'Interview booked', 'calendly', startTime || '');
    cacheBustAll();
    return { ok: true, candidateId: candidateId, bookedAt: bookedDate.toISOString() };
  }

  return { ok: false, reason: 'no match for ' + inviteeEmail };
}

// =====================================================================
// ROUTER  --  doGet / doPost dispatch
// =====================================================================
//
// Read endpoints (doGet, ?action=...):
//   ping                 -> liveness check (open)
//   cases                -> Court Update case-lookup site, HTML (open --
//                           public-facing content, READY rows only)
//   list                 -> dashboard rows + summary counts (REQUIRES KEY)
//   candidate&id=...     -> full profile payload (REQUIRES KEY)
//
// Write endpoints (doPost, ?action=...):
//   intake               -> public form submission (no key)
//   calendlyHook         -> Calendly webhook (auth via CALENDLY_WEBHOOK_KEY)
//   setStatus            -> flip Status column (REQUIRES KEY)
//   setPostInterview     -> flip Post-Interview, notify Diviya (REQUIRES KEY)
//
// SECURITY: list/candidate now require ?key=<FIRM_PASSWORD>. Without
// this, anyone with the web app URL could read every candidate's PII
// (name, IC, address, phone, AI scores). FIRM_PASSWORD must be set in
// Script Properties; there is no default. Update your dashboard caller
// to include the key.
// =====================================================================

function doGet(e) {
  var action = (e.parameter.action || 'ping').toLowerCase();

  try {
    if (action === 'ping') {
      return jsonOut_({ ok: true, name: FIRM_NAME, time: new Date().toISOString() });
    }
    if (action === 'cases') {
      return caseLookupPage();
    }
    if (action === 'list') {
      requireFirmKey_(e);
      return jsonOut_(getListPayload_());
    }
    if (action === 'candidate') {
      requireFirmKey_(e);
      return jsonOut_(getCandidatePayload_(e.parameter.id));
    }
    return jsonOut_({ ok: false, error: 'Unknown action: ' + action }, 400);
  } catch (err) {
    Logger.log('doGet error [' + action + ']: ' + err.message);
    return jsonOut_({ ok: false, error: err.message }, err.code || 500);
  }
}

function doPost(e) {
  var t0 = Date.now();
  var action = (e.parameter.action || 'intake').toLowerCase();

  try {
    var body = {};
    if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }
    }

    if (action === 'intake') {
      return jsonOut_({ ok: true, result: handleIntake(body) });
    }
    if (action === 'calendlyhook') {
      var expectedKey = propOptional('CALENDLY_WEBHOOK_KEY');
      if (expectedKey && e.parameter.key !== expectedKey) {
        return jsonOut_({ ok: false, error: 'unauthorized' }, 401);
      }
      return jsonOut_({ ok: true, result: handleCalendlyWebhook(body) });
    }

    requireFirmKey_(e);

    if (action === 'setstatus') {
      var id = body.candidateId || e.parameter.id;
      var status = body.status || e.parameter.status;
      if (!id || !status) throw new Error('Missing candidateId or status');
      if (STATUS_VALUES.indexOf(status) < 0) throw new Error('Invalid status: ' + status);
      updateCandidateField(id, 'Status', status);
      logActivity(id, 'Status changed', body.actor || 'partner', status);
      cacheBust(['candidate', id]);
      cacheBustAll();
      return jsonOut_({ ok: true });
    }

    if (action === 'setpostinterview') {
      var id2 = body.candidateId || e.parameter.id;
      var decision = (body.decision || e.parameter.decision || '').toUpperCase();
      if (!id2 || !decision) throw new Error('Missing candidateId or decision');
      if (decision !== 'ACCEPT' && decision !== 'REJECT') throw new Error('Invalid decision');
      updateCandidateField(id2, 'Post-Interview', decision);
      logActivity(id2, 'Post-interview decision', body.actor || 'partner', decision);
      notifyDiviya(id2, decision);
      cacheBust(['candidate', id2]);
      cacheBustAll();
      return jsonOut_({ ok: true });
    }

    return jsonOut_({ ok: false, error: 'Unknown action: ' + action }, 400);
  } catch (err) {
    Logger.log('doPost error [' + action + ']: ' + err.message + (err.stack ? ('\n' + err.stack) : ''));
    notifyOps_('doPost ' + action, '(none)', err);
    return jsonOut_({ ok: false, error: err.message }, err.code || 500);
  } finally {
    var ms = Date.now() - t0;
    if (ms > SLOW_DOPOST_MS) {
      Logger.log('SLOW doPost ' + action + ': ' + ms + 'ms');
    }
  }
}

function getListPayload_() {
  var cached = cacheGetJson(['list']);
  if (cached) return cached;

  var candidates = readAllCandidates();

  var counts = { applications: 0, shortlisted: 0, interviewed: 0, offered: 0, declined: 0, cancelled: 0 };
  var slim = candidates.map(function(c) {
    counts.applications++;
    var st = String(c['Status'] || '').toUpperCase();
    if (st === 'SHORTLIST')   counts.shortlisted++;
    if (st === 'INTERVIEWED') counts.interviewed++;
    if (st === 'OFFERED')     counts.offered++;
    if (st === 'DECLINE')     counts.declined++;
    if (st === 'CANCELLED')   counts.cancelled++;

    return {
      id:           c['Candidate ID'],
      applied:      c['Applied'],
      name:         c['Full Name'],
      email:        c['Email'],
      phone:        c['Phone'],
      education:    c['Education'],
      score:        Number(c['Score']) || 0,
      aiDecision:   c['AI Decision'],
      aiRationale:  c['AI Rationale'],
      status:       c['Status'],
      cvLink:       c['CV Link'],
      docLink:      c['Answers Doc Link'],
      interviewBooked: c['Interview Booked'],
      emailStatus:  c['Email Status'],
      postInterview: c['Post-Interview']
    };
  });

  var now = Date.now();
  var attention = slim.filter(function(c) {
    if (String(c.status).toUpperCase() !== 'SHORTLIST') return false;
    if (c.interviewBooked) return false;
    var applied = c.applied ? new Date(c.applied).getTime() : 0;
    return applied && (now - applied) > 48 * 3600 * 1000;
  });

  var payload = {
    ok: true,
    counts: counts,
    candidates: slim,
    attention: attention.map(function(c) { return { id: c.id, name: c.name, applied: c.applied }; }),
    generatedAt: new Date().toISOString()
  };
  cachePutJson(['list'], payload);
  return payload;
}

function getCandidatePayload_(id) {
  if (!id) throw new Error('Missing id');
  var cached = cacheGetJson(['candidate', id]);
  if (cached) return cached;

  var c = readCandidate(id);
  if (!c) throw new Error('Candidate not found: ' + id);
  var s = readScores(id) || {};
  var activity = readActivity(id);

  var dimensions = {};
  DIMENSIONS.forEach(function(d) { dimensions[d] = Number(s[d] || 0); });

  var payload = {
    ok: true,
    candidate: {
      id: c['Candidate ID'],
      applied: c['Applied'],
      name: c['Full Name'],
      email: c['Email'],
      phone: c['Phone'],
      icName: c['IC Name'],
      icNumber: c['IC Number'],
      address: c['Address'],
      education: c['Education'],
      cvLink: c['CV Link'],
      docLink: c['Answers Doc Link'],
      interviewBooked: c['Interview Booked'],
      emailStatus: c['Email Status'],
      sendAt: c['Send At'],
      newsletterOptIn: c['Newsletter Opt-in'],
      crmOptIn: c['CRM Opt-in'],
      timeUsed: c['Time Used'],
      postInterview: c['Post-Interview'],
      letterSent: c['Letter Sent'],
      sentOn: c['Sent On']
    },
    aiDecision: c['AI Decision'],
    aiRationale: c['AI Rationale'],
    score: Number(c['Score']) || 0,
    status: c['Status'],
    dimensions: dimensions,
    perAnswerNotes: s.perAnswerNotes || [],
    strengths: s['Strengths'] || '',
    concerns: s['Concerns'] || '',
    recommendation: s['Recommendation'] || '',
    activity: activity,
    generatedAt: new Date().toISOString()
  };
  cachePutJson(['candidate', id], payload);
  return payload;
}

function requireFirmKey_(e) {
  var expected = prop('FIRM_PASSWORD'); // throws if not in Script Properties
  var got = (e.parameter.key || (e.postData && e.postData.contents && safeParse_(e.postData.contents).key) || '');
  if (got !== expected) {
    var err = new Error('unauthorized');
    err.code = 401;
    throw err;
  }
}

function safeParse_(s) {
  try { return JSON.parse(s); } catch (e) { return {}; }
}

function jsonOut_(obj, code) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================================
// TRIGGERS  --  install / refresh time-based and on-edit triggers
// =====================================================================

function setupAllTriggers() {
  var managed = ['processPendingEmails', 'handleSheetEdit'];
  var existing = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < existing.length; i++) {
    if (managed.indexOf(existing[i].getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(existing[i]); removed++;
    }
  }

  ScriptApp.newTrigger('processPendingEmails').timeBased().everyHours(1).create();

  ScriptApp.newTrigger('handleSheetEdit')
    .forSpreadsheet(SpreadsheetApp.openById(prop('SHEET_ID')))
    .onEdit().create();

  Logger.log('Triggers refreshed. Removed ' + removed + ', created 2.');
}

function handleSheetEdit(e) {
  try {
    var sheet = e.source.getActiveSheet();
    if (sheet.getName() !== SHEET_NAME) return;

    var col = e.range.getColumn();
    var row = e.range.getRow();
    if (row === 1) return;

    var idCol = colIndex('Candidate ID');
    var candidateId = sheet.getRange(row, idCol).getValue();
    if (!candidateId) return;

    if (col === colIndex('Status')) {
      var newStatus = String(e.value || '').trim();
      if (STATUS_VALUES.indexOf(newStatus) >= 0) {
        logActivity(candidateId, 'Status changed', 'sheet-edit', newStatus);
        cacheBust(['candidate', candidateId]);
        cacheBustAll();
      }
      return;
    }

    if (col === colIndex('Post-Interview')) {
      var decision = String(e.value || '').toUpperCase().trim();
      if (decision !== 'ACCEPT' && decision !== 'REJECT') return;
      var notifiedCell = sheet.getRange(row, colIndex('Diviya Notified'));
      if (notifiedCell.getValue()) return;
      notifyDiviya(candidateId, decision);
      return;
    }

    if (col === colIndex('Letter Sent')) {
      var checked = e.value === 'TRUE' || e.value === true;
      var sentOn = sheet.getRange(row, colIndex('Sent On'));
      if (checked) {
        sentOn.setValue(new Date());
        logActivity(candidateId, 'Letter sent', 'diviya', '');
      } else {
        sentOn.setValue('');
      }
      cacheBust(['candidate', candidateId]);
      cacheBustAll();
      return;
    }
  } catch (err) {
    Logger.log('handleSheetEdit error: ' + err.message);
  }
}

// =====================================================================
// TEST  --  fixtures for trying the dashboard without the live form
// =====================================================================

function seedTestData() {
  bootstrapSheet();

  var fixtures = [
    { name: 'Aisha Rahman',      score: 84, decision: 'YES', booked: true,  status: STATUS.SHORTLIST,    education: 'LL.B (Hons), Universiti Malaya' },
    { name: 'Daniel Lim',        score: 72, decision: 'YES', booked: false, status: STATUS.SHORTLIST,    education: 'LL.B, Multimedia University' },
    { name: 'Priya Subramaniam', score: 65, decision: 'YES', booked: false, status: STATUS.UNDER_REVIEW, education: 'LL.B, Universiti Kebangsaan Malaysia' },
    { name: 'Marcus Tan',        score: 58, decision: 'YES', booked: false, status: STATUS.SHORTLIST,    education: 'LL.B, Universiti Teknologi MARA' },
    { name: 'Hannah Yeoh',       score: 41, decision: 'NO',  booked: false, status: STATUS.DECLINE,      education: 'BA (Hons) Law and Politics, INTI' },
    { name: 'Rahul Menon',       score: 88, decision: 'YES', booked: true,  status: STATUS.INTERVIEWED,  education: 'LL.B (Hons), Universiti Malaya' },
    { name: 'Siti Aminah',       score: 35, decision: 'NO',  booked: false, status: STATUS.CANCELLED,    education: 'LL.B, Taylors University' }
  ];

  var now = Date.now();

  for (var i = 0; i < fixtures.length; i++) {
    var f = fixtures[i];
    var id = 'c_TEST' + (i + 1);
    var appliedAt = new Date(now - (fixtures.length - i) * 24 * 3600 * 1000);

    var record = {
      'Candidate ID':      id,
      'Applied':           appliedAt,
      'Full Name':         f.name,
      'Email':             f.name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com',
      'Phone':             '+60 12-345 ' + (1000 + i),
      'IC Name':           f.name,
      'IC Number':         '99' + (10000 + i) + '-14-5678',
      'Address':           '12 Jalan Sample, 50450 Kuala Lumpur',
      'Education':         f.education,
      'AI Decision':       f.decision,
      'AI Rationale':      sampleRationale_(f.decision),
      'Score':             f.score,
      'Status':            f.status,
      'CV Link':           '',
      'Answers Doc Link':  '',
      'Interview Booked':  f.booked ? new Date(now + 3 * 24 * 3600 * 1000) : '',
      'Email Status':      'SCHEDULED',
      'Send At':           new Date(appliedAt.getTime() + 24 * 3600 * 1000).toISOString(),
      'Newsletter Opt-in': i % 2 === 0 ? 'YES' : 'NO',
      'CRM Opt-in':        'YES',
      'Time Used':         '00:' + (40 + i) + ':' + (10 + i),
      'Post-Interview':    f.status === STATUS.INTERVIEWED ? 'ACCEPT' : '',
      'Diviya Notified':   '',
      'Letter Sent':       false,
      'Sent On':           ''
    };

    appendCandidate(record);
    writeScores(id, sampleScoring_(f.score, f.decision));
    logActivity(id, 'Applied', 'candidate', f.decision + ' (' + f.score + '/100)');
    if (f.booked) logActivity(id, 'Interview booked', 'calendly', '');
    if (f.status === STATUS.INTERVIEWED) {
      logActivity(id, 'Post-interview decision', 'partner', 'ACCEPT');
    }
  }

  cacheBustAll();
  Logger.log('Seeded ' + fixtures.length + ' test candidates.');
}

function clearTestData() {
  var ss = getSpreadsheet_();

  ['Applications', 'Scores', 'ActivityLog'].forEach(function (tab) {
    var sheet = ss.getSheetByName(tab);
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    var idCol = (tab === 'ActivityLog') ? 2 : 1;
    var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    for (var i = ids.length - 1; i >= 0; i--) {
      if (String(ids[i][0]).indexOf('c_TEST') === 0) {
        sheet.deleteRow(i + 2);
      }
    }
  });

  cacheBustAll();
  Logger.log('Cleared test rows.');
}

function sampleRationale_(decision) {
  if (decision === 'YES') return 'Clear thinking, careful writing, realistic about the job. Worth meeting.';
  return 'Generic answers, weak attention to detail, does not engage with what was asked.';
}

function sampleScoring_(score, decision) {
  var avg = Math.round(score / 10);
  var jitter = function () { return Math.max(0, Math.min(10, avg + (Math.random() < 0.5 ? -1 : 1))); };
  return {
    dimensions: {
      'Critical Thinking':     jitter(),
      'Written Communication': jitter(),
      'Judgement':             jitter(),
      'Self-Awareness':        jitter(),
      'Attitude':              jitter(),
      'Problem-Solving':       jitter(),
      'Attention to Detail':   jitter(),
      'Time Management':       jitter(),
      'Resilience':            jitter(),
      'Integrity':             jitter()
    },
    overallScore: score,
    decision: decision,
    rationale: sampleRationale_(decision),
    strengths: decision === 'NO'
      ? 'Engaged with the form. Submitted on time.'
      : 'Reads the question carefully. Writes in plain English. Realistic about the role.',
    concerns: decision === 'YES'
      ? 'Limited prior exposure to litigation work. Would need close supervision in first weeks.'
      : 'Several answers feel generic or off-topic. Would want to see how they reason under pressure.',
    recommendation: decision === 'YES'
      ? 'Invite to a 15-minute screening call.'
      : 'Polite decline; encourage future applications.',
    perAnswerNotes: [
      { question: 'Q1 - About themselves',          note: 'Specific, not boilerplate. Mentions concrete habits.' },
      { question: 'Q2 - When something went wrong', note: 'Owns the mistake. Names what they would change.' },
      { question: 'Q3 - Three urgent tasks',        note: 'Reasonable triage. Does not pretend everything is equally urgent.' },
      { question: 'Q4 - Friday 4:45pm',             note: 'Recognises the constraint and proposes a workable plan.' },
      { question: 'Q5 - What a paralegal does',     note: 'Plausible, not romanticised. Knows the work is admin-heavy.' },
      { question: 'Q6 - Email rewrite',             note: 'Tightened the original. Tone shifted appropriately.' },
      { question: 'Q7 - Client wants to sue',       note: 'Asks the right preliminary questions before advising.' },
      { question: 'Q8 - Anything else',             note: 'Concise. Does not pad.' }
    ]
  };
}

// =====================================================================
// IMPORT  --  one-off importers for legacy submissions
// =====================================================================

function importLegacyCandidate() {
  var payload = {
    name:    'Muhammad Muslim',
    email:   '',
    phone:   '',
    edu:     '',
    icName:  '',
    ic:      '',
    address: '',
    crmMTP:  false,
    crmTPAS: false,
    timeUsed: '',
    q1: '', q2: '', q3: '', q4: '',
    q5: '', q6: '', q7: '', q8: ''
  };

  var originalAppliedAt = '2026-05-07T00:00:00';

  if (!payload.email) throw new Error('Fill in the email field before running.');
  if (!payload.q1)    throw new Error('Fill in at least q1 before running.');

  var result = handleIntake(payload);

  if (originalAppliedAt) {
    var d = new Date(originalAppliedAt);
    if (!isNaN(d.getTime())) {
      updateCandidateField(result.candidateId, 'Applied', d);
      logActivity(result.candidateId, 'Backfilled Applied date', 'system', d.toISOString());
    }
  }

  updateCandidateField(result.candidateId, 'Email Status',
    'IMPORTED - candidate already received email from legacy form');

  cacheBustAll();
  Logger.log('Imported ' + payload.name + ' as ' + result.candidateId +
             ' - score ' + result.score + '/100 (' + result.decision + ').');
  return result;
}

function importMuslim() {
  var payload = {
    name: 'MUHAMMAD MUSLIM BIN HAJI MOHAMMAD RADZUAN',
    email: 'muslimradzuan2208@gmail.com',
    phone: '+601119726649',
    edu: 'Final Year Law Student',
    icName: 'MUHAMMAD MUSLIM BIN HAJI MOHAMMAD RADZUAN',
    ic: '03082210-0033',
    address: 'LOT 4928D, BATU 19 KAMPUNG KUALA PERDIK, HULU LANGAT 43100 SELANGOR.',
    crmMTP: true,
    crmTPAS: true,
    timeUsed: '',
    q1: "My name is Muslim Radzuan. People call me Muhammad Muslim, my friend call me Muslim and my close friends call me Mus. My hobby is going to the gym where this is my current addiction of me going there. I just started going to the gym since July 2025 and am consistent going there. What makes me interesting is I could eat a lot of chicken in one session where I would say that is very interesting about me. I also have a nice vibe if a person gets to know me better.",
    q2: "This happened when I was handling an event during my study in year 3. I was a program manager in one particular event. It was quite a big event as it is an annual faculty event, namely AIKOLFEST. There was no sufficient budget to actually cover the event. It took me a very long and depth thinking in finding sponsors from firms and company. Usually, it goes well based on the last tenure of the programme. But, during my time, it was insufficient in budget to actually start the event. Perhaps, it was a bit late due to some internal reasons. Therefore, the income and sponsors were a bit reluctant to provide some. Fortunately, my team and I decided to sell our stuff in the store where we have so many unused stuff, eg: sport jersey from last event, shoes and blazers. We managed to sell it by opening a car booot and it was some sort of a successful initiative. The, we sell more stuffs from our store too. It was not much, but we still got sum of money. I could learn something where, things we have planned, will not always in a straight line. Therefore, expect the worst to prepare the worse.",
    q3: "A court document because it is our client's case and we have duty to the client and court.Then, lawyer's letter that must go out today as it is important where he or she is our master that should be obeyed. Then, I will leave the client's call because that was the least important and I will explain to the client on the situation happened and try to apologize.",
    q4: "I would explain to the lawyer that the file was never sealed and collected truthfully. The, apologize to the lawyer and explain that it would never be happened again in the future.",
    q5: "Helping lawyers, chambering students and staff in filing. Not doing it as a whole, but helping to do research and alert the date for filing to the court.",
    q6: "Dear Mr. Tan,\n\nI hope you are doing well.\n\nI would like to informed you that we have checked your file and we found that the other party has yet to respond where it was brought to our attention that it has been 3 weeks.\n\nHowever, we will try to follow up with the other party and we are not certain when they will reply us.\n\nDo let me know if you have any inquiries.\n\nThank you.\n\nRegards,\nMuslim Radzuan",
    q7: "Yes, because it was for personal things where he or she should not be doing it. Also, anything should be informed for the transparency in the beginning.",
    q8: "I apologize for not having a good answer as I have insufficient time in answering these questions. I was very focus on the early part that consequently making me lost at the last part of the question. This taught me where I should not be focusing on something too much because there are other things waiting for me to be done and answered.\n\nThank you."
  };

  var result = handleIntake(payload);

  updateCandidateField(result.candidateId, 'Applied', new Date('2026-05-07T00:00:00'));
  logActivity(result.candidateId, 'Backfilled Applied date', 'system', '2026-05-07');

  updateCandidateField(result.candidateId, 'Email Status',
    'IMPORTED - candidate already received email from legacy form');

  cacheBustAll();
  Logger.log('Imported ' + payload.name + ' as ' + result.candidateId +
             ' - score ' + result.score + '/100 (' + result.decision + ').');
  return result;
}

// =====================================================================
// RECOVERY  --  Balvinder Kaur Dhaliwal (lost from doPost 4 May 21:43)
// =====================================================================

function recoverBalvinder() {
  var candidateId = generateCandidateId();
  var appliedAt = new Date('2026-05-04T21:43:03');

  var answers = {
    q1: "I am what people would describe as a jack-of-all-trades. I'm very open-minded and very curious about a lot of things. From adventurous activities to poetry and politics, I love trying new things and experiencing life at its fullest. My hobbies would include traveling, playing tennis and just anything that gets the body moving. I am also big into fitness as I've been working at a boutique gym for the past 5 years and I've been keen on improving my strength and body agility.\n\nApart from the hobbies I have, I do also love meeting new people and constantly networking because I believe that your net worth IS your network. And the more people you meet, the broader your horizons get because you're always learning something from them!\n\nAll in all, I'm an avid believer that life's biggest lessons comes from the experiences outside instead of the theory you read in a class. And always always glass half full type of person!",
    q2: "Earlier this year, as I was approaching towards the end of my final semester, I was already thinking of what my future would look like. And I didn't want the studying to stop (or rather was not ready to be an adult yet), I applied for a Masters programme in Europe. Much to my dismay, I was rejected from getting the scholarship.\n\nAlthough it wasn't the best situation, I decided not to dwell too much on it, and completed my finals and let that disappointment set aside for the time being. After finals, I reacted quickly and started looking for jobs and eventually landed on one. I believe the biggest takeaway from this is that even when things don't go as planned, there is always a reason behind it and we should just be patient enough for the reason to manifest itself. Often times, it's easy to give up and dwell on the negativity, but moving forward and constantly looking for opportunities is what sets you apart from the rest and you build your own destiny by not giving up.",
    q3: "First, I would prioritize the urgent matters that are time-sensitive, and in this case it's task 1 and 3. Focus on task 1 first, once that is done I will spend about half an hour to schedule a call or send out a text to the client explaining that whatever issue that is would need to be postponed till another day. At least that way, I'm not keeping the client waiting without any updates. Even if it is not good news, at least the client is informed. And finally I will work on task 3 and get it done by today itself.",
    q4: "Okay so, without having the lawyer's response to the situation it would be hard for me to assess the direness of the situation. But, since it is already past the registry time, there is potentially nothing that could be done by that night itself.\n\nWhat I would do is, get the file out and update the lawyer via text. Send it to them just so they have it for reference and then I would go back once my work is over. I need to also prioritize my work/life balance and since it is the weekend, nothing is open. That is not to say I wouldn't be able to work on it during the weekend, if I have the free time ans the lawyer needs help I can help work on the file. And first thing Monday morning, I can help with the court order to get it sealed.",
    q5: "I think more on research and helping with legal drafting of files. Mostly on research I believe as we help the lawyers with their cases to prepare them with a lot of the paperwork and drafting.",
    q6: "Dear Mr Tan,\n\nWe have reviewed your file and wish to update you that we have yet to receive a response from the other party. It has approximately been three weeks since our last correspondence.\n\nWe will continue to follow up with them and we will keep you informed of any updates. In the meantime, please do not hesitate to contact us if you have any questions pertaining your file.\n\nBest regards,\nBalvin Dhaliwal",
    q7: "sorry due to lack of time I will make this concise: I would advice against suing the partner because legal proceedings could be lengthy and expensive, also since the partner has agreed to pay within 90 days, I would tell the client to wait and see if they do hold up the end of their bargain, if not then we can proceed with legal actions.",
    q8: "Would it be possible for me to do this job as a part timer? How come this person application didn't appear on google sheets?"
  };

  var scoring = {
    dimensions: {
      'Critical Thinking': 6, 'Written Communication': 6, 'Judgement': 5,
      'Self-Awareness': 7, 'Attitude': 4, 'Problem-Solving': 5,
      'Attention to Detail': 5, 'Time Management': 4, 'Resilience': 7, 'Integrity': 4
    },
    overallScore: 53,
    decision: AI_DECISION.YES,
    rationale: 'Borderline 53/100: resilient and self-aware, but concerning judgement on client priorities and commitment.',
    strengths: 'Excellent resilience shown in bouncing back from scholarship rejection and taking positive action. Good self-awareness about being a jack-of-all-trades and honest communication style. Strong networking mindset and positive attitude toward learning from experiences.',
    concerns: 'Poor judgment in Friday scenario prioritising personal time over urgent client matter. Asking about part-time work suggests lack of commitment to full-time litigation role. Weak understanding of paralegal responsibilities and ran out of time on important questions showing poor time management.',
    recommendation: 'A personable candidate with good resilience but questionable commitment to full-time litigation work and concerning judgment about client priorities. Recommend manual review before any invitation.',
    perAnswerNotes: [
      { question: 'Q1 - About themselves',          note: 'Personable and energetic; networking-led self-description, light on legal motivation.' },
      { question: 'Q2 - When something went wrong', note: 'Strong resilience example; matured the disappointment into action.' },
      { question: 'Q3 - Three urgent tasks',        note: 'Reasonable triage but vague; does not name the priority criterion.' },
      { question: 'Q4 - Friday 4:45 PM',            note: 'Prioritised work/life balance over an urgent client matter. Concerning judgement.' },
      { question: 'Q5 - What a paralegal does',     note: 'Superficial - only research and drafting. Misses admin, file management, court runs.' },
      { question: 'Q6 - Email rewrite',             note: 'Clear and professional. Could be more specific about next steps and timeline.' },
      { question: 'Q7 - Client wants to sue',       note: 'Ran out of time; reasoning thin but the wait-and-see instinct is defensible.' },
      { question: 'Q8 - Anything else',             note: 'Asked about part-time work - signals limited commitment to a full-time litigation role.' }
    ]
  };

  var candidate = {
    'Candidate ID': candidateId,
    'Applied': appliedAt,
    'Full Name': 'Balvinder Kaur Dhaliwal',
    'Email': 'balvindhaliwal@icloud.com',
    'Phone': '+6011-33515578',
    'IC Name': 'Balvinder Kaur Dhaliwal',
    'IC Number': '000531-4-0230',
    'Address': 'E-15-7 Midfields 2 Taman Sungai Besi, 57100 Kuala Lumpur',
    'Education': 'LLB Graduate',
    'AI Decision': scoring.decision,
    'AI Rationale': scoring.rationale.substring(0, 200),
    'Score': scoring.overallScore,
    'Status': aiDecisionToStatus(scoring.decision),
    'CV Link': '',
    'Answers Doc Link': '',
    'Interview Booked': '',
    'Email Status': 'IMPORTED - recovered from failed intake 4 May 2026',
    'Send At': '',
    'Newsletter Opt-in': 'NO',
    'CRM Opt-in': 'NO',
    'Time Used': '',
    'Post-Interview': '',
    'Diviya Notified': '',
    'Letter Sent': false,
    'Sent On': ''
  };

  appendCandidate(candidate);
  writeScores(candidateId, scoring);
  logActivity(candidateId, 'Applied (recovered manually)', 'system', '53/100 BORDERLINE - original intake failed');

  try {
    var docLink = generateAnswersDoc(candidateId, candidate, answers, scoring, '');
    updateCandidateField(candidateId, 'Answers Doc Link', docLink);
  } catch (e) {
    Logger.log('Doc generation failed: ' + e.message);
  }

  cacheBustAll();
  Logger.log('Recovered Balvinder Kaur Dhaliwal as ' + candidateId);
  return candidateId;
}

// Replace the ID below with Balvinder's actual c_xxxxxxxxxx from the sheet.
function sendBalvinder() {
  return sendInterviewInviteNow('c_22c0176cde');
}
