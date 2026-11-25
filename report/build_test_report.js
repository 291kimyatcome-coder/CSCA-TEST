// Build a Khmer test score report as a PDF from a data file in report/data/.
// Usage: node report/build_test_report.js report/data/<file>.js
// Each data file holds the student's details, marks per question, and comments.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dataFile = path.resolve(process.argv[2] || path.join(__dirname, 'data', 'test2_somavatey.js'));
const DATA = require(dataFile);

// ---------------------------------------------------------------------------
const KH = '០១២៣៤៥៦៧៨៩';
const kh = (v) => String(v).replace(/[0-9]/g, (d) => KH[d]);
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
function todayKh() {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Phnom_Penh' }).format(new Date()).split('-').map(Number);
  return `ថ្ងៃទី${kh(d)} ខែ${KH_MONTHS[m - 1]} ឆ្នាំ${kh(y)}`;
}
DATA.issued = DATA.issued || todayKh();

const GRADES = [
  [90, 'A', 'ល្អប្រសើរ', '#1b7a4b'],
  [80, 'B', 'ល្អណាស់', '#2f9e73'],
  [70, 'C', 'ល្អ', '#3d8fa8'],
  [60, 'D', 'ល្អបង្គួរ', '#c98a1b'],
  [50, 'E', 'មធ្យម', '#c2611f'],
  [0, 'F', 'ខ្សោយ', '#b23a3a'],
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
const [, gL, gLabel, gColor] = grade(pct);
const allRows = DATA.parts.flatMap((p) => p.rows);
const fullCount = allRows.filter((r) => r[3] === r[4]).length;

const partRows = partTotals
  .map((p) => {
    const pc = (100 * p.got) / p.max;
    const color = grade(pc)[3];
    return `<tr><td>${p.name}</td><td class="c b">${kh(p.got)} / ${kh(p.max)}</td><td class="c">${kh(Math.round(pc))}%</td>
      <td><div class="bar"><span style="width:${pc}%;background:${color}"></span></div></td></tr>`;
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
const ff = (fam, file, w) =>
  `@font-face{font-family:'${fam}';src:url('file://${fontDir}/${file}') format('woff2');font-weight:${w};}`;

const html = `<!doctype html><html lang="km"><head><meta charset="utf-8">
<title>របាយការណ៍ពិន្ទុ - ${DATA.student}</title>
<style>
${ff('BtbKh', 'battambang-khmer-400-normal.woff2', 400)}
${ff('BtbKh', 'battambang-khmer-700-normal.woff2', 700)}
${ff('BtbLa', 'battambang-latin-400-normal.woff2', 400)}
${ff('BtbLa', 'battambang-latin-700-normal.woff2', 700)}
${ff('MoulKh', 'moul-khmer-400-normal.woff2', 400)}
@font-face{font-family:'SymMath';src:url('file://${fontDir}/dejavu-math.woff2') format('woff2');unicode-range:U+221A,U+221B,U+22C5;}
@font-face{font-family:'Sym';src:url('file://${fontDir}/noto-sans-khmer-latin-400-normal.woff2') format('woff2');font-weight:400;unicode-range:U+B0,U+D7,U+F7;}
@font-face{font-family:'Sym';src:url('file://${fontDir}/noto-sans-khmer-latin-700-normal.woff2') format('woff2');font-weight:700;unicode-range:U+B0,U+D7,U+F7;}
${ff('MoulLa', 'moul-latin-400-normal.woff2', 400)}
@page{size:A4;margin:12mm 13mm 14mm}
:root{--body:SymMath,Sym,BtbLa,BtbKh,sans-serif;--head:MoulLa,MoulKh,serif;
  --fs-title:17pt;--fs-h2:10.5pt;--fs-h3:10.5pt;--fs-body:10pt;--fs-small:9pt;--fs-tiny:8.3pt;--lh:1.7}
*{box-sizing:border-box}
body{margin:0;font-family:var(--body);font-size:var(--fs-body);color:#1d2733;line-height:var(--lh);font-synthesis:none}
h1,h2{font-family:var(--head);font-weight:400}
b,th,h3,.b{font-weight:700}
sup{font-size:0.7em;line-height:0;vertical-align:0.45em}
.head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #1d4d3a;padding-bottom:10px}
.logo{width:76px;height:76px;border-radius:50%;flex:none;display:block}
.head .sch{font-size:15pt;font-weight:700;color:#1d4d3a;line-height:1.3}
.head .sub{font-size:var(--fs-small);color:#5a6878}
.head .meta{margin-left:auto;text-align:right;font-size:var(--fs-small);color:#5a6878;line-height:1.6}
h1{text-align:center;color:#1d4d3a;font-size:var(--fs-title);margin:10px 0 0;line-height:1.9}
.subt{text-align:center;color:#5a6878;margin:0 0 10px}
h2{font-size:var(--fs-h2);color:#1d4d3a;margin:12px 0 5px;padding-left:9px;border-left:4px solid #2f9e73;line-height:1.9}
.info{display:grid;grid-template-columns:1fr 1fr;gap:2px 22px;background:#f2f8f5;border:1px solid #dfe6ef;border-radius:8px;padding:8px 14px}
.info div span{color:#5a6878;display:inline-block;min-width:96px}
.info b{color:#1d4d3a}
.info .wide{grid-column:1 / -1}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.card{border:1px solid #dfe6ef;border-radius:8px;padding:8px 10px;text-align:center}
.card .k{font-size:var(--fs-small);color:#5a6878}
.card .v{font-size:17pt;font-weight:700;color:#1d4d3a;line-height:1.5}
.card .v small{font-size:var(--fs-small);color:#5a6878;font-weight:400}
table{width:100%;border-collapse:collapse}
th{background:#1d4d3a;color:#fff;font-size:var(--fs-small);padding:3px 6px}
td{border-bottom:1px solid #e3e8ef;padding:1px 6px;vertical-align:middle;line-height:1.65}
.c{text-align:center}
.note{font-size:var(--fs-small);color:#4a5866}
.bar{height:8px;background:#eef1f5;border-radius:4px;overflow:hidden;width:100%}
.bar span{display:block;height:100%;border-radius:4px}
.det td{font-size:var(--fs-small);line-height:1.55}
.det td.b{white-space:nowrap}
.det tr.ph td{background:#e6f2ec;color:#1d4d3a;font-weight:700;font-size:var(--fs-small)}
.det tr.ph td span{float:right}
.st{display:inline-block;border-radius:10px;padding:0 7px;font-size:var(--fs-tiny);line-height:1.7;white-space:nowrap;color:#fff}
.st.na{background:#8592a0}.rad{border-top:1px solid currentColor;padding:0 1px}.st.ok{background:#1b7a4b}.st.no{background:#b23a3a}.st.part{background:#c98a1b}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.box{border:1px solid #dfe6ef;border-radius:8px;padding:8px 12px}
.box h3{margin:0 0 4px;font-size:var(--fs-h3);line-height:1.7}
.box ul{margin:0;padding-left:18px}.box li{margin:2px 0}
.good{border-top:4px solid #1b7a4b}.good h3{color:#1b7a4b}
.weak{border-top:4px solid #c98a1b}.weak h3{color:#a5700f}
.comment{background:#fbf7ec;border:1px solid #ecdcb0;border-radius:8px;padding:10px 14px}
ol.adv{margin:0;padding-left:24px;list-style:khmer}ol.adv li{margin:2px 0}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:60px;text-align:center;margin:10px 40px 0}
.sign .ln{height:58px}
.sign .nm{border-top:1px dotted #8592a0;padding-top:2px;font-size:var(--fs-small);color:#5a6878}
.sign .who{color:#1d4d3a;font-size:var(--fs-body)}
.date{text-align:right;margin-top:14px}
.scale{margin-top:12px;font-size:var(--fs-tiny);color:#5a6878;border-top:1px solid #dfe6ef;padding-top:6px;text-align:center}
.pb{break-before:page}
.avoid{break-inside:avoid}
</style></head><body>

<div class="head">
  <img class="logo" src="file://${path.join(__dirname, 'assets', 'logo.jpg')}" alt="Science Master Academic">
  <div><div class="sch">${DATA.school}</div><div class="sub">សាលា ${DATA.school}</div></div>
  <div class="meta">មុខវិជ្ជាគណិតវិទ្យា<br>${DATA.issued}</div>
</div>

<h1>របាយការណ៍ពិន្ទុ និងការវាយតម្លៃ</h1>
<p class="subt">${DATA.test}</p>

<div class="info">
  <div><span>ឈ្មោះសិស្ស</span>៖ <b>${DATA.student}</b></div>
  <div><span>ថ្នាក់</span>៖ <b>${DATA.grade}</b></div>
  <div><span>មុខវិជ្ជា</span>៖ <b>គណិតវិទ្យា</b></div>
  <div><span>រយៈពេល</span>៖ <b>${DATA.duration}</b></div>
  <div><span>${DATA.teacherTitle || 'គ្រូបង្រៀន'}</span>៖ <b>${DATA.teacher}</b></div>
  <div><span>ថ្ងៃចេញ</span>៖ <b>${DATA.issued}</b></div>
  <div class="wide"><span>មេរៀនប្រឡង</span>៖ <b>${DATA.topics}</b></div>
</div>

<div class="cards">
  <div class="card"><div class="k">ពិន្ទុសរុប</div><div class="v">${kh(total)}<small> / ${kh(totalMax)}</small></div></div>
  <div class="card"><div class="k">និទ្ទេស</div><div class="v" style="color:${gColor}">${gL} <small>(${gLabel})</small></div></div>
  <div class="card"><div class="k">សំណួរបានពិន្ទុពេញ</div><div class="v">${kh(fullCount)}<small> / ${kh(allRows.length)}</small></div></div>
</div>

<h2>១. លទ្ធផលតាមផ្នែក</h2>
<table>
  <thead><tr><th style="width:44%">ផ្នែក</th><th style="width:14%">ពិន្ទុ</th><th style="width:10%">ភាគរយ</th><th>កម្រិត</th></tr></thead>
  <tbody>${partRows}</tbody>
</table>

<h2>២. ការកែតម្រូវលម្អិតតាមសំណួរ</h2>
<table class="det">
  <thead><tr><th style="width:27%">សំណួរ</th><th style="width:15%">ចម្លើយសិស្ស</th><th style="width:16%">ចម្លើយត្រឹមត្រូវ</th><th style="width:9%">លទ្ធផល</th><th style="width:8%">ពិន្ទុ</th><th>កំណត់សម្គាល់</th></tr></thead>
  <tbody>${detail}</tbody>
</table>

<h2>៣. ចំណុចខ្លាំង និងចំណុចត្រូវកែលម្អ</h2>
<div class="two">
  <div class="box good"><h3>ចំណុចខ្លាំង</h3><ul>${li(DATA.strengths)}</ul></div>
  <div class="box weak"><h3>ចំណុចត្រូវកែលម្អ</h3><ul>${li(DATA.weaknesses)}</ul></div>
</div>

<h2>៤. អនុសាសន៍</h2>
<ol class="adv">${li(DATA.advice)}</ol>

<h2>៥. មតិរបស់គ្រូ</h2>
<div class="comment">${DATA.comment}</div>

<div class="date">ធ្វើនៅ ${DATA.issued}</div>
<div class="sign avoid">
  <div><b>${DATA.teacherTitle || 'គ្រូបង្រៀន'}</b><div class="ln"></div><div class="nm"><b class="who">${DATA.teacher}</b></div></div>
  <div><b>មាតាបិតា ឬអាណាព្យាបាល</b><div class="ln"></div><div class="nm">ហត្ថលេខា និងឈ្មោះ</div></div>
</div>

<div class="scale">មាត្រដ្ឋាននិទ្ទេស៖ ${GRADES.map(([m, L, l], i) => `${L} (${l}) ${i === 0 ? kh('90-100') : i === GRADES.length - 1 ? '&lt; ' + kh(50) : kh(m + '-' + (GRADES[i - 1][0] - 1))}`).join('&nbsp;&nbsp;|&nbsp;&nbsp;')}
<br>ពិន្ទុផ្នែកខ្លះ ផ្តល់តាមជំហានដែលត្រឹមត្រូវ</div>

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
