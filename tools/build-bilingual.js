#!/usr/bin/env node
/*
 * Builds the bilingual (English + Khmer) PDFs in bilingual/:
 *   Lessons-Module-1..4.pdf   lessons, exercises, answers and solutions
 *   Exam-Sheet-01..20.pdf     48-question sheet modelled on the real paper,
 *                             answer sheet, answer key and solutions
 *   Lesson-Conics-Feynman.pdf  conic sections explained simply, with pictures
 *   Solutions-Sheet-01..20.pdf  answer key and step-by-step solutions in
 *                             English and Khmer, one card per question
 * Uses MathJax CHTML with its own font files so the PDFs stay small.
 *   npm i mathjax@3 playwright && node tools/build-bilingual.js [lessons|sheets|solutions|conics|explain|all] [first] [last]
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'bilingual');
const MJ_DIR = path.dirname(require.resolve('mathjax/es5/tex-chtml.js'));
const CSCA = require(path.join(ROOT, 'js', 'engine.js'));
const what = process.argv[2] || 'all';
const first = Number(process.argv[3] || 1);
const last = Number(process.argv[4] || CSCA.EXAM_SHEET_COUNT);
fs.mkdirSync(OUT, { recursive: true });
const pad = (n) => String(n).padStart(2, '0');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.svg': 'image/svg+xml' };
const MODULE_FILE = ['Sets-and-Inequalities', 'Functions', 'Geometry-and-Algebra', 'Probability-and-Statistics'];

const server = http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file;
    if (url.startsWith('/__mjfonts/')) file = path.join(MJ_DIR, 'output', 'chtml', 'fonts', 'woff-v2', path.basename(url));
    else if (url.startsWith('/__mj/')) file = path.join(MJ_DIR, url.slice(6));
    else file = path.join(ROOT, url);
    if (!file.startsWith(ROOT) && !file.startsWith(MJ_DIR)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(0, async () => {
    const port = server.address().port;
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const render = async (query, file, label, html = 'print-bilingual.html') => {
      await page.goto(`http://localhost:${port}/tools/${html}?${query}`);
      await page.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
      await page.pdf({
        path: file,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#666;font-family:sans-serif">Test for CSCA · ${label} · page <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
        margin: { top: '13mm', bottom: '15mm', left: '13mm', right: '13mm' },
      });
      console.log('wrote', path.relative(ROOT, file), Math.round(fs.statSync(file).size / 1024) + ' KB');
    };
    if (what === 'all' || what === 'lessons')
      for (let m = 1; m <= 4; m++) await render(`doc=lessons&module=${m}`, path.join(OUT, `Lessons-Module-${m}-${MODULE_FILE[m - 1]}.pdf`), `Lessons · Module ${m}`);
    if (what === 'all' || what === 'sheets')
      for (let n = first; n <= last; n++) await render(`doc=sheet&n=${n}`, path.join(OUT, `Exam-Sheet-${pad(n)}.pdf`), `Exam Sheet ${n}`);
    if (what === 'all' || what === 'solutions')
      for (let n = first; n <= last; n++) await render(`n=${n}`, path.join(OUT, `Solutions-Sheet-${pad(n)}.pdf`), `Solutions · Exam Sheet ${n}`, 'print-solutions.html');
    if (what === 'all' || what === 'conics')
      await render('', path.join(OUT, 'Lesson-Conics-Feynman.pdf'), 'Conic sections · the Feynman way', 'print-conics.html');
    if (what === 'all' || what === 'explain')
      await render('', path.join(OUT, 'Explain-Q9-Subsets.pdf'), 'Question 9 explained · subsets', 'print-explain-subsets.html');
    if (what === 'all' || what === 'explain')
      await render('', path.join(OUT, 'Explain-Q9-Subsets-Standard.pdf'), 'Question 9 · standard solution', 'print-explain-subsets-standard.html');
    if (errors.length) console.log('page errors:', errors);
    await browser.close();
    server.close();
  });
