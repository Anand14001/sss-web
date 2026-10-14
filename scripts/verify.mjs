/**
 * End-to-end checks against the production build served by `vite preview`.
 * Usage: npm run build && npx vite preview --port 4173, then node scripts/verify.mjs
 */
import puppeteer from 'puppeteer'

const BASE = 'http://localhost:4173'
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const results = []
const check = (name, pass, detail = '') =>
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' -- ' + detail : ''}`)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const consoleErrors = []

const watch = (p, tag) => {
  p.on('pageerror', (e) => consoleErrors.push(`${tag}: ${e.message}`))
  p.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`${tag}: ${m.text()}`)
  })
}

/** Scroll through the page so lazy images load and reveals fire. */
const settle = async (p) => {
  await p.evaluate(async () => {
    const l = window.__lenis
    const jump = (y) => (l ? l.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y))
    const step = window.innerHeight * 0.6
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      jump(y)
      await new Promise((r) => setTimeout(r, 80))
    }
    jump(0)
    await new Promise((r) => setTimeout(r, 400))
  })
}

/** Bring an element to the middle of the viewport and click it. */
const clickCentred = async (handle) => {
  await handle.evaluate((el) => {
    const l = window.__lenis
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2
    if (l) l.scrollTo(y, { immediate: true, force: true })
    else el.scrollIntoView({ block: 'center', behavior: 'instant' })
  })
  await wait(250)
  await handle.click()
}

// =========================================================== landing page
const page = await browser.newPage()
watch(page, 'landing')
await page.setViewport({ width: 1440, height: 900 })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await settle(page)

for (const id of ['home', 'about', 'categories', 'prizes', 'details', 'faqs']) {
  check(`section #${id} exists`, (await page.$(`#${id}`)) !== null)
}
check('registration form is no longer embedded in the landing page', (await page.$('#register')) === null)
check('no registration form fields on the landing page', (await page.$('#fullName')) === null)

const brokenImgs = await page.evaluate(() =>
  [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')),
)
check('all images load', brokenImgs.length === 0, brokenImgs.join(', '))

// Per-category pricing, and no trace of the old universal fee.
const landingText = await page.evaluate(() => document.body.innerText)
check(
  'per-category fees shown on the landing page',
  /₹99\b/.test(landingText) && /₹199/.test(landingText) && /₹299/.test(landingText),
)
check('old universal ₹999 fee gone', !/₹999/.test(landingText))
check('no WhatsApp wording anywhere', !/whatsapp/i.test(landingText))
check('no WhatsApp links', (await page.$$('a[href*="wa.me"]')).length === 0)

// Every general CTA points at the chooser.
const registerHrefs = await page.$$eval('a', (els) =>
  els.map((e) => e.getAttribute('href')).filter((h) => h && h.includes('/registration')),
)
check(
  'general CTAs route to /registration',
  registerHrefs.filter((h) => h === '/registration').length >= 4,
  `${registerHrefs.filter((h) => h === '/registration').length} found`,
)
check(
  'category cards link straight to their own slug',
  ['/registration/kid', '/registration/teen', '/registration/adult'].every((h) =>
    registerHrefs.includes(h),
  ),
)

// Clicking a category card lands on that category's form.
const kidCta = await page.$('#categories a[href="/registration/kid"]')
await clickCentred(kidCta)
await wait(900)
check('category card navigates to its form', page.url().endsWith('/registration/kid'), page.url())
check('that form shows the right title', /Kids Registration/.test(await page.evaluate(() => document.body.innerText)))

await page.close()

// ============================================================== chooser
const chooser = await browser.newPage()
watch(chooser, 'chooser')
await chooser.setViewport({ width: 1440, height: 900 })
await chooser.goto(`${BASE}/registration`, { waitUntil: 'networkidle0' })
await wait(700)

check('direct hit on /registration renders a dialog', (await chooser.$('[role="dialog"]')) !== null)
check(
  'the landing page is behind the modal, not a blank screen',
  (await chooser.$('#home')) !== null && (await chooser.$('#categories')) !== null,
)
check('background scroll is locked', await chooser.evaluate(() => document.body.classList.contains('no-scroll')))
check(
  'dialog is labelled',
  (await chooser.$eval('[role="dialog"]', (el) => el.getAttribute('aria-modal'))) === 'true' &&
    /Choose Your Category/i.test(await chooser.$eval('#chooser-title', (el) => el.textContent)),
)
check(
  'supporting line present',
  /Select your age category to continue with registration/i.test(
    await chooser.$eval('#chooser-sub', (el) => el.textContent),
  ),
)

const cards = await chooser.$$eval('[role="dialog"] li', (els) => els.map((e) => e.innerText))
check('three category cards', cards.length === 3, `${cards.length}`)
check(
  'each card shows its own fee',
  /KIDS[\s\S]*10–13 years[\s\S]*₹99/i.test(cards[0]) &&
    /TEENS[\s\S]*14–17 years[\s\S]*₹199/i.test(cards[1]) &&
    /ADULTS[\s\S]*18\+ years[\s\S]*₹299/i.test(cards[2]),
  cards.map((c) => c.replace(/\n/g, ' | ')).join(' // '),
)
check(
  'card buttons are labelled per category',
  cards[0].includes('Register for Kids') &&
    cards[1].includes('Register for Teens') &&
    cards[2].includes('Register for Adults'),
)
check(
  'first card is focused on open',
  await chooser.evaluate(() => document.activeElement?.getAttribute('href') === '/registration/kid'),
)

// Clicking inside must not dismiss it.
await chooser.click('#chooser-title')
await wait(300)
check('clicking inside the panel does not close it', (await chooser.$('[role="dialog"]')) !== null)

// Backdrop dismisses, and a direct hit falls back to home rather than a blank page.
await chooser.mouse.click(12, 12)
await wait(900)
check('backdrop closes the modal', (await chooser.$('[role="dialog"]')) === null)
check('direct-hit close falls back to the homepage', new URL(chooser.url()).pathname === '/', chooser.url())
check('scroll lock released', await chooser.evaluate(() => !document.body.classList.contains('no-scroll')))

// Closing must land on the homepage from every entry point, including the one
// that used to bounce back into the form: category page -> "Choose another
// category" -> close.
await chooser.goto(`${BASE}/registration/teen`, { waitUntil: 'networkidle0' })
await wait(500)
await chooser.click('header a[href="/registration"]')
await wait(800)
check('back link from a category form opens the chooser', (await chooser.$('[role="dialog"]')) !== null)
await chooser.click('[aria-label="Close and go back"]')
await wait(900)
check(
  'closing after arriving from a category form goes home, not back into the form',
  new URL(chooser.url()).pathname === '/',
  chooser.url(),
)
check('the form is gone after closing', (await chooser.$('#fullName')) === null)

// And the back button does not reopen the dialog, because closing replaced it.
await chooser.goBack()
await wait(800)
check(
  'back after closing does not reopen the chooser',
  (await chooser.$('[role="dialog"]')) === null,
  new URL(chooser.url()).pathname,
)

// Closing from a landing-page CTA also goes home.
await chooser.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await wait(400)
await chooser.evaluate(() => document.querySelector('header a[href="/registration"]').click())
await wait(800)
check('header CTA opens the chooser', (await chooser.$('[role="dialog"]')) !== null)
await chooser.keyboard.press('Escape')
await wait(900)
check('closing from a landing CTA goes home', new URL(chooser.url()).pathname === '/', chooser.url())

// Escape closes it too, and going back through history returns to the landing page.
await chooser.goto(`${BASE}/registration`, { waitUntil: 'networkidle0' })
await wait(600)
await chooser.keyboard.press('Escape')
await wait(900)
check('Escape closes the modal', (await chooser.$('[role="dialog"]')) === null)

await chooser.close()

// ================================================= category registration
const expected = {
  kid: { title: 'Kids Registration', label: 'Junior (10-13 years)', range: '10–13 years', fee: '₹99' },
  teen: { title: 'Teens Registration', label: 'Teens (14-17 years)', range: '14–17 years', fee: '₹199' },
  adult: { title: 'Adults Registration', label: 'Adults (18+)', range: '18+ years', fee: '₹299' },
}

for (const [slug, e] of Object.entries(expected)) {
  const p = await browser.newPage()
  watch(p, slug)
  await p.setViewport({ width: 1440, height: 1000 })
  await p.goto(`${BASE}/registration/${slug}`, { waitUntil: 'networkidle0' })
  await wait(500)
  const text = await p.evaluate(() => document.body.innerText)

  check(`/${slug}: direct URL renders`, (await p.$('form')) !== null)
  check(`/${slug}: heading is "${e.title}"`, text.includes(e.title))
  check(`/${slug}: age range ${e.range} shown`, text.includes(e.range))
  check(`/${slug}: fee ${e.fee} shown`, text.includes(e.fee))
  check(
    `/${slug}: no other category's fee leaks in`,
    Object.entries(expected)
      .filter(([s]) => s !== slug)
      .every(([, o]) => !new RegExp(`${o.fee}(?!\\d)`).test(text)),
  )
  check(`/${slug}: category locked to "${e.label}"`, (await p.$eval('#ageCategory', (el) => el.value)) === e.label)
  check(`/${slug}: category field is read-only`, await p.$eval('#ageCategory', (el) => el.readOnly))
  check(`/${slug}: back link to the chooser`, (await p.$('a[href="/registration"]')) !== null)
  check(`/${slug}: only this category's form is on the page`, (await p.$$('form')).length === 1)

  const fields = await p.$$eval('form input[id], form [role="combobox"]', (els) => els.map((el) => el.id))
  check(
    `/${slug}: seven official fields in order`,
    JSON.stringify(fields) ===
      JSON.stringify(['fullName', 'email', 'phone', 'ageCategory', 'dob', 'occupation', 'city']),
    fields.join(' > '),
  )
  check(
    `/${slug}: primary button reads "Complete Registration"`,
    (await p.$eval('button[type="submit"]', (el) => el.textContent.trim())) === 'Complete Registration',
  )
  check(`/${slug}: no consent checkbox`, (await p.$$('form input[type="checkbox"]')).length === 0)
  await p.close()
}

// ------------------------------------------- validation, on the teen form
const form = await browser.newPage()
watch(form, 'teen-form')
await form.setViewport({ width: 1440, height: 1000 })
await form.goto(`${BASE}/registration/teen`, { waitUntil: 'networkidle0' })
await wait(500)

const setValue = async (sel, v) => {
  await form.$eval(
    sel,
    (el, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    },
    v,
  )
}
const choose = async (sel, label) => {
  const trigger = await form.$(sel)
  await clickCentred(trigger)
  await wait(250)
  const listId = await form.$eval(sel, (el) => el.getAttribute('aria-controls'))
  for (const o of await form.$$(`#${listId} [role="option"]`)) {
    if ((await o.evaluate((el) => el.textContent)).trim() === label) {
      await o.click()
      await wait(250)
      return
    }
  }
  throw new Error(`option "${label}" not found`)
}
const submit = async () => {
  await clickCentred(await form.$('button[type="submit"]'))
  await wait(400)
}

const occOptions = await (async () => {
  const trigger = await form.$('#occupation')
  await clickCentred(trigger)
  await wait(250)
  const listId = await form.$eval('#occupation', (el) => el.getAttribute('aria-controls'))
  const opts = await form.$$eval(`#${listId} [role="option"]`, (els) => els.map((e) => e.textContent.trim()))
  await form.keyboard.press('Escape')
  await wait(200)
  return opts
})()
check(
  'occupation options exact',
  JSON.stringify(occOptions) ===
    JSON.stringify(['Student', 'Working Professional', 'Business Owner', 'Home Maker', 'Others']),
  occOptions.join(' | '),
)

await submit()
const alerts = await form.$$eval('[role="alert"]', (els) => els.map((e) => e.textContent))
check('empty submit raises one error per required field', alerts.length === 6, `${alerts.length} alerts`)
check(
  'focus moves to the first invalid field',
  (await form.evaluate(() => document.activeElement?.name)) === 'fullName',
)

const REAL_NAME = "Aarav D'Souza Kumar"
await setValue('#fullName', REAL_NAME)
await setValue('#email', 'not-an-email')
await setValue('#phone', 'call me maybe')
await setValue('#dob', '15/06/2014') // 12 on contest day -> Junior, not Teens
await choose('#occupation', 'Student')
await setValue('#city', 'Salem')
await submit()

check('name with apostrophe and spaces accepted', (await form.$('#fullName-error')) === null)
check(
  'invalid email rejected',
  /valid email/i.test(await form.$eval('#email-error', (el) => el.textContent).catch(() => '')),
)
check(
  'alphabetic phone rejected',
  /valid phone/i.test(await form.$eval('#phone-error', (el) => el.textContent).catch(() => '')),
)
const dobErr = await form.$eval('#dob-error', (el) => el.textContent).catch(() => '')
check('date of birth must match the route category', /Junior \(10-13 years\)/.test(dobErr), dobErr)
check(
  'values preserved when validation fails',
  (await form.$eval('#fullName', (el) => el.value)) === REAL_NAME &&
    (await form.$eval('#city', (el) => el.value)) === 'Salem',
)

// Age counts whole birthdays: born 2 Nov 2008 is still 17 on 1 Nov 2026.
await setValue('#dob', '02/11/2008')
await submit()
check('17 on the contest date is accepted as Teens', (await form.$('#dob-error')) === null)
await setValue('#dob', '01/11/2008') // turns 18 that day -> Adults
await submit()
check(
  'turning 18 on the contest date is rejected on the Teens form',
  /Adults \(18\+\)/.test(await form.$eval('#dob-error', (el) => el.textContent).catch(() => '')),
)

// A complete, valid entry.
await setValue('#fullName', '  Aarav Kumar  ')
await setValue('#email', 'aarav@example.com')
await setValue('#phone', '+91 98765 43210')
await setValue('#dob', '02/11/2008')
await form.evaluate(() => {
  window.__opened = null
  window.open = (u) => {
    window.__opened = u
    return null
  }
})
await submit()
await wait(500)
check('valid entry clears every error', (await form.$$('[role="alert"]')).length === 0)
check('whitespace trimmed on submit', (await form.$eval('#fullName', (el) => el.value)) === 'Aarav Kumar')
check('nothing is opened or navigated to', (await form.evaluate(() => window.__opened)) === null)

const outcome = await form.evaluate(() => document.body.innerText)
check(
  'result says plainly that nothing was submitted',
  /cannot submit them yet/i.test(outcome) && /nothing has been sent, saved or paid/i.test(outcome),
)
check(
  'no false success or payment wording',
  !/registration (successful|confirmed|complete[d]?)\b|payment (successful|received|processed)|thank you for registering/i.test(
    outcome,
  ),
)
check('under-18 form carries a guardian note', /parent or\s+guardian/i.test(outcome))
await form.close()

// ------------------------------------------------ unknown slug redirects
const bad = await browser.newPage()
watch(bad, 'bad-slug')
await bad.setViewport({ width: 1440, height: 900 })
await bad.goto(`${BASE}/registration/grown-ups`, { waitUntil: 'networkidle0' })
await wait(700)
check('unknown category slug redirects to the chooser', new URL(bad.url()).pathname === '/registration', bad.url())
await bad.close()

const stray = await browser.newPage()
watch(stray, 'stray')
await stray.goto(`${BASE}/nope/nowhere`, { waitUntil: 'networkidle0' })
await wait(700)
check('unknown route redirects home', new URL(stray.url()).pathname === '/', stray.url())
await stray.close()

// ================================================== mobile and a11y pass
const m = await browser.newPage()
watch(m, 'mobile')
await m.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
await m.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await m.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto'
})
await m.click('[aria-controls="mobile-nav"]')
await wait(350)
check('mobile menu opens', (await m.$('#mobile-nav')) !== null)
await m.keyboard.press('Escape')
await wait(350)
check('Escape closes mobile menu', (await m.$('#mobile-nav')) === null)

await m.goto(`${BASE}/registration`, { waitUntil: 'networkidle0' })
await wait(700)
check('chooser renders on mobile', (await m.$('[role="dialog"]')) !== null)
check(
  'chooser has no horizontal overflow on mobile',
  await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
)

await m.goto(`${BASE}/registration/adult`, { waitUntil: 'networkidle0' })
await wait(500)
check(
  'category form has no horizontal overflow on mobile',
  await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
)
const smallTargets = await m.evaluate(() =>
  [...document.querySelectorAll('a, button, input, select')]
    .filter((el) => {
      if (el.classList.contains('sr-only') || el.closest('.sr-only')) return false
      if (el.type === 'checkbox') return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.height < 40
    })
    .map((el) => `${el.tagName}:${(el.textContent || el.name || '').trim().slice(0, 30)}`),
)
check('mobile tap targets at least 40px tall', smallTargets.length === 0, smallTargets.join(' | '))
const unlabelled = await m.$$eval('form input, form select', (els) =>
  els.filter((el) => !el.labels?.length && !el.getAttribute('aria-label')).map((el) => el.name || el.id),
)
check('every form control has a label', unlabelled.length === 0, unlabelled.join(', '))
const h1s = await m.$$eval('h1', (els) => els.length)
check('exactly one h1 on a category page', h1s === 1, `${h1s}`)
await m.close()

// ---------------------------------------------------------- policy pages
const pol = await browser.newPage()
watch(pol, 'policy')
for (const slug of ['privacy-policy', 'terms-and-conditions', 'refund-policy']) {
  const res = await pol.goto(`${BASE}/${slug}.html`, { waitUntil: 'domcontentloaded' })
  check(`${slug}.html still served`, res.status() === 200, `${res.status()}`)
}
await pol.close()

// ---------------------------------------------------------- reduced motion
const rm = await browser.newPage()
await rm.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await rm.setViewport({ width: 1440, height: 900 })
await rm.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await wait(600)
const hidden = await rm.evaluate(
  () => [...document.querySelectorAll('[data-reveal]')].filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length,
)
check('reduced motion leaves all content visible', hidden === 0, `${hidden} hidden`)
await rm.close()

console.log(results.join('\n'))
console.log('\n' + (consoleErrors.length ? 'CONSOLE ERRORS:\n' + consoleErrors.join('\n') : 'No console or page errors.'))
const passed = results.filter((r) => r.startsWith('PASS')).length
console.log(`\n${passed}/${results.length} checks passed`)
await browser.close()
process.exit(passed === results.length ? 0 : 1)
