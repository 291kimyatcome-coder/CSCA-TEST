// Build a Khmer test score report as a PDF from a data file in report/data/.
// Usage: node report/build_test_report.js report/data/<file>.js
// Each data file holds the student's details, marks per question, and comments.
// The report is one page; set showDetail: true in a data file to add the per-question table on page 2.
// Visual style follows the Science Master Academic social cards (navy/teal, Kantumruy Pro).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dataFile = path.resolve(process.argv[2] || path.join(__dirname, 'data', 'test2_somavatey.js'));
const DATA = require(dataFile);
const CONTACT = { phone: '088 909 3291', telegram: '@POVKIMYAT', ...(DATA.contact || {}) };

// ---------------------------------------------------------------------------
const KH = '០១២៣៤៥៦៧៨៩';
const kh = (v) => String(v).replace(/[0-9]/g, (d) => KH[d]);
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
function todayKh() {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Phnom_Penh' }).format(new Date()).split('-').map(Number);
  return `ថ្ងៃទី${kh(d)} ខែ${KH_MONTHS[m - 1]} ឆ្នាំ${kh(y)}`;
}
DATA.issued = DATA.issued || todayKh();
const teacherTitle = DATA.teacherTitle || 'គ្រូបង្រៀន';
// [title, name] of each teacher who signs; the reviewer is optional
const staff = [[teacherTitle, DATA.teacher], ...(DATA.reviewer ? [[DATA.reviewerTitle || 'គ្រូត្រួតពិនិត្យ', DATA.reviewer]] : [])];

const GRADES = [
  [90, 'A', 'ល្អប្រសើរ', '#1f8a70'],
  [80, 'B', 'ល្អណាស់', '#2a9d8f'],
  [70, 'C', 'ល្អ', '#3a8fb7'],
  [60, 'D', 'ល្អបង្គួរ', '#d4932b'],
  [50, 'E', 'មធ្យម', '#d9772b'],
  [0, 'F', 'ខ្សោយ', '#c0453a'],
];
const grade = (s) => GRADES.find(([min]) => s >= min);

const partTotals = DATA.parts.map((p) => ({
  name: p.name,
  got: p.rows.reduce((a, r) => a + r[3], 0),
  max: p.rows.reduce((a, r) => a + r[4], 0),
}));
const total = partTotals.reduce((a, p) => a + p.got, 0);
const totalMax = partTotals.reduce((a, p) => a + p.max, 0);
const pct = (100 * total) / totalMax;
const [, gL, gLabel] = grade(pct);
const allRows = DATA.parts.flatMap((p) => p.rows);
const fullCount = allRows.filter((r) => r[3] === r[4]).length;

const partBars = partTotals
  .map((p) => {
    const pc = (100 * p.got) / p.max;
    return `<div class="pb-row"><div class="pb-top"><span>${p.name}</span><b>${kh(p.got)} / ${kh(p.max)}</b></div>
      <div class="bar"><span style="width:${pc}%;background:${grade(pc)[3]}"></span></div></div>`;
  })
  .join('');

const status = (g, m, a) =>
  a === '' ? '<span class="st na">មិនបានធ្វើ</span>' : g === m ? '<span class="st ok">ត្រូវ</span>' : g === 0 ? '<span class="st no">ខុស</span>' : '<span class="st part">ត្រូវខ្លះ</span>';

const detail = DATA.parts
  .map((p, i) => {
    const rows = p.rows
      .map(
        ([q, a, c, g, m, note]) => `<tr>
        <td>${q}</td><td class="c">${a === '' ? '-' : a}</td><td class="c">${c}</td>
        <td class="c">${status(g, m, a)}</td><td class="c b">${kh(g)} / ${kh(m)}</td><td class="note">${note}</td></tr>`
      )
      .join('');
    return `<tr class="ph"><td colspan="6">${p.name}<span>${kh(partTotals[i].got)} / ${kh(partTotals[i].max)} ពិន្ទុ</span></td></tr>${rows}`;
  })
  .join('');

const li = (arr) => arr.map((s) => `<li>${s}</li>`).join('');
const fontDir = path.join(__dirname, 'fonts');
const asset = (f) => 'file://' + path.join(__dirname, 'assets', f);
const ff = (fam, file, w) =>
  `@font-face{font-family:'${fam}';src:url('file://${fontDir}/${file}') format('woff2');font-weight:${w};}`;

// Faint formulas in the page background, as on the school's cards.
const DECOR = [
  ['a² + b² = c²', 'top:2mm;left:8mm'],
  ['Δ = b² − 4ac', 'top:3mm;right:10mm'],
  ['A = πr²', 'top:95mm;right:4mm'],
  ['|a| ≥ 0', 'top:96mm;left:3mm'],
  ['(a + b)² = a² + 2ab + b²', 'bottom:2mm;left:10mm'],
  ['E = mc²', 'bottom:2mm;right:12mm'],
]
  .map(([t, pos]) => `<div class="fx" style="${pos}">${t}</div>`)
  .join('');

const calendar = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;

const html = `<!doctype html><html lang="km"><head><meta charset="utf-8">
<title>របាយការណ៍ពិន្ទុ - ${DATA.student}</title>
<style>
${ff('KanKh', 'kantumruy-pro-khmer-400-normal.woff2', 400)}
${ff('KanKh', 'kantumruy-pro-khmer-600-normal.woff2', 600)}
${ff('KanKh', 'kantumruy-pro-khmer-700-normal.woff2', 700)}
${ff('KanLa', 'kantumruy-pro-latin-400-normal.woff2', 400)}
${ff('KanLa', 'kantumruy-pro-latin-600-normal.woff2', 600)}
${ff('KanLa', 'kantumruy-pro-latin-700-normal.woff2', 700)}
@font-face{font-family:'STIXTwoMath';src:url('file://${fontDir}/stix-two-math-latin-400-normal.woff2') format('woff2');}
@font-face{font-family:'SymMath';src:url('file://${fontDir}/dejavu-math.woff2') format('woff2');unicode-range:U+221A,U+221B,U+22C5;}
@page{size:A4;margin:9mm}
:root{--navy:#1c3a5a;--teal:#2a9d8f;--mint:#e9f6f2;--line:#cfe7df;--muted:#5d6b78;
  --grad:linear-gradient(120deg,#1c3a5a 0%,#22657a 55%,#2a9d8f 100%);
  --body:SymMath,KanLa,KanKh,sans-serif;--fs:9.8pt;--fs-s:8.8pt;--fs-t:8.2pt}
*{box-sizing:border-box}
body{margin:0;font-family:var(--body);font-size:var(--fs);color:#22313f;line-height:1.7;font-synthesis:none}
b,th,.b{font-weight:700}
sup{font-size:0.7em;line-height:0;vertical-align:0.45em}
math{font-family:'STIXTwoMath',math;font-size:1.08em;math-style:normal}
/* page frame and background formulas repeat on every page */
.frame{position:fixed;top:0;bottom:0;left:0;right:0;border:1.6px solid #4aa98f;border-radius:7mm;z-index:-1}
.layout{width:100%;border-collapse:collapse}.layout>thead td,.layout>tfoot td{height:7mm;padding:0;border:0}.layout>tbody>tr>td{padding:0 7mm;border:0}
.fx{position:fixed;z-index:-1;font-family:'STIXTwoMath',serif;font-style:italic;font-size:15pt;color:#2a9d8f;opacity:.11;white-space:nowrap}
/* header */
.head{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:2px}
.logo{width:96px;height:96px;border-radius:50%;flex:none}
.pill{display:inline-block;background:var(--grad);color:#fff;font-weight:700;border-radius:999px;padding:2px 18px;font-size:10pt;line-height:1.8}
h1{margin:2px 0 0;font-size:31pt;line-height:1.35;color:var(--navy);font-weight:700;letter-spacing:.2px}
.who{text-align:center;margin-top:8px;line-height:1.65}
.who .nm{font-size:13pt;color:var(--muted);font-weight:600}
.who .nm b{font-size:18pt;color:var(--navy)}
.who .ln2{font-size:12.5pt;font-weight:700;color:var(--navy)}
.who .ln3{font-size:10.5pt;font-weight:600;color:var(--navy)}
.who em{font-style:normal;color:var(--teal)}
.chip{display:inline-flex;align-items:center;gap:8px;background:var(--mint);border:1.4px solid var(--line);border-radius:12px;padding:2px 22px;color:var(--navy);font-weight:700;font-size:11pt;margin-top:6px}
.chip svg{color:var(--teal)}
.topics{text-align:center;color:var(--muted);font-size:var(--fs-s);margin:6px 30px 0}
/* score cards */
.cards{display:grid;grid-template-columns:1fr 1.25fr;gap:16px;margin-top:12px}
.gcard{background:var(--grad);color:#fff;border-radius:20px;padding:14px 16px;min-height:46mm;text-align:center;display:flex;flex-direction:column;justify-content:center}
.gcard .k{font-size:11pt;font-weight:600;opacity:.92}
.gcard .big{font-size:40pt;font-weight:700;line-height:1.25}
.gcard .big small{font-size:14pt;font-weight:600;opacity:.85}
.gcard .gr{display:inline-block;margin:4px auto 0;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:0 14px;font-weight:700}
.gcard .full{font-size:var(--fs-s);opacity:.9;margin-top:4px}
.wcard{border:1.6px solid #4aa98f;border-radius:20px;padding:12px 18px}
.wcard .t{font-weight:700;color:var(--navy);font-size:10.5pt;margin-bottom:2px}
.pb-row{margin:3px 0}
.pb-top{display:flex;justify-content:space-between;font-size:var(--fs-s);line-height:1.5}
.pb-top b{color:var(--navy)}
.bar{height:7px;background:#e7eef0;border-radius:4px;overflow:hidden}
.bar span{display:block;height:100%;border-radius:4px}
/* section headings as gradient pills */
h2{margin:10px 0 5px;font-size:10.5pt;break-after:avoid}
h2 span{display:inline-block;background:var(--grad);color:#fff;border-radius:999px;padding:1px 16px;line-height:1.8;font-weight:700}
/* detail table */
.tbl{border:1.4px solid var(--line);border-radius:12px;overflow:hidden}
.tbl table{width:100%;border-collapse:collapse}
.tbl th{background:var(--navy);color:#fff;font-size:var(--fs-s);padding:3px 6px;font-weight:600}
.tbl td{border-bottom:1px solid #e6eef0;padding:1px 6px;vertical-align:middle;font-size:var(--fs-s);line-height:1.55}
.tbl tr:last-child td{border-bottom:0}
.c{text-align:center}
td.b{white-space:nowrap;color:var(--navy)}
.note{color:var(--muted)}
tr.ph td{background:var(--mint);color:var(--navy);font-weight:700}
tr.ph td span{float:right;color:var(--teal)}
.st{display:inline-block;border-radius:999px;padding:0 8px;font-size:var(--fs-t);line-height:1.7;white-space:nowrap;color:#fff;font-weight:600}
.st.ok{background:var(--teal)}.st.no{background:#c0453a}.st.part{background:#d4932b}.st.na{background:#8a97a3}
/* strengths / weaknesses */
.three{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.box{border:1.4px solid var(--line);border-radius:14px;overflow:hidden}
.box h3{margin:0;font-size:10pt;line-height:1.9;color:#fff;padding:0 12px}
.box ul{margin:4px 0 6px;padding-left:24px;padding-right:10px}.box li{margin:1px 0}
.good h3{background:var(--teal)}
.weak{border-color:#f0dcb8}.weak h3{background:#d4932b}
.adv{border-color:#cfdbe8}.adv h3{background:var(--navy)}
.comment{margin-top:8px;background:var(--mint);border:1.6px solid #4aa98f;border-radius:14px;padding:8px 16px;color:#1f3347}
.comment b{color:var(--teal)}
/* signatures and contact */
.date{text-align:right;margin-top:6px;color:var(--navy);font-weight:600}
.sign{display:grid;gap:26px;text-align:center;margin:4px 10px 0}
.sign .ln{height:34px}
.sign .nm{border-top:1px dotted #8a97a3;padding-top:2px;font-size:var(--fs-s);color:var(--muted)}
.sign .tch{color:var(--navy);font-size:var(--fs)}
.contact{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:8px}
.qr{border:1.4px solid #4aa98f;border-radius:12px;padding:6px 6px 0;text-align:center;font-size:7pt;font-weight:600;color:var(--navy);line-height:1.6}
.qr img{width:64px;height:64px;display:block}
.contact .k{color:var(--teal);font-weight:700;font-size:10pt;line-height:1.4}
.contact .ph{color:var(--navy);font-weight:700;font-size:17pt;line-height:1.3;letter-spacing:.5px}
.contact .tg{color:var(--navy);font-weight:700;font-size:10.5pt;line-height:1.4}
.scale{margin-top:4px;font-size:var(--fs-t);color:var(--muted);text-align:center;line-height:1.6}
.avoid{break-inside:avoid}
.p2{break-before:page}
.p2head{display:flex;align-items:center;gap:14px}
.p2head img{width:60px;height:60px;border-radius:50%}
.p2who{color:var(--muted);margin-top:2px}.p2who b{color:var(--navy)}
.p2 .topics{text-align:left;margin:6px 0 0}
</style></head><body>
<div class="frame"></div>${DECOR}
<table class="layout"><thead><tr><td></td></tr></thead><tfoot><tr><td></td></tr></tfoot><tbody><tr><td>

<div class="head">
  <img class="logo" src="${asset('logo.jpg')}" alt="Science Master Academic">
  <div>
    <span class="pill">${DATA.test}</span>
    <h1>របាយការណ៍ពិន្ទុ និងការវាយតម្លៃ</h1>
  </div>
</div>

<div class="who">
  <div class="nm">ឈ្មោះសិស្ស៖ <b>${DATA.student}</b></div>
  <div class="ln2">ថ្នាក់ទី ${DATA.grade} | <em>គណិតវិទ្យា</em> | រយៈពេល ${DATA.duration}</div>
  <div class="ln3">${staff.map(([t, n]) => `${t} <em>${n}</em>`).join('&nbsp;&nbsp;|&nbsp;&nbsp;')}</div>
  <div class="chip">${calendar}${DATA.issued}</div>
</div>

<div class="cards">
  <div class="gcard">
    <div class="k">ពិន្ទុសរុប</div>
    <div class="big">${kh(total)}<small> / ${kh(totalMax)}</small></div>
    <div class="gr">និទ្ទេស ${gL} | ${gLabel}</div>
    <div class="full">សំណួរបានពិន្ទុពេញ ${kh(fullCount)} / ${kh(allRows.length)}</div>
  </div>
  <div class="wcard"><div class="t">លទ្ធផលតាមផ្នែក</div>${partBars}</div>
</div>

<h2><span>ការវាយតម្លៃ</span></h2>
<div class="avoid">
<div class="three">
  <div class="box good"><h3>ចំណុចខ្លាំង</h3><ul>${li(DATA.strengths)}</ul></div>
  <div class="box weak"><h3>ចំណុចត្រូវកែលម្អ</h3><ul>${li(DATA.weaknesses)}</ul></div>
  <div class="box adv"><h3>អនុសាសន៍</h3><ul>${li(DATA.advice)}</ul></div>
</div>
<div class="comment"><b>មតិរបស់${teacherTitle}៖</b> ${DATA.comment}</div>
</div>

<div class="avoid">
  <div class="date">ធ្វើនៅ ${DATA.issued}</div>
  <div class="sign" style="grid-template-columns:repeat(${staff.length + 1},1fr)">
    ${staff.map(([t, n]) => `<div><b>${t}</b><div class="ln"></div><div class="nm"><b class="tch">${n}</b></div></div>`).join('')}
    <div><b>មាតាបិតា ឬអាណាព្យាបាល</b><div class="ln"></div><div class="nm">ហត្ថលេខា និងឈ្មោះ</div></div>
  </div>
  <div class="contact">
    <div class="qr"><img src="${asset('qr_telegram.svg')}" alt="QR">${CONTACT.telegram}</div>
    <div><div class="k">ព័ត៌មានបន្ថែម</div><div class="ph">${CONTACT.phone}</div><div class="tg">Telegram ${CONTACT.telegram}</div></div>
  </div>
  <div class="scale">មាត្រដ្ឋាននិទ្ទេស៖ ${GRADES.map(([m, L, l], i) => `${L} (${l}) ${i === 0 ? kh('90-100') : i === GRADES.length - 1 ? '&lt; ' + kh(50) : kh(m + '-' + (GRADES[i - 1][0] - 1))}`).join('&nbsp;&nbsp;|&nbsp;&nbsp;')}</div>
</div>

${DATA.showDetail ? `<div class="p2">
  <div class="p2head">
    <img src="${asset('logo.jpg')}" alt="">
    <div><span class="pill">${DATA.test}</span><div class="p2who">ឈ្មោះសិស្ស៖ <b>${DATA.student}</b> | ពិន្ទុសរុប <b>${kh(total)} / ${kh(totalMax)}</b> | និទ្ទេស <b>${gL}</b></div></div>
  </div>
  <div class="topics">មេរៀនប្រឡង៖ ${DATA.topics}</div>
  <h2><span>ការកែតម្រូវលម្អិតតាមសំណួរ</span></h2>
  <div class="tbl"><table>
    <thead><tr><th style="width:27%">សំណួរ</th><th style="width:15%">ចម្លើយសិស្ស</th><th style="width:16%">ចម្លើយត្រឹមត្រូវ</th><th style="width:9%">លទ្ធផល</th><th style="width:8%">ពិន្ទុ</th><th>កំណត់សម្គាល់</th></tr></thead>
    <tbody>${detail}</tbody>
  </table></div>
</div>` : ''}

</td></tr></tbody></table>
</body></html>`;

(async () => {
  const out = path.join(__dirname, DATA.out);
  const tmp = path.join(__dirname, 'test_report.html');
  fs.writeFileSync(tmp, html);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  if (!process.env.KEEP_HTML) fs.unlinkSync(tmp);
  console.log('Wrote', out, `total ${total}/${totalMax}`);
})();
