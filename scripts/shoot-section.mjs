import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';
const [OUT, widthArg] = process.argv.slice(2);
const width = Number(widthArg) || 1440;
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width, height: 900 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
    const lenis = window.__lenis;
    const jump = (y) => (lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y));
  const step = window.innerHeight * 0.6;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    jump(y);
    await new Promise(r => setTimeout(r, 120));
  }
  jump(0);
  await new Promise(r => setTimeout(r, 700));
});
const targets = ['home', 'about', 'categories', 'prizes', 'details', 'register', 'faqs'];
for (const id of targets) {
  const el = await page.$(`#${id}`);
  if (!el) { console.log('missing', id); continue; }
  await el.screenshot({ path: `${OUT}/${width}-${id}.png` });
  console.log('shot', id);
}
await browser.close();
