import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../hooks/useReveal'

/**
 * Lenis smooth scrolling, driven by GSAP's ticker.
 *
 * There is exactly one animation loop on this page: GSAP's. Lenis is advanced
 * from inside it rather than running its own requestAnimationFrame, and
 * ScrollTrigger is told to update on every Lenis frame — so reveals stay in step
 * with the eased scroll position instead of lagging a frame behind it.
 *
 * Nothing else may animate scrolling. CSS `scroll-behavior: smooth` is left off
 * deliberately (see globals.css): with Lenis running it would produce a second,
 * competing animation on every anchor jump.
 *
 * The instance is published on `window.__lenis` so `scrollToSection` can hand
 * anchor navigation to it; when Lenis is not running — reduced motion, or a
 * touch device where it is deliberately disabled — that helper falls back to
 * native scrolling, which is why no part of the site depends on it existing.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Honour the user's motion setting, and leave native momentum scrolling
    // alone on touch devices, where smoothing fights the platform's own.
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    if (prefersReducedMotion() || isTouch) return

    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch is handled natively; see above.
      syncTouch: false,
    })

    window.__lenis = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.off('scroll', ScrollTrigger.update)
      lenis.destroy()
      if (window.__lenis === lenis) delete window.__lenis
    }
  }, [])

  return null
}
