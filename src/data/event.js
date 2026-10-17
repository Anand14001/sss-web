/**
 * Single source of truth for every event fact shown on the site.
 *
 * Nothing in here may be duplicated or re-typed inside a component — if a number,
 * date or phone number appears on screen, it is read from this file. That keeps the
 * fees (and the deadline, venue and contacts) correct in one edit.
 *
 * Only verified, organiser-supplied information belongs here. Do not add prize
 * values, schedules, judges, rules or a street address until the organisers confirm
 * them.
 */

/**
 * Registration fees, per category.
 *
 * These replaced a single flat fee used during early development. They are the
 * only place a price is written down on the client — every fee shown anywhere on
 * the site, in the category panels, the selection modal and the registration
 * pages, reads from the category objects below.
 *
 * The amount actually charged comes from the server (CATEGORIES[].feePaise in
 * sss-api), which never trusts a price sent by the browser. Keep the two in
 * step: if they drift, the site advertises one price and charges another.
 */

export const WHATSAPP_GROUP_INVITE_URL =
  'https://chat.whatsapp.com/Jbsi0DQ7xFRDyi5ylydf15?s=sw&p=a&mlu=4&ilr=4'

export const event = {
  name: 'Salem Star Speaker',
  tagline: 'The Speaking Contest',
  promise: 'Speak. Express. Inspire.',
  whatsappGroupInviteUrl: WHATSAPP_GROUP_INVITE_URL,
  summary:
    'A platform to find your voice, build confidence, express yourself and make an impact.',

  organisers: [
    {
      name: 'Salem Parenting Club',
      role: 'Presented by',
      logo: 'images/logo-salem-parenting-club.png',
      alt: 'Salem Parenting Club — Connecting people',
    },
    {
      name: 'Speak Up Salem Toastmasters Club',
      role: 'In association with',
      logo: 'images/logo-toastmasters.png',
      alt: 'Toastmasters International',
    },
  ],

  date: {
    iso: '2026-11-01',
    weekday: 'Sunday',
    display: 'Sunday, 1 November 2026',
    short: 'Nov 1, 2026',
    day: '01',
    month: 'November',
  },

  venue: {
    name: 'Hotel A Square Rivera',
    city: 'Salem',
    note: 'Exact hall and reporting time will be shared with registered participants.',
  },

  registration: {
    // Fees differ by category — see `categories` below. This is the range,
    // used where the page speaks about registration in general.
    feeNote: 'per participant · varies by age category',
    deadlineIso: '2026-10-26',
    deadlineDisplay: '26 October 2026',
    availability: 'Limited entries',
  },

  prizes: {
    headline: 'Exciting Prizes',
    detail: 'For the top 3 winners in each category.',
    note: 'Prize details are announced by the organisers closer to the event.',
  },

  prelims:
    'Preliminary rounds may be conducted if there are more participants than the final round can accommodate.',

  contacts: [
    { name: 'Vivek', phone: '86107 11306', tel: '+918610711306', wa: '918610711306' },
    { name: 'Tharu', phone: '7010713565', tel: '+917010713565', wa: '917010713565' },
  ],
}

/**
 * The three contest categories. `min`/`max` drive the age-vs-category validation in
 * the registration form, so they must match the published age bands exactly.
 */
export const categories = [
  {
    id: 'kids',
    name: 'Kids',
    ages: 'Age 10 – 13',
    min: 10,
    max: 13,
    // The poster brands this group "Kids"; the organisers' official registration
    // form calls it "Junior". Both are kept deliberately: the page shows the
    // poster's wording, the form shows the official option verbatim.
    formLabel: 'Junior (10-13 years)',
    slug: 'kid',
    routeTitle: 'Kids Registration',
    ageRange: '10–13 years',
    fee: 250,
    message: 'Little voices. Big dreams.',
    blurb:
      'A first stage, a first microphone and a room that listens. Kids learn to stand tall, speak up and enjoy being heard.',
    image: 'images/category-kids.jpg',
    alt: 'Two children speaking confidently at a podium with a microphone',
    accent: '#C8566A',
    tint: '#F7E8EB',
  },
  {
    id: 'teens',
    name: 'Teens',
    ages: 'Age 14 – 17',
    min: 14,
    max: 17,
    formLabel: 'Teens (14-17 years)',
    slug: 'teen',
    routeTitle: 'Teens Registration',
    ageRange: '14–17 years',
    fee: 250,
    message: 'Speak today. Lead tomorrow.',
    blurb:
      'The years when a voice takes shape. Teens practise structuring an idea, holding a room and saying what they actually mean.',
    image: 'images/category-teens.jpg',
    alt: 'Two teenagers speaking expressively, one holding a microphone',
    accent: '#2F7D63',
    tint: '#E4F0EA',
  },
  {
    id: 'adults',
    name: 'Adults',
    ages: 'Age 18+',
    min: 18,
    max: 99,
    formLabel: 'Adults (18+)',
    slug: 'adult',
    routeTitle: 'Adults Registration',
    ageRange: '18+ years',
    fee: 250,
    message: 'Better communication. Greater opportunities.',
    blurb:
      'Work, family, community — every one of them turns on how clearly you speak. Adults sharpen that in front of a real audience.',
    image: 'images/category-adults.jpg',
    alt: 'Two adults presenting at a podium, each holding a microphone',
    accent: '#6A5AA8',
    tint: '#ECE8F6',
  },
]

/**
 * Occupation options, spelled and capitalised exactly as the organisers' form
 * lists them. Do not reword these.
 */
export const occupations = [
  'Student',
  'Working Professional',
  'Business Owner',
  'Home Maker',
  'Others',
]

export const guardianRelationships = [
  'Mother',
  'Father',
  'Legal Guardian',
  'Other',
]


export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))
export const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]))

/** "₹250" — the one place a fee is formatted. */
export const formatFee = (amount) => `₹${amount}`

/** Formats a coupon's discount label for display */
export const formatDiscount = (coupon) => {
  if (!coupon) return ''
  if (coupon.discountValue === 100 || coupon.isFree) return '100% OFF (Complimentary Free Entry)'
  return `${coupon.discountValue}% OFF`
}

/** Formatted fee range, for copy that speaks about registration without a category. */
export const feeRange =
  Math.min(...categories.map((c) => c.fee)) === Math.max(...categories.map((c) => c.fee))
    ? formatFee(Math.min(...categories.map((c) => c.fee)))
    : `${formatFee(Math.min(...categories.map((c) => c.fee)))} – ${formatFee(
        Math.max(...categories.map((c) => c.fee)),
      )}`

export const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'categories', label: 'Categories' },
  { id: 'prizes', label: 'Prizes' },
  { id: 'details', label: 'Event Details' },
  { id: 'faqs', label: 'FAQs' },
]

export const benefits = [
  {
    title: 'Build confidence on stage',
    body: 'Standing in front of an audience is a skill. It gets easier the moment you have actually done it once.',
  },
  {
    title: 'Practise clear communication',
    body: 'A contest gives you a deadline, a time limit and a listening room — the three things that sharpen speech fastest.',
  },
  {
    title: 'Express ideas effectively',
    body: 'Finding the words for what you think is work. This is a place to do that work out loud.',
  },
  {
    title: 'Speak to a real audience',
    body: 'Not a classroom, not a camera. A live room that reacts, where you learn to read the people in front of you.',
  },
  {
    title: 'Organise your thoughts',
    body: 'Opening, middle, close. Preparing a speech teaches a structure you will reuse long after the contest.',
  },
]

export const faqs = [
  {
    q: 'Who can participate?',
    a: 'Anyone from the age of 10 upwards. Entries are grouped into three categories — Kids (10–13), Teens (14–17) and Adults (18+) — so every participant competes with their own age group.',
  },
  {
    q: 'What are the age categories?',
    a: 'Kids are aged 10 to 13, Teens are 14 to 17, and Adults are 18 and above.',
  },
  {
    q: 'What is the registration fee?',
    a: `The fee depends on the age category: ${categories.map((c) => `${c.name} ${formatFee(c.fee)}`).join(', ')}, per participant.`,
  },
  {
    q: 'When is the event?',
    a: `${event.date.display}. Reporting time and the running order are shared with registered participants by the organisers.`,
  },
  {
    q: 'Where is the venue?',
    a: `${event.venue.name}, ${event.venue.city}. ${event.venue.note}`,
  },
  {
    q: 'What is the last date to register?',
    a: `${event.registration.deadlineDisplay}. Entries are limited, so the organisers may close registration earlier if all places are taken.`,
  },
  {
    q: 'Will there be preliminary rounds?',
    a: event.prelims,
  },
  {
    q: 'How can I contact the organisers?',
    a: `Call or message ${event.contacts.map((c) => `${c.name} on ${c.phone}`).join(' or ')}. They can answer anything not covered on this page.`,
  },
  {
    q: 'What happens after submitting the form?',
    a: 'Your registration details are securely validated and a Razorpay payment window opens to complete the entry fee. Once payment is verified, you will immediately receive your unique registration reference on-screen and a confirmation email to your registered address.',
  },
]

export const seo = {
  title: 'Salem Star Speaker — The Speaking Contest | 1 November 2026, Salem',
  description:
    'A public speaking contest in Salem for kids, teens and adults. Sunday, 1 November 2026 at Hotel A Square Rivera. Registration fee ₹250 per participant, closing 26 October 2026.',
  // Set this to the real domain before deploying; it is only used for canonical/OG tags.
  url: '',
}
