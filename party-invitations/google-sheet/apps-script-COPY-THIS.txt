// Opening Statement 2027: saves every RSVP and every invitation open from the website into this Google Sheet.
// Paste this into Extensions → Apps Script in the "Opening Statement 2027 · RSVPs" sheet, then deploy it as a web app.
// Each value goes under its heading, so new headings are added in place without moving anything out of line.

var TABS = {
  rsvp: { name: 'RSVPs', fields: [
    ['Received', null], ['Name', 'name'], ['Firm / Organization', 'firm'], ['Invited by', 'invited_by'],
    ['Coming', 'attending'], ['Guests', 'guests'], ['Email', 'email'], ['Dietary needs or note', 'note'], ['Invite link', 'invite_link']
  ] },
  opens: { name: 'Opens', fields: [
    ['Opened', null], ['Guest', 'guest'], ['Device', 'device'], ['Link type', 'via']
  ] }
};

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p['bot-field']) return done();                 // spam trap filled in: ignore
  var kind = p['form-name'] === 'opens' ? 'opens' : 'rsvp';
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var t = TABS[kind], sheet = tab(kind), cols = columns(sheet, t.fields);
    var row = [];
    for (var i = 0; i < sheet.getLastColumn(); i++) row.push('');
    t.fields.forEach(function (f) { row[cols[f[0]]] = f[1] ? safe(p[f[1]]) : new Date(); });
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return done();
}

// Visiting the web app address in a browser shows this, so you can check it is live.
function doGet() {
  return ContentService.createTextOutput('Opening Statement 2027: the RSVP sheet is connected.');
}

function tab(kind) {
  var t = TABS[kind], ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(t.name);
  if (!sheet && kind === 'rsvp') {                  // reuse the starter tab (headers only) for replies
    ss.getSheets().some(function (s) {
      if (s.getName() !== TABS.opens.name && s.getLastRow() <= 1) { sheet = s.setName(t.name); return true; }
    });
  }
  if (!sheet) sheet = ss.insertSheet(t.name);
  if (sheet.getLastRow() === 0) sheet.appendRow(t.fields.map(function (f) { return f[0]; }));
  return sheet;
}

// Find the column of each heading. A missing heading gets a new column straight after the one before it,
// which moves any existing replies across with it, so older rows stay under the right headings.
function columns(sheet, fields) {
  var head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var cols = {};
  fields.forEach(function (f, i) {
    var at = head.indexOf(f[0]);
    if (at === -1) {
      if (i === 0) { sheet.insertColumnBefore(1); at = 0; }
      else { at = cols[fields[i - 1][0]] + 1; sheet.insertColumnAfter(at); }
      sheet.getRange(1, at + 1).setValue(f[0]);
      head.splice(at, 0, f[0]);
      Object.keys(cols).forEach(function (k) { if (cols[k] >= at) cols[k]++; });
    }
    cols[f[0]] = at;
  });
  sheet.getRange(1, 1, 1, head.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return cols;
}

// Guests type these answers, so never let a reply start a spreadsheet formula.
function safe(v) {
  if (v === undefined || v === null) return '';
  return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function done() {
  return ContentService.createTextOutput('ok');
}
