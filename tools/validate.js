#!/usr/bin/env node
/*
 * Validates the CSCA question engine.
 *   node tools/validate.js            structural checks for all papers + stress test
 *   node tools/validate.js --tex      also parse every formula with MathJax (needs `npm i mathjax@3`)
 *   node tools/validate.js --dump     print one sample question from every template
 */
'use strict';
const path = require('path');
const CSCA = require(path.join(__dirname, '..', 'js', 'engine.js'));

const args = process.argv.slice(2);
const problems = [];
const note = (where, msg) => problems.push(`${where}: ${msg}`);

function checkQuestion(q, where) {
  if (!q.q || typeof q.q !== 'string') note(where, 'missing stem');
  if (!Array.isArray(q.choices) || q.choices.length !== 4) note(where, 'needs 4 choices');
  if (new Set(q.choices).size !== 4) note(where, 'duplicate choices ' + JSON.stringify(q.choices));
  if (!(q.answer >= 0 && q.answer < 4)) note(where, 'bad answer index');
  const all = [q.q, q.sol, ...q.choices].join(' ');
  if (/NaN|undefined|Infinity|\[object/.test(all)) note(where, 'bad token in ' + all.slice(0, 160));
  for (const s of [q.q, q.sol]) {
    const opens = (s.match(/\\\(/g) || []).length, closes = (s.match(/\\\)/g) || []).length;
    if (opens !== closes) note(where, 'unbalanced \\( \\) in ' + s.slice(0, 160));
  }
  for (const c of q.choices) {
    let depth = 0;
    for (const ch of c.replace(/\\[{}]/g, '')) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (depth < 0) break;
    }
    if (depth !== 0) note(where, 'unbalanced braces in choice ' + c);
  }
}

// 1. papers
const papers = [];
const answerDist = [0, 0, 0, 0];
for (let n = 1; n <= CSCA.PAPER_COUNT; n++) {
  const p = CSCA.makePaper(n);
  papers.push(p);
  if (p.questions.length !== 48) note(`paper ${n}`, `has ${p.questions.length} questions`);
  p.questions.forEach((q) => {
    checkQuestion(q, `paper ${n} Q${q.no} (${q.tpl})`);
    answerDist[q.answer]++;
  });
  const again = CSCA.makePaper(n);
  if (JSON.stringify(again) !== JSON.stringify(p)) note(`paper ${n}`, 'not deterministic');
}

// 2. stress test every template
const rng = CSCA.makeRng(12345);
const perTpl = {};
for (const t of CSCA.templates) {
  for (let i = 0; i < 400; i++) {
    let q;
    try {
      q = CSCA._build(t, rng);
    } catch (e) {
      note(t.id, 'build threw: ' + e.message);
      break;
    }
    checkQuestion(q, `stress ${t.id}`);
  }
  perTpl[t.id] = CSCA._stats.fail[t.id] || 0;
}

const lessonCounts = {};
CSCA.templates.forEach((t) => (lessonCounts[t.lesson] = (lessonCounts[t.lesson] || 0) + 1));

console.log(`Templates: ${CSCA.templates.length}`);
console.log('Templates per lesson:', lessonCounts);
console.log(`Papers: ${papers.length} × ${CSCA.QUESTIONS_PER_PAPER} questions = ${papers.length * CSCA.QUESTIONS_PER_PAPER}`);
console.log('Answer-letter distribution (A,B,C,D):', answerDist.join(', '));
const noisy = Object.entries(perTpl).filter(([, v]) => v > 300).sort((a, b) => b[1] - a[1]);
if (noisy.length) console.log('Templates with many retries (not errors):', noisy.slice(0, 8));

if (args.includes('--dump')) {
  const r = CSCA.makeRng(7);
  for (const t of CSCA.templates) {
    const q = CSCA._build(t, r);
    console.log(`\n[${t.lesson}/${t.id}] ${q.q}`);
    q.choices.forEach((c, i) => console.log(`   ${'ABCD'[i]}${i === q.answer ? '*' : ' '} ${c}`));
    console.log('   sol:', q.sol);
  }
}

async function texCheck() {
  let MJ;
  try {
    MJ = require('mathjax');
  } catch (e) {
    console.log('mathjax not installed; skipping --tex check');
    return;
  }
  const MathJax = await MJ.init({ loader: { load: ['input/tex', 'output/svg', '[tex]/ams'] }, tex: { packages: { '[+]': ['ams'] } } });
  const seen = new Set();
  const formulas = [];
  const collect = (s) => {
    const re = /\\\(([\s\S]*?)\\\)/g;
    let m;
    while ((m = re.exec(s))) formulas.push(m[1]);
  };
  for (const p of papers)
    for (const q of p.questions) {
      collect(q.q);
      collect(q.sol);
      if (q.math) q.choices.forEach((c) => formulas.push(c));
      else q.choices.forEach(collect);
    }
  const r = CSCA.makeRng(99);
  for (const t of CSCA.templates)
    for (let i = 0; i < 60; i++) {
      const q = CSCA._build(t, r);
      collect(q.q);
      collect(q.sol);
      if (q.math) q.choices.forEach((c) => formulas.push(c));
    }
  let bad = 0;
  for (const f of formulas) {
    if (seen.has(f)) continue;
    seen.add(f);
    const node = MathJax.tex2svg(f, { display: false });
    const html = MathJax.startup.adaptor.outerHTML(node);
    if (/data-mjx-error|merror/.test(html)) {
      bad++;
      if (bad <= 20) note('tex', `${f}  ->  ${(html.match(/data-mjx-error="([^"]*)"/) || [])[1]}`);
    }
  }
  console.log(`TeX check: ${seen.size} distinct formulas, ${bad} with errors`);
}

(async () => {
  if (args.includes('--tex')) await texCheck();
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    problems.slice(0, 60).forEach((p) => console.log(' - ' + p));
    process.exit(1);
  }
  console.log('\nAll checks passed.');
})();
