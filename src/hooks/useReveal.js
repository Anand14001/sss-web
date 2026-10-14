import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scroll-triggered reveals for anything marked `data-reveal`.
 *
 * The `js-motion` class is what hides those elements (see globals.css), and it is
 * only added here — so if the bundle never runs, or the user asks for reduced
 * motion, every element simply renders in place at full opacity.
 *
 * One ScrollTrigger batch covers the whole page; individual sections do not each
 * spin up their own animation layer.
 */
export function usePageReveals() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const root = document.documentElement
    root.classList.add('js-motion')

    const ctx = gsap.context(() => {
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.09,
            overwrite: true,
          }),
      })

      gsap.set('[data-reveal]', { y: 26 })
      ScrollTrigger.refresh()
    })

    return () => {
      ctx.revert()
      root.classList.remove('js-motion')
    }
  }, [])
}

/**
 * Hero entrance. Runs once on mount, independent of scroll position, so the
 * headline is already moving before the first ScrollTrigger ever fires.
 */
export function useHeroIntro(scopeRef) {
  useEffect(() => {
    if (prefersReducedMotion() || !scopeRef.current) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('[data-hero-line]', {
        yPercent: 110,
        duration: 1,
        stagger: 0.1,
      })
        .from('[data-hero-fade]', { opacity: 0, y: 18, duration: 0.7, stagger: 0.08 }, '-=0.55')
        .from('[data-hero-media]', { opacity: 0, scale: 1.06, duration: 1.2 }, '-=1.1')
    }, scopeRef)

    return () => ctx.revert()
  }, [scopeRef])
}
