// Opening Statement 2027: saves every RSVP and every invitation open from the website into this Google Sheet.
// Paste this into Extensions → Apps Script in the "Opening Statement 2027 · RSVPs" sheet, then deploy it as a web app.

var TABS = {
  rsvp:  { name: 'RSVPs', head: ['Received', 'Name', 'Coming', 'Guests', 'Email', 'Dietary needs or note', 'Invite link'] },
  opens: { name: 'Opens', head: ['Opened', 'Guest', 'Device', 'Link type'] }
};

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p['bot-field']) return done();                 // spam trap filled in: ignore
  var kind = p['form-name'] === 'opens' ? 'opens' : 'rsvp';
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = tab(kind);
    var row = kind === 'opens'
      ? [new Date(), p.guest, p.device, p.via]
      : [new Date(), p.name, p.attending, p.guests, p.email, p.note, p.invite_link];
    sheet.appendRow(row.map(safe));
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
  if (sheet.getLastRow() === 0) sheet.appendRow(t.head);
  sheet.getRange(1, 1, 1, t.head.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  return sheet;
}

// Guests type the name and note, so never let a reply start a spreadsheet formula.
function safe(v) {
  if (v === undefined || v === null) return '';
  return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function done() {
  return ContentService.createTextOutput('ok');
}
