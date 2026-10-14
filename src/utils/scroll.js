import { prefersReducedMotion } from '../hooks/useReveal'

/** Sticky-header clearance, kept in step with `--header-offset` in globals.css. */
const HEADER_OFFSET = 96

/**
 * Anchor navigation.
 *
 * Hands the scroll to Lenis when it is running, and falls back to the native
 * API otherwise — reduced motion, touch devices, or a failure to load the
 * library. Either way there is only ever one animation: CSS smooth scrolling is
 * switched off globally so it cannot run a second one underneath.
 *
 * Focus is then moved to the target so keyboard and screen-reader users continue
 * from the new position rather than from the top of the document.
 */
export function scrollToSection(id) {
  const target = document.getElementById(id)
  if (!target) return

  const lenis = window.__lenis
  if (lenis && !prefersReducedMotion()) {
    lenis.scrollTo(target, { offset: -HEADER_OFFSET, duration: 1.1 })
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  focusWithoutScrolling(target)
}

function focusWithoutScrolling(target) {
  const hadTabIndex = target.hasAttribute('tabindex')
  if (!hadTabIndex) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
  if (!hadTabIndex) {
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
  }
}
