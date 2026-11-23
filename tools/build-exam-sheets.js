#!/usr/bin/env node
/*
 * Renders the printable exam sheets:
 *   exam-sheets/exam-NN.pdf      student booklet (questions + bubble answer sheet)
 *   exam-sheets/answers-NN.pdf   teacher answer key with worked solutions
 *   exam-sheets/All-Exam-Sheets-1-20.pdf / All-Answer-Keys-1-20.pdf (combined, needs pypdf)
 *   npm i mathjax@3 playwright && node tools/build-exam-sheets.js [first] [last]
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'exam-sheets');
const MJ = require.resolve('mathjax/es5/tex-svg.js');
const CSCA = require(path.join(ROOT, 'js', 'engine.js'));
const first = Number(process.argv[2] || 1);
const last = Number(process.argv[3] || CSCA.EXAM_SHEET_COUNT);
fs.mkdirSync(OUT, { recursive: true });
const pad = (n) => String(n).padStart(2, '0');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

const server = http
  .createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
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
    await page.route('**/cdnjs.cloudflare.com/**', (r) => r.fulfill({ path: MJ, contentType: 'text/javascript' }));
    for (let n = first; n <= last; n++) {
      for (const mode of ['student', 'key']) {
        await page.goto(`http://localhost:${port}/tools/print-sheet.html?sheet=${n}&mode=${mode}`);
        await page.waitForFunction(() => window.__done === true, null, { timeout: 60000 });
        const file = path.join(OUT, `${mode === 'key' ? 'answers' : 'exam'}-${pad(n)}.pdf`);
        const label = mode === 'key' ? `Exam Sheet ${n} · Answer key` : `Exam Sheet ${n}`;
        await page.pdf({
          path: file,
          format: 'A4',
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: '<span></span>',
          footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#666;font-family:sans-serif">Test for CSCA · ${label} · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
          margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
        });
        console.log('wrote', path.relative(ROOT, file));
      }
    }
    await browser.close();
    server.close();
    if (first === 1 && last === CSCA.EXAM_SHEET_COUNT) {
      const merge = `
import sys
from pypdf import PdfWriter
out, files = sys.argv[1], sys.argv[2:]
w = PdfWriter()
for f in files:
    w.append(f)
w.write(out)`;
      for (const [name, prefix] of [['All-Exam-Sheets-1-20.pdf', 'exam'], ['All-Answer-Keys-1-20.pdf', 'answers']]) {
        const files = [];
        for (let n = 1; n <= last; n++) files.push(path.join(OUT, `${prefix}-${pad(n)}.pdf`));
        try {
          execFileSync('python3', ['-c', merge, path.join(OUT, name), ...files]);
          console.log('wrote', path.join('exam-sheets', name));
        } catch (e) {
          console.log('skipped', name, '(needs python3 with pypdf)');
        }
      }
    }
  });
