#!/usr/bin/env node
/*
 * Renders every mock paper to pdf/paper-NN.pdf (questions + answer key + solutions).
 *   npm i mathjax@3 playwright   (or use a preinstalled Playwright)
 *   node tools/build-pdfs.js [first] [last]
 * MathJax is served from node_modules so the build works offline.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'pdf');
const MJ = require.resolve('mathjax/es5/tex-svg.js');
const CSCA = require(path.join(ROOT, 'js', 'engine.js'));
const first = Number(process.argv[2] || 1);
const last = Number(process.argv[3] || CSCA.PAPER_COUNT);
fs.mkdirSync(OUT, { recursive: true });

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
      await page.goto(`http://localhost:${port}/tools/print.html?paper=${n}`);
      await page.waitForFunction(() => window.__done === true, null, { timeout: 60000 });
      const file = path.join(OUT, `paper-${String(n).padStart(2, '0')}.pdf`);
      await page.pdf({
        path: file,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#666;font-family:sans-serif">CSCA Mathematics · Mock Paper ${n} · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
        margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
      });
      console.log('wrote', path.relative(ROOT, file));
    }
    await browser.close();
    server.close();
  });
