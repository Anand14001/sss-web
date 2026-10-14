import { useEffect } from 'react'

/**
 * Closes a popover on Escape, on a click outside it, and on scroll of the page
 * behind it — the three ways a person expects to get out of one.
 *
 * Scroll is measured against where the page was when the popover opened, and
 * only a real movement counts. Focusing a control scrolls it into view, and with
 * Lenis that glide is still settling a frame or two later; dismissing on the
 * first scroll event would snap the popover shut the instant it opened.
 *
 * `onDismiss` is called with `true` when the keyboard caused it, so the caller
 * can return focus to the trigger (returning focus after a mouse click outside
 * would yank the caret out of whatever the person just clicked on).
 */
export function useDismissable(open, rootRef, onDismiss) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onDismiss(true)
      }
    }

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) onDismiss(false)
    }

    // A popover anchored to its trigger would drift away from it on scroll.
    const openedAt = window.scrollY
    const SETTLE = 24 // px of genuine movement before this counts as scrolling
    const onScroll = () => {
      if (Math.abs(window.scrollY - openedAt) > SETTLE) onDismiss(false)
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open, rootRef, onDismiss])
}
