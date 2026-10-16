import { categories, occupations, event } from '../data/event'

/**
 * The seven official registration fields, in the order the organisers' form
 * lists them. Focus moves to the first field in this order that has an error.
 */
export const FIELD_ORDER = ['fullName', 'email', 'phone', 'dob', 'occupation', 'city']

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
/** Indian mobile: 10 digits starting 6–9, once any +91 / 91 / 0 prefix is gone. */
const INDIAN_MOBILE = /^[6-9]\d{9}$/

/**
 * Reduces a typed phone number to digits, dropping the punctuation people
 * actually use (spaces, brackets, dashes, a leading +) and the Indian country
 * or trunk prefix. Anything non-numeric that survives means the entry was not a
 * phone number at all.
 */
export function normalisePhone(value = '') {
  const digits = String(value).replace(/[\s()+.-]/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

export function isValidPhone(value = '') {
  const raw = String(value).trim()
  // Letters are never a phone number, however the rest is formatted.
  if (/[a-z]/i.test(raw)) return false
  const digits = normalisePhone(raw)
  if (!/^\d+$/.test(digits)) return false
  // An Indian mobile, or an international number of a plausible length.
  return INDIAN_MOBILE.test(digits) || (digits.length >= 8 && digits.length <= 15)
}

/** The date the contest is judged on — the reference point for every age. */
export const CONTEST_DATE = new Date(`${event.date.iso}T00:00:00`)

/**
 * Parses a yyyy-mm-dd value and rejects impossible dates.
 *
 * `new Date('2026-02-30')` rolls forward to 2 March rather than failing, so the
 * parsed parts are compared back against the input.
 */
export function parseDateOfBirth(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim())
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== y ||
    date.getMonth() + 1 !== m ||
    date.getDate() !== d
  ) {
    return null
  }
  return date
}

/**
 * Completed years between a date of birth and the contest date.
 *
 * Counts whole birthdays, not the difference between calendar years: someone
 * born 2 November 2008 is 17 on 1 November 2026, not 18.
 */
export function ageOnContestDate(dob) {
  let age = CONTEST_DATE.getFullYear() - dob.getFullYear()
  const monthDelta = CONTEST_DATE.getMonth() - dob.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && CONTEST_DATE.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}

/** The category an age belongs to, or undefined if it falls outside all three. */
export const categoryForAge = (age) =>
  categories.find((c) => age >= c.min && age <= c.max)

/**
 * Validates the seven registration fields and returns a field → message map.
 * An empty object means the form is valid.
 *
 * `category` is the category object for the page being filled in — it comes
 * from the URL, not from a field the participant can change, so the date of
 * birth is checked against that one band rather than against whatever was
 * selected in a dropdown.
 */
export function validateRegistration(values, category) {
  const errors = {}

  // 1 — Full Name. Deliberately permissive: names carry spaces, apostrophes,
  // hyphens and initials, and a stricter rule would reject real people.
  const fullName = values.fullName?.trim() ?? ''
  if (!fullName) {
    errors.fullName = 'Please enter the participant’s full name.'
  } else if (fullName.length < 2) {
    errors.fullName = 'Please enter the full name.'
  }

  // 2 — Email Address.
  const email = values.email?.trim() ?? ''
  if (!email) {
    errors.email = 'Please enter an email address.'
  } else if (!EMAIL.test(email)) {
    errors.email = 'Enter a valid email address, for example you@example.com.'
  }

  // 3 — Phone Number.
  const phone = values.phone?.trim() ?? ''
  if (!phone) {
    errors.phone = 'Please enter a phone number.'
  } else if (!isValidPhone(phone)) {
    errors.phone = 'Enter a valid phone number — 10 digits for an Indian mobile, or include the country code.'
  }

  // 5 — Date of Birth. Validated before the category, because the category
  // check depends on the age it produces.
  const dobRaw = values.dob?.trim() ?? ''
  const dob = dobRaw ? parseDateOfBirth(dobRaw) : null
  let age = null

  if (!dobRaw) {
    errors.dob = 'Please enter the participant’s date of birth.'
  } else if (!dob) {
    errors.dob = 'Enter a real date in the format DD / MM / YYYY.'
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dob > today) {
      errors.dob = 'Date of birth cannot be in the future.'
    } else {
      age = ageOnContestDate(dob)
      if (!category && age < categories[0].min) {
        errors.dob = `You must be at least ${categories[0].min} years old to participate.`
      }
    }
  }

  // 4 — Age Category. Fixed by the route, so the only thing to check is that
  // the date of birth actually belongs to it.
  if (category && age !== null && !errors.dob && (age < category.min || age > category.max)) {
    if (category.slug === 'kid' || category.id === 'kids') {
      errors.dob = 'You must be 10–13 years old to participate.'
    } else if (category.slug === 'teen' || category.id === 'teens') {
      errors.dob = 'You must be 14–17 years old to participate.'
    } else if (category.slug === 'adult' || category.id === 'adults' || category.min >= 18) {
      errors.dob = 'You must be at least 18 years old to participate.'
    } else {
      errors.dob = `You must be ${category.min}–${category.max} years old to participate.`
    }
  }

  // 6 — Occupation.
  if (!values.occupation) {
    errors.occupation = 'Please choose an occupation.'
  } else if (!occupations.includes(values.occupation)) {
    errors.occupation = 'Please choose one of the listed occupations.'
  }

  // 7 — City / Town.
  const city = values.city?.trim() ?? ''
  if (!city) {
    errors.city = 'Please enter a city or town.'
  }

  return errors
}

/**
 * Validates candidate coupon code string before sending API preview.
 */
export function validateCouponCode(code) {
  if (!code || typeof code !== 'string') return 'Please enter a coupon code.'
  const trimmed = code.trim().toUpperCase()
  const cleaned = trimmed.replace(/[\s-_]/g, '')
  if (cleaned.length < 2 || cleaned.length > 32) {
    return 'Coupon code must be between 2 and 32 characters.'
  }
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return 'Coupon codes contain only letters and numbers.'
  }
  if (/^SSS-\d{4}-[A-Z0-9]+$/.test(trimmed)) {
    return 'That looks like a booking reference, not a coupon code.'
  }
  return null
}
