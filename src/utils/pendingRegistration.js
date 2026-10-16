/**
 * The reference of a registration that has been created but not yet paid for.
 *
 * Until this existed, the reference lived only in React state: a visitor whose
 * browser crashed, or who closed the tab to fetch a card, lost every trace of
 * an entry the server had already recorded. Their only route back was the
 * confirmation email, which is exactly the thing that does not arrive when the
 * payment never completed.
 *
 * Deliberately small. It holds what is needed to offer "you have an unfinished
 * registration — resume it", and nothing that would matter if it leaked: no
 * email, no phone, no date of birth. The reference alone is not a credential
 * worth protecting, but it is also not worth storing more than briefly.
 */

const KEY = 'sss-pending-registration'

/** Long enough to cover a visitor coming back the next day, short enough that a
 *  shared or public machine does not keep it for the rest of the event. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function savePendingRegistration({ reference, categorySlug, fullName }) {
  if (!reference) return
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ reference, categorySlug, fullName, savedAt: Date.now() })
    )
  } catch {
    // Private browsing, blocked storage, or a full quota. The flow still works
    // — the visitor just loses the resume prompt.
  }
}

export function readPendingRegistration() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.reference) return null

    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearPendingRegistration()
      return null
    }
    return parsed
  } catch {
    // Corrupt or unreadable — treat as absent rather than throwing on boot.
    return null
  }
}

export function clearPendingRegistration() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* Nothing to do. */
  }
}
