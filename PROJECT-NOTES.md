# Salem Star Speaker — Project Notes

Working reference for this build. Keep this updated instead of relying on chat history.

---

## 1. Workspace rules (non-negotiable)

```
salem speaking contest/
└── website/
    ├── sss-web/     ← ALL frontend work happens here
    ├── sss-api/     ← MUST stay empty (future backend)
    └── sss-admin/   ← MUST stay empty (future admin dashboard)
```

- No files in `sss-api/` or `sss-admin/` during this phase.
- No app files in the `website/` root.
- Frontend is **static only** — must run on Apache/cPanel with no Node.js on the server.

---

## 2. Verified event facts (single source of truth)

These live in code at `src/data/event.js`. Never hardcode them anywhere else.

| Field | Value |
| --- | --- |
| Event name | Salem Star Speaker — The Speaking Contest |
| Organisers | Salem Parenting Club, in association with Speak Up Salem Toastmasters Club |
| Date | Sunday, 1 November 2026 |
| Venue | Hotel A Square Rivera |
| Registration deadline | 26 October 2026 |
| Fee | ₹999 per participant — **same for every category** |
| Contacts | Vivek 86107 11306 · Tharu 7010713565 |
| Prizes | Top 3 winners in each category |
| Prelims | May be conducted depending on participant numbers |
| Availability | Limited entries |

### Categories

| Category | Ages | Message |
| --- | --- | --- |
| Kids | 10–13 | Little voices. Big dreams. |
| Teens | 14–17 | Speak today. Lead tomorrow. |
| Adults | 18+ | Better communication. Greater opportunities. |

### Do NOT invent
Prize amounts · contest schedule/timings · judges or guest speakers · contest rules ·
venue street address or map coordinates · guaranteed outcomes.
Where something is unknown, point visitors to the organisers.

---

## 3. Reference site research — cassandraworthy.com

Inspected via WebFetch on 2026-10-14 (text/markup extraction; CSS values were not
retrievable, so colour and font values below are design decisions, not measurements).

**Section order observed:** utility bar → nav with persistent primary CTA → hero with
rotating testimonial → "What's New" card row → problem-statement headline → bio block
with pull-quote → three-column framework (SIGNAL / OPPORTUNITY / CHOICE) → service
cards → question headline beside photo → testimonial cards → book promo + logo strip →
closing CTA band → large footer.

**Principles worth translating (not copying):**
1. All-caps display headlines broken into short stacked lines
   ("MAKE CHANGE YOUR / COMPETITIVE ADVANTAGE").
2. One dominant CTA repeated ~5× down the page ("Book Cassandra" → "Register Now").
3. Asymmetric text-beside-image blocks with cut-out subjects, not centred banners.
4. A large pull-quote used as a rhythm break between dense sections.
5. Three-column labelled framework → maps directly onto our three categories.
6. Heavy closing CTA band before a content-rich footer.

**Explicitly not copied:** wording, imagery, logos, personal branding, green palette.

---

## 4. Wappalyzer CSV findings (`wappalyzer_cassandraworthy-com.csv`)

Detected on the reference: WordPress, GeneratePress + GP Premium, Beaver Builder,
Motion.page, Rank Math SEO, GSAP, jQuery + jQuery Migrate, Slick, OWL Carousel,
Animate.css, Goober, core-js, Google Font API, Font Awesome, Twemoji, Cloudflare +
Cloudflare Bot Management, WP Engine hosting, PHP, MySQL, GTM, GA, Facebook Pixel,
HubSpot Analytics, LinkedIn Insight Tag, Cookie Notice.

**Classification:**
- *Visual/presentation:* GSAP, Animate.css, Slick/OWL (carousels), Google Fonts,
  Font Awesome, GeneratePress/Beaver Builder (layout system).
- *CMS / hosting / infra:* WordPress, PHP, MySQL, WP Engine, Cloudflare.
- *Marketing / analytics:* GTM, GA, Facebook Pixel, HubSpot, LinkedIn Insight,
  Rank Math, Cookie Notice.

**Decisions taken:** adopt GSAP (single animation library — no Animate.css, no
jQuery-based carousel alongside it), adopt Google Fonts, replace Font Awesome with
Lucide React, and ignore the CMS/hosting/marketing stack entirely. No analytics or
tracking is installed — nothing to consent to, so no cookie banner is needed.

---

## 5. Tech stack

React 19 · Vite 8 · Tailwind CSS v4 (`@tailwindcss/vite`) · GSAP 3 + ScrollTrigger ·
lucide-react · sharp (build-time asset prep only, not shipped).

No React Router — single landing page with anchor navigation.

---

## 6. Design system (as built)

### Colour
| Token | Value | Use |
| --- | --- | --- |
| `--color-navy` | `#102E52` | headings, primary surfaces |
| `--color-navy-deep` | `#0A1C34` | dark bands, footer |
| `--color-navy-mid` | `#1A4474` | hover state for navy |
| `--color-gold` | `#D6A13A` | primary CTA, accents |
| `--color-gold-soft` | `#E7C27A` | gold on dark grounds |
| `--color-gold-dim` | `#A8781F` | gold on ivory (contrast-safe) |
| `--color-ivory` | `#FAF7F1` | page ground |
| `--color-ivory-deep` | `#F3EDE2` | sunken surfaces |
| `--color-muted` | `#5F6775` | secondary text |

Category accents (from the poster's own colour washes): Kids `#C8566A`,
Teens `#2F7D63`, Adults `#6A5AA8`. Used only on the running number and the
age label — never as a third layout.

### Typography — Fraunces + Manrope

Chosen by rendering four pairings against the real headline and comparing:
Cormorant+Inter (thin and genteel at display size, and the most-used pairing on
the web), DM Serif Display+DM Sans (handsome but anonymous), Instrument
Serif+Plus Jakarta (one display weight, so hierarchy rests on size alone), and
**Fraunces+Manrope — selected**: real character from the `opsz` and `WONK`
axes, a full weight range, and warmth that suits a family/parenting-club event
without losing authority.

| Class | Family / axes | Role |
| --- | --- | --- |
| `.display-xl` | Fraunces 700, `opsz 144`, `WONK 1` | hero headline only |
| `.display-lg` | Fraunces 650, `opsz 144` | section headlines |
| `.display-md` | Fraunces 600, `opsz 96` | category names, footer wordmark |
| `.display-soft` | Fraunces 600, `opsz 72`, sentence case | lines that speak: pull quotes, category messages |
| `.meta-value` | Fraunces 600, `opsz 24` | dates, venue, fee, running numbers |
| `.eyebrow` | Manrope 600, `0.11em` | labels |
| body | Manrope 400/500, 17px/1.7 | everything read at length |

Two variable fonts, one request each. `display=swap`, with Georgia and the
system UI stack as metric-adjacent fallbacks.

### Shape and surface
One radius scale — `--radius-sm` 0.625rem (inputs), `md` 1rem (inline panels),
`lg` 1.5rem (surfaces, image masks), `xl` 2.25rem (large editorial media),
`full` (primary actions). Panels are separated by a shift in tone plus a soft
shadow (`.surface`, `.surface-sunken`, `.surface-navy`), not by 1px outlines;
borders are kept for form controls, where an edge must actually be read.

Light sections share one ivory ground so the page reads as continuous; the dark
bands are the punctuation, and their outer edges are rounded
(`.band-dark-top` / `.band-dark-bottom`) so light and dark meet on a curve.

### Buttons
Five variants only. Pill geometry means "this moves you forward"
(`primary` gold, `navy`, `soft` on ivory, `ghost` on navy); `quiet` is an
inline text action and is never a pill. Hover changes colour and shadow only —
nothing reflows. `active:scale` gives touch devices feedback where there is no
hover.

### Motion
One animation loop: GSAP's ticker drives Lenis, and Lenis drives
`ScrollTrigger.update`. CSS `scroll-behavior` is deliberately `auto` — with
Lenis running, smooth CSS scrolling would animate every anchor jump twice.
Lenis is skipped entirely under `prefers-reduced-motion` and on touch devices
(where it fights native momentum); `scrollToSection` falls back to native
scrolling in both cases, so nothing depends on it existing.

Reveals hide only once JS adds `html.js-motion`, so a failed bundle leaves the
page fully readable.

## 7. Poster-derived assets

Source poster: `src/assets/source/poster.jpg` (1024×1536, supplied).
`node scripts/crop.mjs` regenerates `public/images/` crops — logos are extracted
pixel-accurate, never redrawn:

- `logo-salem-parenting-club.png`, `logo-toastmasters.png`
- `hero-microphone.jpg`
- `category-kids.jpg`, `category-teens.jpg`, `category-adults.jpg`
- `trophy.png`

---

## 8. Registration form — honesty constraints

There is **no backend in this phase**. Therefore:

- The form is a complete, validated UI only.
- It must never claim a registration was saved or a payment was taken.
- Submission opens a **prefilled WhatsApp enquiry** to the organiser, labelled
  clearly as an *enquiry*, not a confirmed registration.
- The ₹999 fee renders from `event.js` → `registration.fee` in every place it appears.

**Validation rules implemented:**
required fields · age 10–99 · age must match the selected category band ·
Indian mobile `[6-9]\d{9}` after stripping spaces/`+91` · email only if provided ·
under-18 participants require guardian name + guardian phone ·
errors announced with `aria-invalid` + `role="alert"` and focus moves to the first error.

---

## 9. Commands

```bash
cd website/sss-web
npm install
npm run dev         # local development
npm run build       # → dist/
npm run preview     # verify the production output locally
node scripts/crop.mjs   # regenerate poster-derived images (rarely needed)
```

Deploy: upload the **contents** of `dist/` into the cPanel document root, keep
`.htaccess`, enable HTTPS. See `README.md`.

---

## 10. Handoff to the future backend

When `sss-api/` is built, these are the integration points:
1. `src/sections/Registration.jsx` — replace the WhatsApp handoff with a `POST`.
2. `src/data/event.js` — fee and deadline should come from the API, not the bundle.
3. Payment gateway, receipt/confirmation UI, and a seat-availability check are all
   out of scope here and must not be simulated.

---

## 11. Creative-direction brief (added mid-build)

The build is held to agency standards, not "it works". Standing requirements:

- **Research breadth:** cassandraworthy.com plus 2–3 further references, chosen for
  relevance (editorial/event/festival/typographic sites), with principles extracted
  rather than copied.
- **Banned patterns** (unless there is a specific reason): hero = text-left +
  rounded-image-right; rows of identical cards; blanket rounded corners; decorative
  blobs and random gradients; icon-and-text feature grids; pill buttons everywhere;
  alternating white/beige section backgrounds for its own sake; glassmorphism;
  gratuitous scroll animation; decoration that does not hold the composition together.
- **Iteration loop is mandatory:** build → inspect the rendered page at desktop and
  mobile → change the code → re-inspect. At least two meaningful visual passes after
  the first draft. No claimed testing that was not run.
- **Quality gates:** distinct identity · event understood in seconds · three
  categories instantly legible · ₹999 visible and consistent · date/venue/deadline
  easy to find · obvious registration path · balanced type · consistent spacing ·
  correct crops · mobile designed, not shrunk · accessible · build passes.

### Verification tooling in this repo

Puppeteer is installed **unsaved** (`npm install --no-save puppeteer`) purely for
inspection; it is not a project dependency and does not ship.

```bash
npm run build
npx vite preview --port 4173          # in one shell
node scripts/verify.mjs               # 35 functional/a11y checks
node scripts/shoot.mjs <dir>          # full-page shots at 320/390/768/1440
node scripts/shoot-section.mjs <dir> <width>   # per-section shots
```

---

## 12. Change log for this build

1. **Scaffold** — Vite + React + Tailwind v4, assets cut from the poster.
2. **First draft** — all 12 sections, validated form, GSAP reveals.
3. **Editorial pass** — removed the AI-template patterns the brief banned:
   text-left/image-right hero → a poster composition with the photograph masked
   into the navy; three identical category cards → a programme index; three
   identical prize boxes → a ranked list; alternating background colours →
   one ivory ground with numbered section markers; decorative blur blobs
   deleted; duplicate photography replaced with distinct portrait crops.
4. **Softening pass** — radius scale, tonal surfaces in place of outlines, pill
   buttons, rounded image masks, curved light/dark transitions, Lenis.
5. **Typography pass** — Fraunces + Manrope chosen against rendered specimens
   of four pairings, with a role for every level.

### Bugs found by inspection, and fixed
- Header CTA's `hidden sm:inline-flex` was overridden by the button's own
  `inline-flex`, so it showed at 320px and wrapped inside its pill. The label
  now shortens below `sm` and no button label can wrap.
- Trophy cut-out: a white halo survived the first threshold pass and reappeared
  when the browser downscaled the image. Fixed with a global background pass
  (the gaps inside the cup's handles are unreachable by a border flood fill),
  a hard edge cut, and removal of disconnected islands left by the poster's
  gold swoosh.
- Mobile tap targets under 40px in the footer, FAQ and contact lists.
- A standalone category number floated above the photograph on mobile with
  nothing to anchor it; folded into the age label there.
- The footer carried `band-dark-top` while sitting directly under the dark
  final CTA, so two dark blocks were notched apart with the ivory page ground
  showing through the curve. The rounding marks a light-to-dark turn and the CTA
  already makes that turn, so the footer now continues the dark passage behind a
  hairline. **Rule: only the first dark band after a light section is rounded.**
- Footer contact links rendered as `inline-flex` (from the tap-target fix) and
  ran together as "86107 11306Tharu"; they are block-level `flex w-fit` now.

### Notes for whoever picks this up
- The capture and verification scripts drive **Lenis**, not `window.scrollTo` —
  Lenis reverts a raw scroll on the next frame, which silently breaks clicks and
  screenshots. See `clickCentred` in `scripts/verify.mjs`.
- `scripts/crop.mjs` is destructive to `public/images/` by design. The only
  source of truth is `src/assets/source/poster.jpg`.

---

## 13. Registration form — official field set

The form mirrors the organisers' own registration form. **Seven fields, this
order, these labels** — do not add, remove, rename or reorder them:

| # | Label | Type |
| --- | --- | --- |
| 1 | Full Name | text |
| 2 | Email Address | email |
| 3 | Phone Number | tel |
| 4 | Age Category | select |
| 5 | Date of Birth (DD / MM / YYYY) | date |
| 6 | Occupation | select |
| 7 | City / Town | text |

**Age Category options** (exact): `Junior (10-13 years)`, `Teens (14-17 years)`,
`Adults (18+)`, with the placeholder `Choose a category` and nothing preselected
unless a category CTA elsewhere on the page sent the visitor here.

**Occupation options** (exact): `Student`, `Working Professional`,
`Business Owner`, `Home Maker`, `Others`, placeholder `Choose your occupation`.

### Naming discrepancy — needs an organiser decision
The poster brands the youngest group **"Kids"**; the official registration form
calls it **"Junior"**. Both are live: the page's category section uses the
poster's wording, and the dropdown uses the official option verbatim. Each
category in `event.js` therefore carries both `name` (poster) and `formLabel`
(official form). Pick one and update both fields if the organisers want them
unified.

### Age rules
Age is counted as **completed birthdays on 1 November 2026**, not the difference
between calendar years — born 2 Nov 2008 is 17 on the contest date, not 18.
Junior 10–13, Teens 14–17, Adults 18+. Under 10 on the contest date is rejected;
so are future and impossible dates (`2026-02-30` is caught, since `new Date()`
would silently roll it to 2 March).

### What Register Now does
Nothing is submitted. There is no API, no env config and no form action in this
project — confirmed by inspection. The button validates, then shows a panel
stating that online registration is not connected, that nothing has been sent,
saved or paid, and that the organisers must be called. **It must never report
success.** `scripts/verify.mjs` asserts this.

The consent checkbox was removed on the organisers' instruction. That is not the
same as having consent: the contest accepts minors, so a parent/guardian consent
process is still required before real registrations are collected.

---

## 14. Custom form controls

The native `<select>` and `<input type="date">` are gone — they could not be
styled to match the page. Replacements live in `src/components/`:

- **`Select.jsx`** — ARIA select-only combobox. The trigger is a `<button>`
  (a labelable element, so `<label for>` still works). Enter / Space / arrows
  open it, arrows and Home/End move the active option, Enter commits, Escape
  cancels and returns focus, and typing jumps to a matching option.
- **`Calendar.jsx` + `DateField.jsx`** — a typable `DD/MM/YYYY` field with a
  calendar beside it. The calendar has day, month and **year** views, because
  this field takes a date of birth and stepping a month at a time would mean
  hundreds of clicks. Dates after today are disabled.
- **`useDismissable.js`** — shared Escape / outside-click / scroll dismissal.

### Three traps worth knowing
1. **Lenis swallows wheel events.** Any scrollable popover needs
   `data-lenis-prevent`, or the page scrolls behind the open menu.
2. **`useId()` emits colons**, which makes the value unusable as a CSS selector.
   The listbox id is derived from the field id instead.
3. **Scroll-to-dismiss needs a threshold.** Focusing a control scrolls it into
   view, and with Lenis that glide is still settling a frame later — dismissing
   on the first scroll event snapped popovers shut as they opened. There is now
   a 24px movement threshold in `useDismissable`.

## 15. Policy pages

`public/privacy-policy.html`, `terms-and-conditions.html` and
`refund-policy.html` are plain static documents sharing `public/policy.css`.
They are not part of the React bundle and need no router — Apache serves them
directly, and the `.htaccess` fallback only fires for paths that do not exist.

**Outstanding, and flagged on the pages themselves:**
- The detailed **contest rules** (topics, time limits, judging, conduct,
  disqualification) have not been supplied. Terms & Conditions says so rather
  than inventing them.
- The **refund terms** have not been set. The Refund Policy says so and tells
  visitors to agree terms with the organisers before paying. Do not replace
  that notice with invented terms — it is a commercial commitment.

## 16. Large-screen layout

Containers are tokens (`--shell`, `--shell-wide`, `--gutter`) that step up at
1536 / 1920 / 2400px, and the display scale steps with them. Before this, both
containers were hard-capped (1240 / 1440) while the hero image still bled to the
viewport edge, so past 1440 the page sat in a fixed band inside a large empty
canvas. Reading measures are untouched: body copy keeps its `max-w-*` limits, so
only the composition widens, never the line length.

`scripts/shoot.mjs` now sweeps 320 / 375 / 430 / 768 / 1024 / 1440 / 1920 / 2560
and reports horizontal overflow at each.

---

## 17. Navbar wordmark

The event wordmark, `public/images/title-logo.png`, is used in two places: the
header (in place of the two organiser marks) and the footer (in place of a
hardcoded "Salem / Star Speaker" set in Fraunces). One asset, one alt text. The organiser marks are **not** retired — they still
appear under "Presented by / In association with" in the hero and in the footer,
via `components/OrganiserLogos.jsx`.

- **Aspect 3:1** (artwork 2172×724; trimmed content 2016×688, so the box is
  almost all artwork — nothing to crop). Sized by height with `w-auto`, so the
  ratio is never touched. No background plate, no filter: the artwork is already
  white and gold for the navy bar.
- **Scale:** 40px under 360px → 48px on phones (144px wide) → 56px at `sm` →
  76px at `lg` → 84px at `xl` (252px wide). 168px wide was tried first and the
  wordmark was illegible; 250px+ is where the name and the tagline both read.
- **The bar height did not change when the logo grew.** Header height is logo
  height plus the header's own vertical padding, so the padding gives back
  exactly what the logo takes: `py-2.5 sm:py-1.5 lg:py-1` scrolled,
  `py-5 sm:py-4 lg:py-3.5` at the top. Measured heights are unchanged —
  **68 / 68 / 84 / 92px scrolled** and **88 / 88 / 104 / 112px at the top**
  across phone / sm / lg / xl. Change one of these and you must change the
  other, or the bar grows.
- **Below 360px** the logo steps back down to 40px (`max-[359px]:h-10`). At
  144px wide it squeezed the Register pill until its label clipped to
  "Registe" — the logo overlapped nothing, so a logo-vs-CTA overlap test did not
  catch it. Check `cta.scrollWidth > cta.clientWidth` as well.

### The file was 1.6 MB
That is render-critical, above the fold, and was the largest asset on the site by
three times. The master is preserved at `src/assets/source/title-logo.png`; the
shipped copy is the same artwork resampled to 900px wide (3× its largest display
size) and re-encoded — **1638 KB → 74 KB, a 95% saving**, with no visible loss at
navbar size. If the logo is ever replaced, do the same rather than dropping a
full-resolution export into `public/`.

---

## 18. Registration flow (routes)

The registration form is **no longer on the landing page**. It lives behind four
client-side routes:

| Route | What it renders |
| --- | --- |
| `/registration` | Landing page with the category chooser as a modal over it |
| `/registration/kid` | Kids form — Junior (10-13 years), **₹99** |
| `/registration/teen` | Teens form — Teens (14-17 years), **₹199** |
| `/registration/adult` | Adults form — Adults (18+), **₹299** |

Unknown category slugs redirect to `/registration`; any other unknown path
redirects to `/`.

### Pricing — needs an organiser decision
The poster says **₹999 for all three categories**. A later instruction set
**₹99 / ₹199 / ₹299 per category**, and those now apply site-wide: the category
panels, event details, hero strip, final CTA and FAQ all read from
`categories[].fee` in `src/data/event.js`. Leaving ₹999 anywhere would have made
the site contradict its own checkout. **Confirm which is right before launch.**

### Category is fixed by the URL
`validateRegistration(values, category)` takes the category from the route, not
from a field. The form shows it `readOnly` with a padlock, so a visitor on
`/registration/kid` cannot submit as an adult; the date of birth is checked
against that one band and the error names the category they should be on.
`FIELD_ORDER` therefore has six entries — `ageCategory` is not user-editable.

### Two things the routes forced
1. **`vite.config.js` base went from `'./'` to `'/'`.** With a relative base, a
   direct load of `/registration/kid` resolves `./assets/...` against
   `/registration/` and 404s on every asset. The cost: the build must now be
   served from the document root, not a subdirectory.
2. **The `.htaccess` SPA rewrite is now load-bearing**, not a nicety. It was
   already there for 404s; it is now what makes direct links and refreshes work
   on the three nested URLs. Real files are matched first, which is what keeps
   the policy pages and `/assets` working.

### Minors — still outstanding
Kids and Teens are minors. The under-18 forms carry a note that a parent or
guardian should complete them, but **that is not a consent process**. A proper
parent/guardian consent and contact step is still required before real
registrations are collected.

---

## 19. Chooser modal — sizing, mobile, and the close destination

**Sizing.** Everything inside the dialog is clamped against viewport *height* as
well as width (`clamp(…, …vh, …)`), and the panel is capped at `100svh` minus
its own margin. Sized only in page units it fit a 1440×900 monitor and overflowed
a 1366×650 laptop — the heading alone took two lines at the page's display scale.
Measured fitting with no scrolling at 320×568, 360×640, 375×667, 390×844,
430×932, 768×1024, 1024×600, 1280×720, 1366×609, 1440×900, 1920×1080, 2560×1440.

**Mobile is a different layout, not a shrunk one.** Below `sm` each category is
a compact row — number, name, age on the left, fee and a chevron on the right —
because three tall cards cannot fit a phone without scrolling. From `sm` they
become the three-column cards with labelled buttons.

**Closing always goes to `/`, never `navigate(-1)`.** Back means "wherever the
visitor came from", and one route in is the "Choose another category" link on a
category form — so back sent them straight into the form they had just left,
which read as the close button not working. The dialog sits over the landing
page, so home is correct from every entry point. `replace: true` keeps it out
of the history stack so back does not reopen it. Covered by regression tests.

## 20. Registration page — mobile

- The title uses `clamp(1.75rem, 7.6vw, 3.75rem)`; `display-lg` bottoms out at
  2.125rem, which put "KIDS REGISTRATION" on one ~330px line inside a 327px
  gutter at 375px.
- The form card drops to `p-5` on phones. Its padding nests inside the page
  gutter, so `p-6` left fields only 279px wide at 375.
- **The particulars move to the top on mobile.** A 2×2 strip (date, venue,
  entry, closes) sits above the form, and the aside's "The event" card is
  `hidden lg:block` — on a phone that card was 700px below the fold. Page
  height at 375 went 2167px → 2012px with better ordering.

## 21. Favicons

Built by `node scripts/favicon.mjs` from `src/assets/source/favicon-master.png`.

The supplied `favicon.svg` was 1.55 MB and not vector at all — an SVG wrapper
around a 1254×1254 PNG. Shipping it would have put 1.5 MB on every page for a
32px icon, so the PNG is extracted, composited onto the brand navy (a
transparent icon loses its navy figure against a dark browser theme) and emitted
at 32, 192 and 180 (apple-touch). Total 68 KB. The source SVG is kept out of
`public/` so it is not served.

**Icon hrefs are absolute.** `href="favicon.svg"` resolved against the current
URL, so it 404'd on every nested route such as `/registration/kid`.
