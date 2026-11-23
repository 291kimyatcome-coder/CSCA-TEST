/**
 * CSCA Math — receive students' results into this Google Sheet.
 *
 * Setup (once): Extensions → Apps Script → paste this file → Save →
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone →
 * Deploy → copy the Web app URL (ends with /exec) into js/config.js.
 *
 * Each submitted paper becomes one row on the "Results" sheet:
 * time, name, class, paper, score, correct/wrong/blank, time used, wrong
 * question numbers, score by module, then one column per question
 * (✓ correct, ✗ + the letter chosen, – blank).
 */
var SHEET_NAME = 'Results';
var QUESTIONS = 48;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    var answers = clean_(d.answers, QUESTIONS).toUpperCase();
    var key = clean_(d.key, QUESTIONS).toUpperCase();
    var marks = [];
    for (var i = 0; i < QUESTIONS; i++) {
      var a = answers.charAt(i), k = key.charAt(i);
      marks.push(!a || a === '-' ? '–' : a === k ? '✓' : '✗ ' + a);
    }
    sheet.appendRow([
      new Date(),
      text_(d.name, 60),
      text_(d.cls, 30),
      num_(d.paper),
      num_(d.score),
      num_(d.correct),
      num_(d.wrong),
      num_(d.blank),
      text_(d.timeUsed, 8),
      d.timeout ? 'yes' : '',
      text_(d.wrongList, 200),
      text_(d.modules, 60),
    ].concat(marks));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('CSCA Math results receiver is running.');
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    var head = ['Submitted', 'Name', 'Class', 'Paper', 'Score /100', 'Correct', 'Wrong', 'Blank', 'Time used', 'Time ran out', 'Missed questions (wrong or blank)', 'By module (M1 M2 M3 M4)'];
    for (var i = 1; i <= QUESTIONS; i++) head.push('Q' + i);
    sheet.appendRow(head);
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2);
    sheet.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#e6ecfb');
  }
  return sheet;
}

// Text from students is data, never a formula.
function text_(v, max) {
  var s = String(v == null ? '' : v).slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function num_(v) {
  var n = Number(v);
  return isFinite(n) ? n : '';
}
function clean_(v, len) {
  return String(v == null ? '' : v).replace(/[^A-Da-d-]/g, '').slice(0, len);
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
