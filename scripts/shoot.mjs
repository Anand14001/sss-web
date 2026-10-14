import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';
const OUT = process.argv[2];
const BASE = 'http://localhost:4173/';
mkdirSync(OUT, { recursive: true });
const viewports = [
  ['320', 320, 900], ['375', 375, 900], ['430', 430, 900],
  ['768', 768, 1024], ['1024', 1024, 900],
  ['1440', 1440, 950], ['1920', 1920, 1080], ['2560', 2560, 1200],
];
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const errors = [];
for (const [name, width, height] of viewports) {
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${name}] PAGEERROR ${e.message}`));
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
  // Scroll the whole page so every ScrollTrigger reveal fires before capture.
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const lenis = window.__lenis;
    const jump = (y) => (lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y));
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      jump(y);
      await new Promise((r) => setTimeout(r, 120));
    }
    jump(0);
    await new Promise((r) => setTimeout(r, 800));
  });
  // Horizontal overflow check
  const overflow = await page.evaluate(() => {
    const d = document.documentElement;
    const offenders = [...document.querySelectorAll('body *')]
      .filter(el => el.getBoundingClientRect().right > d.clientWidth + 1)
      .slice(0, 5)
      .map(el => el.tagName + '.' + (el.className?.toString?.().slice(0, 60) || ''));
    return { scrollW: d.scrollWidth, clientW: d.clientWidth, offenders };
  });
  console.log(`${name}px  scrollWidth=${overflow.scrollW} clientWidth=${overflow.clientW}` +
    (overflow.scrollW > overflow.clientW ? `  OVERFLOW -> ${overflow.offenders.join(' | ')}` : '  ok'));
  await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
  await page.close();
}
console.log(errors.length ? '\nCONSOLE ERRORS:\n' + errors.join('\n') : '\nNo console errors.');
await browser.close();
