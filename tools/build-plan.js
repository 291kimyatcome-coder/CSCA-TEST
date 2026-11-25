#!/usr/bin/env node
/*
 * Renders the 50-hour study plan poster plan/csca-50-hour-plan.html to
 *   plan/CSCA-50-hour-plan.png  (2828 × 4000, for phones and Telegram)
 *   plan/CSCA-50-hour-plan.pdf  (one page, for printing on A3 or A2)
 *   node tools/build-plan.js   (needs Playwright)
 */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const dir = path.join(__dirname, '..', 'plan');
  const url = 'file://' + path.join(dir, 'csca-50-hour-plan.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1414, height: 2000 }, deviceScaleFactor: 2 });
  await page.goto(url);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 60000 });
  await page.screenshot({ path: path.join(dir, 'CSCA-50-hour-plan.png') });
  await page.pdf({ path: path.join(dir, 'CSCA-50-hour-plan.pdf'), width: '1414px', height: '2000px', printBackground: true, pageRanges: '1' });
  await browser.close();
  console.log('wrote plan/CSCA-50-hour-plan.png and .pdf');
})();
