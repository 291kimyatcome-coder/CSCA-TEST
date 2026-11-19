// Build the Khmer student assessment report as a PDF.
// Usage: node report/build_report.js
// Edit the DATA block below to change scores, comments, or the student's details.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const DATA = {
  school: 'Science Master Academic',
  student: 'ឡុង',
  className: 'ថ្នាក់សិស្សពូកែ ត្រៀមថ្នាក់ទី១២',
  format: 'ថ្នាក់ឯកជន ១ ទល់ ១',
  subject: 'គណិតវិទ្យា',
  year: '២០២៦-២០២៧',
  period: 'ខែសីហា ដល់ខែវិច្ឆិកា ឆ្នាំ២០២៦',
  issued: 'ថ្ងៃទី១៩ ខែវិច្ឆិកា ឆ្នាំ២០២៦',
  attendance: 96,
  hours: 48, // total 1:1 study hours in the period
  topics: [
    ['លីមីត និងភាពជាប់នៃអនុគមន៍', 85, 'យល់គោលគំនិតច្បាស់ អនុវត្តត្រឹមត្រូវ'],
    ['ដេរីវេ និងការសិក្សាអនុគមន៍', 86, 'ចំណុចខ្លាំងបំផុត សិក្សាអថេរភាពបានល្អ'],
    ['អិចស្ប៉ូណង់ស្យែល និងលោការីត', 84, 'គណនាបានលឿន និងត្រឹមត្រូវ'],
    ['ចំនួនកុំផ្លិច', 82, 'ប្រើទម្រង់ត្រីកោណមាត្របានស្ទាត់'],
    ['ស្វ៊ីតនៃចំនួនពិត', 80, 'គួរពង្រឹងការស្រាយបញ្ជាក់តាមកំណើន'],
    ['អាំងតេក្រាល', 76, 'ពេលខ្លះច្រឡំសញ្ញា ពេលធ្វើដោយផ្នែក'],
    ['សមីការឌីផេរ៉ង់ស្យែល', 75, 'ល្អ ត្រូវប្រុងប្រយ័ត្នលក្ខខណ្ឌដើម'],
    ['ធរណីមាត្រក្នុងលំហ (វ៉ិចទ័រ)', 72, 'ត្រូវពង្រឹងការស្រមៃរូបលំហ'],
    ['ប្រូបាប៊ីលីតេ និងវិភាគបន្សំ', 68, 'ចំណុចត្រូវកែលម្អចម្បង'],
  ],
  monthly: [['សីហា', 72], ['កញ្ញា', 75], ['តុលា', 79], ['វិច្ឆិកា', 81]],
  behaviour: [
    ['វត្តមាន និងភាពទៀងទាត់', 5, 'ល្អប្រសើរ'],
    ['វិន័យ និងសីលធម៌', 5, 'ល្អប្រសើរ'],
    ['ការចូលរួម និងការសួរសំណួរពេលរៀន', 4, 'ល្អណាស់'],
    ['ការធ្វើកិច្ចការផ្ទះ', 4, 'ល្អណាស់'],
    ['ការគ្រប់គ្រងពេលវេលាពេលប្រឡង', 3, 'ល្អ'],
  ],
  strengths: [
    'មានមូលដ្ឋានគ្រឹះគណិតវិទ្យារឹងមាំ ជាពិសេសផ្នែកវិភាគ (លីមីត ដេរីវេ និងលោការីត)។',
    'មានការគិតបែបតក្កវិជ្ជា និងសរសេរដំណោះស្រាយបានជាលំដាប់លំដោយ ច្បាស់លាស់។',
    'ឧស្សាហ៍ព្យាយាម ចូលរៀនទៀងទាត់ និងហ៊ានសួរនៅពេលមិនទាន់យល់។',
    'លទ្ធផលប្រឡងប្រចាំខែកើនឡើងជាប់លាប់ពីខែមួយទៅខែមួយ។',
  ],
  weaknesses: [
    'ប្រូបាប៊ីលីតេ និងវិភាគបន្សំ៖ ពេលខ្លះច្រឡំរវាងចំណាត់ធ្នាក់ និងបន្សំ។',
    'ធរណីមាត្រក្នុងលំហ៖ ការប្រើវ៉ិចទ័រដើម្បីគណនាចម្ងាយ និងមុំ នៅមិនទាន់ស្ទាត់ជំនាញ។',
    'កំហុសដោយការធ្វេសប្រហែសតិចតួច (ដូចជាសញ្ញា + និង -) នៅពេលប្រញាប់។',
  ],
  advice: [
    'ធ្វើលំហាត់ប្រូបាប៊ីលីតេ ៥ ទៅ ១០ លំហាត់ក្នុងមួយសប្តាហ៍ ដោយកំណត់ប្រភេទបញ្ហាឲ្យច្បាស់មុនពេលដោះស្រាយ។',
    'គូររូបលំហឲ្យបានច្បាស់ និងហ្វឹកហាត់ប្រើផលគុណស្កាលែ និងផលគុណវ៉ិចទ័រជាប្រចាំ។',
    'ហ្វឹកហាត់ធ្វើវិញ្ញាសាប្រឡងបាក់ឌុបឆ្នាំមុនៗ ដោយកំណត់ពេលវេលាដូចការប្រឡងពិត។',
    'ទុកពេល ៥ ទៅ ១០ នាទី ដើម្បីពិនិត្យចម្លើយឡើងវិញ មុនពេលប្រគល់សន្លឹកកិច្ចការ។',
  ],
  comment:
    'ឡុង គឺជាសិស្សដែលមានសមត្ថភាពល្អ និងមានឆន្ទៈខ្ពស់ក្នុងការសិក្សា។ ក្នុងរយៈពេលកន្លងមក ឡុង បានបង្ហាញការរីកចម្រើនគួរឲ្យកត់សម្គាល់ ជាពិសេសផ្នែកដេរីវេ និងការសិក្សាអនុគមន៍។ ' +
    'ចំណុចខ្វះខាតមួយចំនួនតូច ដូចជាប្រូបាប៊ីលីតេ និងធរណីមាត្រក្នុងលំហ អាចកែលម្អបានយ៉ាងងាយ ប្រសិនបើបន្តហ្វឹកហាត់ឲ្យបានទៀងទាត់។ ' +
    'ក្នុងនាមជាគ្រូបង្រៀនផ្ទាល់ គ្រូជឿជាក់ថា ឡុង នឹងទទួលបានលទ្ធផលល្អប្រសើរក្នុងការប្រឡងថ្នាក់ទី១២ ខាងមុខ។ សូមបន្តខិតខំប្រឹងប្រែង!',
};

// ---------------------------------------------------------------------------
const KH = '០១២៣៤៥៦៧៨៩';
const kh = (v) => String(v).replace(/[0-9]/g, (d) => KH[d]);

const GRADES = [
  [90, 'A', 'ល្អប្រសើរ', '#1b7a4b'],
  [80, 'B', 'ល្អណាស់', '#2a6fb0'],
  [70, 'C', 'ល្អ', '#3d8fa8'],
  [60, 'D', 'ល្អបង្គួរ', '#c98a1b'],
  [50, 'E', 'មធ្យម', '#c2611f'],
  [0, 'F', 'ខ្សោយ', '#b23a3a'],
];
const grade = (s) => GRADES.find(([min]) => s >= min);

const scores = DATA.topics.map((t) => t[1]);
const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
const avgStr = kh(avg.toFixed(1));
const [, avgLetter, avgLabel, avgColor] = grade(avg);

const topicRows = DATA.topics
  .map(([name, s, note], i) => {
    const [, L, label, color] = grade(s);
    return `<tr>
      <td class="c">${kh(i + 1)}</td>
      <td>${name}</td>
      <td class="c b">${kh(s)}</td>
      <td><div class="bar"><span style="width:${s}%;background:${color}"></span></div></td>
      <td class="c"><span class="pill" style="color:${color};border-color:${color}">${L} (${label})</span></td>
      <td class="note">${note}</td>
    </tr>`;
  })
  .join('');

// Monthly trend chart (SVG)
function trendSvg() {
  const W = 330, H = 150, padL = 30, padR = 14, padT = 22, padB = 30;
  const lo = 60, hi = 90;
  const x = (i) => padL + (i * (W - padL - padR)) / (DATA.monthly.length - 1);
  const y = (v) => padT + ((hi - v) * (H - padT - padB)) / (hi - lo);
  let g = '';
  for (let v = lo; v <= hi; v += 10) {
    g += `<line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" stroke="#e3e8ef"/>`;
    g += `<text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end" class="ax">${kh(v)}</text>`;
  }
  const pts = DATA.monthly.map(([, v], i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${x(0)},${y(lo)} ${pts} ${x(DATA.monthly.length - 1)},${y(lo)}`;
  let dots = '';
  DATA.monthly.forEach(([m, v], i) => {
    dots += `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="#fff" stroke="#173a64" stroke-width="2.5"/>`;
    dots += `<text x="${x(i)}" y="${y(v) - 10}" text-anchor="middle" class="val">${kh(v)}</text>`;
    dots += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="ax">${m}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${g}
    <polygon points="${area}" fill="#2a6fb0" opacity="0.10"/>
    <polyline points="${pts}" fill="none" stroke="#173a64" stroke-width="2.5"/>${dots}</svg>`;
}

const first = DATA.monthly[0][1], last = DATA.monthly[DATA.monthly.length - 1][1];

const behaviourRows = DATA.behaviour
  .map(([name, n, label]) => {
    const dots = Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    return `<tr><td>${name}</td><td class="dots">${dots}</td><td class="c">${label}</td></tr>`;
  })
  .join('');

const li = (arr) => arr.map((s) => `<li>${s}</li>`).join('');

const fontDir = path.join(__dirname, 'fonts');
const ff = (fam, file, w) =>
  `@font-face{font-family:'${fam}';src:url('file://${fontDir}/${file}') format('woff2');font-weight:${w};}`;

const html = `<!doctype html><html lang="km"><head><meta charset="utf-8">
<title>របាយការណ៍វាយតម្លៃ - ${DATA.student}</title>
<style>
${ff('BtbKh', 'battambang-khmer-400-normal.woff2', 400)}
${ff('BtbKh', 'battambang-khmer-700-normal.woff2', 700)}
${ff('BtbLa', 'battambang-latin-400-normal.woff2', 400)}
${ff('BtbLa', 'battambang-latin-700-normal.woff2', 700)}
${ff('MoulKh', 'moul-khmer-400-normal.woff2', 400)}
${ff('MoulLa', 'moul-latin-400-normal.woff2', 400)}
@page{size:A4;margin:12mm 13mm 14mm}
*{box-sizing:border-box}
:root{--body:BtbLa,BtbKh,sans-serif;--head:MoulLa,MoulKh,serif;
  --fs-title:17pt;--fs-h2:10.5pt;--fs-h3:10.5pt;--fs-body:10pt;--fs-small:9pt;--fs-tiny:8.3pt;--lh:1.7}
body{margin:0;font-family:var(--body);font-size:var(--fs-body);color:#1d2733;line-height:var(--lh);font-synthesis:none;font-kerning:normal}
h1,h2{font-family:var(--head);font-weight:400}
b,th,h3,.b{font-weight:700}
.head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #173a64;padding-bottom:10px}
.logo{width:62px;height:62px;border-radius:50%;background:#173a64;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14pt;letter-spacing:0.5px;flex:none;border:3px solid #d4a531}
.head .sch{font-size:15pt;font-weight:700;color:#173a64;line-height:1.3}
.head .sub{font-size:var(--fs-small);color:#5a6878}
.head .meta{margin-left:auto;text-align:right;font-size:var(--fs-small);color:#5a6878;line-height:1.6}
h1{text-align:center;color:#173a64;font-size:var(--fs-title);margin:10px 0 0;line-height:1.9}
.subt{text-align:center;color:#5a6878;margin:0 0 10px}
h2{font-size:var(--fs-h2);color:#173a64;margin:12px 0 5px;padding-left:9px;border-left:4px solid #d4a531;line-height:1.9}
.info{display:grid;grid-template-columns:1fr 1fr;gap:2px 22px;background:#f4f7fb;border:1px solid #dfe6ef;border-radius:8px;padding:8px 14px}
.info div span{color:#5a6878;display:inline-block;min-width:122px}
.info b{color:#173a64}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
.card{border:1px solid #dfe6ef;border-radius:8px;padding:8px 10px;text-align:center}
.card .k{font-size:var(--fs-small);color:#5a6878}
.card .v{font-size:17pt;font-weight:700;color:#173a64;line-height:1.5}
.card .v small{font-size:var(--fs-small);color:#5a6878;font-weight:400}
table{width:100%;border-collapse:collapse}
th{background:#173a64;color:#fff;font-size:var(--fs-small);padding:3px 6px}
td{border-bottom:1px solid #e3e8ef;padding:1px 6px;vertical-align:middle;line-height:1.65}
tr:nth-child(even) td{background:#fafbfd}
.c{text-align:center}.b{font-weight:700}
.note{font-size:var(--fs-small);color:#4a5866;white-space:nowrap}
.bar{height:8px;background:#eef1f5;border-radius:4px;overflow:hidden;width:100%}
.bar span{display:block;height:100%;border-radius:4px}
.pill{display:inline-block;border:1px solid;border-radius:10px;padding:0 7px;font-size:var(--fs-tiny);white-space:nowrap;line-height:1.7}
.tfoot td{background:#eef3fa!important;font-weight:700;color:#173a64}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.box{border:1px solid #dfe6ef;border-radius:8px;padding:8px 12px}
.box h3{margin:0 0 4px;font-size:var(--fs-h3);line-height:1.7}
.box ul{margin:0;padding-left:18px}.box li{margin:2px 0}
.good{border-top:4px solid #1b7a4b}.good h3{color:#1b7a4b}
.weak{border-top:4px solid #c98a1b}.weak h3{color:#a5700f}
.ax{font-size:9px;fill:#6b7886;font-family:var(--body)}
.val{font-size:10px;font-weight:700;fill:#173a64;font-family:var(--body)}
.dots i{display:inline-block;width:10px;height:10px;border-radius:50%;background:#e3e8ef;margin-right:4px}
.dots i.on{background:#2a6fb0}
.trendnote{font-size:var(--fs-small);color:#1b7a4b;margin-top:2px;text-align:center}
.comment{background:#fbf7ec;border:1px solid #ecdcb0;border-radius:8px;padding:10px 14px;}
ol.adv{margin:0;padding-left:24px;list-style:khmer}ol.adv li{margin:2px 0}
.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center;margin-top:10px}
.sign .ln{height:58px}
.sign .nm{border-top:1px dotted #8592a0;padding-top:2px;font-size:var(--fs-small);color:#5a6878}
.date{text-align:right;margin-top:14px}
.scale{margin-top:14px;font-size:var(--fs-tiny);color:#5a6878;border-top:1px solid #dfe6ef;padding-top:6px;text-align:center}
.pb{break-before:page}
.avoid{break-inside:avoid}
</style></head><body>

<div class="head">
  <div class="logo">SMA</div>
  <div><div class="sch">${DATA.school}</div><div class="sub">សាលា ${DATA.school}</div></div>
  <div class="meta">ឆ្នាំសិក្សា ${DATA.year}<br>${DATA.period}</div>
</div>

<h1>របាយការណ៍វាយតម្លៃលទ្ធផលសិក្សា</h1>
<p class="subt">${DATA.className} | ${DATA.format} | មុខវិជ្ជា${DATA.subject}</p>

<div class="info">
  <div><span>ឈ្មោះសិស្ស</span>៖ <b>${DATA.student}</b></div>
  <div><span>មុខវិជ្ជា</span>៖ <b>${DATA.subject}</b></div>
  <div><span>ថ្នាក់</span>៖ <b>${DATA.className}</b></div>
  <div><span>ទម្រង់សិក្សា</span>៖ <b>${DATA.format}</b></div>
  <div><span>ឆ្នាំសិក្សា</span>៖ <b>${DATA.year}</b></div>
  <div><span>រយៈពេលវាយតម្លៃ</span>៖ <b>${DATA.period}</b></div>
  <div><span>ថ្ងៃចេញរបាយការណ៍</span>៖ <b>${DATA.issued}</b></div>
  <div><span>គ្រូបង្រៀន</span>៖ <b>.....................................</b></div>
</div>

<div class="cards">
  <div class="card"><div class="k">ពិន្ទុមធ្យមភាគ</div><div class="v">${avgStr}<small> / ១០០</small></div></div>
  <div class="card"><div class="k">និទ្ទេសរួម</div><div class="v" style="color:${avgColor}">${avgLetter} <small>(${avgLabel})</small></div></div>
  <div class="card"><div class="k">វត្តមាន</div><div class="v">${kh(DATA.attendance)}%</div></div>
  <div class="card"><div class="k">ម៉ោងសិក្សា ១ ទល់ ១</div><div class="v">${kh(DATA.hours)}<small> ម៉ោង</small></div></div>
</div>

<h2>១. លទ្ធផលពិន្ទុតាមជំពូក</h2>
<table>
  <thead><tr><th style="width:5%">ល.រ</th><th style="width:28%">ជំពូក</th><th style="width:8%">ពិន្ទុ</th><th style="width:11%">កម្រិត</th><th style="width:13%">និទ្ទេស</th><th>មតិយោបល់</th></tr></thead>
  <tbody>${topicRows}
  <tr class="tfoot"><td></td><td>ពិន្ទុមធ្យមភាគ</td><td class="c">${avgStr}</td><td><div class="bar"><span style="width:${avg}%;background:${avgColor}"></span></div></td><td class="c">${avgLetter} (${avgLabel})</td><td class="note">លទ្ធផលល្អ គួរជាទីពេញចិត្ត</td></tr>
  </tbody>
</table>

<div class="two avoid" style="margin-top:4px">
  <div>
    <h2>២. ការវិវឌ្ឍនៃពិន្ទុប្រឡងប្រចាំខែ</h2>
    ${trendSvg()}
    <div class="trendnote">ពិន្ទុកើនឡើងជាប់លាប់ +${kh(last - first)} ពិន្ទុ ក្នុងរយៈពេល ${kh(DATA.monthly.length)} ខែ</div>
  </div>
  <div>
    <h2>៣. ឥរិយាបថ និងទម្លាប់សិក្សា</h2>
    <table><thead><tr><th>លក្ខណៈវិនិច្ឆ័យ</th><th style="width:30%">កម្រិត</th><th style="width:24%">លទ្ធផល</th></tr></thead>
    <tbody>${behaviourRows}</tbody></table>
  </div>
</div>

<h2 class="pb">៤. ចំណុចខ្លាំង និងចំណុចត្រូវកែលម្អ</h2>
<div class="two">
  <div class="box good"><h3>ចំណុចខ្លាំង</h3><ul>${li(DATA.strengths)}</ul></div>
  <div class="box weak"><h3>ចំណុចខ្វះខាតតិចតួច</h3><ul>${li(DATA.weaknesses)}</ul></div>
</div>

<h2>៥. អនុសាសន៍សម្រាប់ការកែលម្អ</h2>
<ol class="adv">${li(DATA.advice)}</ol>

<h2>៦. មតិរបស់គ្រូបង្រៀន</h2>
<div class="comment">${DATA.comment}</div>

<div class="date">ធ្វើនៅ ................................ ${DATA.issued}</div>
<div class="sign avoid">
  <div><b>បានឃើញ និងឯកភាព</b><br>នាយកសាលា<div class="ln"></div><div class="nm">ហត្ថលេខា និងឈ្មោះ</div></div>
  <div><b>គ្រូបង្រៀនផ្ទាល់ (១ ទល់ ១)</b><br>មុខវិជ្ជាគណិតវិទ្យា<div class="ln"></div><div class="nm">ហត្ថលេខា និងឈ្មោះ</div></div>
  <div><b>មាតាបិតា ឬអាណាព្យាបាល</b><br>បានទទួលជ្រាប<div class="ln"></div><div class="nm">ហត្ថលេខា និងឈ្មោះ</div></div>
</div>

<div class="scale">មាត្រដ្ឋាននិទ្ទេស៖ ${GRADES.map(([m, L, l], i) => `${L} (${l}) ${i === 0 ? kh('90-100') : i === GRADES.length - 1 ? '&lt; ' + kh(50) : kh(m + '-' + (GRADES[i - 1][0] - 1))}`).join('&nbsp;&nbsp;|&nbsp;&nbsp;')}</div>

</body></html>`;

(async () => {
  const out = path.join(__dirname, 'Long_Math_Report.pdf');
  fs.writeFileSync(path.join(__dirname, 'report.html'), html);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, 'report.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log('Wrote', out);
})();
