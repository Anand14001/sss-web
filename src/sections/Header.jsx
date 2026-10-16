import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { navLinks, event } from '../data/event'
import { scrollToSection } from '../utils/scroll'
import Button from '../components/Button'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('home')
  const panelRef = useRef(null)
  const toggleRef = useRef(null)

  // Condense the header once the hero starts leaving the viewport.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Highlight the section currently occupying the upper half of the viewport.
  useEffect(() => {
    const sections = navLinks
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean)
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] },
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  // Lock the page behind the mobile panel, and close it on Escape.
  useEffect(() => {
    document.body.classList.toggle('no-scroll', open)
    if (!open) return

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [open])

  const go = (id) => {
    setOpen(false)
    // Let the panel unmount before measuring the scroll target.
    requestAnimationFrame(() => scrollToSection(id))
  }

  return (
    <>
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        onClick={(e) => {
          e.preventDefault()
          scrollToSection('about')
        }}
      >
        Skip to main content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding,backdrop-filter] duration-500 ease-out ${
          scrolled || open
            ? 'bg-navy-deep/90 py-2.5 shadow-[0_10px_30px_-20px_rgba(10,28,52,0.9)] backdrop-blur-xl sm:py-1.5 lg:py-1'
            : 'bg-transparent py-5 sm:py-4 lg:py-3.5'
        }`}
      >
        <div className="shell flex items-center justify-between gap-4">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault()
              go('home')
            }}
            className="flex min-h-11 min-w-0 shrink-0 items-center"
          >
            {/* The event wordmark, 3:1. Sized by height with width:auto so the
                ratio is never touched — no background plate, no filter: the
                artwork is already white and gold for this navy bar. The
                organiser marks keep their place in the hero and the footer. */}
            <img
              src="images/title-logo.png"
              alt={`${event.name} — ${event.tagline}`}
              width="2172"
              height="724"
              fetchPriority="high"
              decoding="async"
              className="h-12 w-auto max-w-[min(58vw,15rem)] object-contain max-[359px]:h-10 sm:h-14 sm:max-w-none lg:h-19 xl:h-21"
            />
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {navLinks.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={active === id ? 'true' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      go(id)
                    }}
                    className={`relative py-2 font-sans text-[0.8125rem] font-medium tracking-wide transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-px after:bg-gold after:transition-[width] after:duration-300 hover:text-gold-soft ${
                      active === id
                        ? 'text-gold-soft after:w-full'
                        : 'text-white/80 after:w-0 hover:after:w-full'
                    }`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {/* Compact below `sm`, the header's `md` pill from there up. At 320
                the mark, the pill and the toggle together asked for more than
                the bar had, and flex took the difference out of the toggle —
                which is why it rendered 30px wide instead of 44. */}
            <Button
              route="/registration"
              size="sm"
              className="sm:min-h-12 sm:px-7 sm:text-[0.9375rem]"
            >
              <span className="sm:hidden">Register</span>
              <span className="hidden sm:inline">Register Now</span>
            </Button>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="grid size-11 shrink-0 place-items-center rounded-full text-white transition-colors duration-300 hover:bg-white/10 lg:hidden"
            >
              {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile panel: full-height, generous tap targets, closes on selection. */}
      {open && (
      <div
        id="mobile-nav"
        ref={panelRef}
        className="fixed inset-0 z-40 flex flex-col bg-navy-deep pt-20 lg:hidden"
      >
        <nav aria-label="Mobile" className="shell flex-1 overflow-y-auto py-6">
          <ul className="flex flex-col">
            {navLinks.map(({ id, label }) => (
              <li key={id} className="border-b border-white/[0.08]">
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    go(id)
                  }}
                  className="block py-4 font-display text-3xl uppercase text-white transition-colors hover:text-gold-soft"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <Button route="/registration" size="lg" className="mt-8 w-full" onClick={() => setOpen(false)}>
            Register Now
          </Button>

          <p className="mt-6 font-sans text-sm text-white/60">
            {event.date.display}
            <br />
            {event.venue.name}
          </p>
        </nav>
      </div>
      )}
    </>
  )
}
