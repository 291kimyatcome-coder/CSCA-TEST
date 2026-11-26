#!/usr/bin/env node
/*
 * Builds statistics-td/TD1-TD2-Solutions.pdf from statistics-td/TD1-TD2-Solutions.html
 * (step-by-step answers in Khmer for the ITC Statistics tutorials I3-TD1 and I3-TD2).
 *   npm i mathjax@3 playwright && node tools/build-td-solutions.js
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SRC = 'statistics-td/TD1-TD2-Solutions.html';
const OUT = path.join(ROOT, 'statistics-td', 'TD1-TD2-Solutions.pdf');
const MJ_DIR = path.dirname(require.resolve('mathjax/es5/tex-chtml.js'));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff' };

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
    await page.goto(`http://localhost:${port}/${SRC}`);
    await page.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
    const mjErrors = await page.$$eval('mjx-merror, [data-mjx-error]', (els) => els.map((e) => e.textContent));
    await page.pdf({
      path: OUT,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#666;font-family:sans-serif">Statistics · TD1 &amp; TD2 solutions · page <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: '13mm', bottom: '15mm', left: '13mm', right: '13mm' },
    });
    console.log('wrote', path.relative(ROOT, OUT), Math.round(fs.statSync(OUT).size / 1024) + ' KB');
    if (mjErrors.length) console.log('MathJax errors:', mjErrors);
    if (errors.length) console.log('page errors:', errors);
    await browser.close();
    server.close();
  });
