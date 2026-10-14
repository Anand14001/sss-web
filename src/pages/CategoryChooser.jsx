import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, X } from 'lucide-react'
import { categories, event, formatFee } from '../data/event'

/**
 * The category chooser at /registration, presented as a modal over the landing
 * page.
 *
 * Sizing: everything inside is clamped against viewport *height* as well as
 * width. A dialog sized only in page units is fine on a 1440×900 monitor and
 * overflows a 1366×650 laptop, which is what used to happen here — the heading
 * alone took two lines at the page's display scale. Padding, type and gaps all
 * shrink with the viewport, and the panel is capped at `100svh` minus its own
 * margin, so it fits without scrolling from a short laptop down to a 320×568
 * phone.
 *
 * Layout: a stacked list of compact rows on phones, three columns from `sm`.
 * The phone version is not the desktop card shrunk — a tall card repeated three
 * times would not fit, so each entry becomes a row that reads left to right.
 *
 * Focus is trapped while open and returned on close. Escape, the close button
 * and the backdrop all dismiss; clicking inside does not.
 *
 * Closing always goes to the homepage, and never `navigate(-1)`. Going back
 * means "wherever the visitor came from", and one of the ways into this dialog
 * is the "Choose another category" link on a category form — so back sent them
 * straight into the form they had just left, which looked like the close button
 * doing nothing. The dialog sits over the landing page, so home is the one
 * destination that is right from every entry point.
 *
 * `replace` keeps the dialog out of the history stack, so the back button after
 * closing does not reopen it.
 */
export default function CategoryChooser() {
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const restoreFocusTo = useRef(null)

  const close = () => navigate('/', { replace: true })

  useEffect(() => {
    restoreFocusTo.current = document.activeElement
    document.body.classList.add('no-scroll')

    const panel = panelRef.current
    panel?.querySelector('[data-autofocus]')?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab' || !panel) return

      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.classList.remove('no-scroll')
      const target = restoreFocusTo.current
      if (target instanceof HTMLElement && document.contains(target)) target.focus()
    }
    // close() is stable for the life of this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-navy-deep/80 p-[clamp(0.75rem,2.2vh,2rem)] backdrop-blur-md"
      data-lenis-prevent
      onMouseDown={(e) => {
        // Only a press that both starts and ends on the backdrop closes it, so a
        // drag finishing outside the panel does not.
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chooser-title"
        aria-describedby="chooser-sub"
        className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-lg)] bg-ivory p-[clamp(1.125rem,2.8vh,2.25rem)] shadow-[0_40px_90px_-40px_rgba(10,28,52,0.85)]"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close and go back"
          className="absolute top-[clamp(0.5rem,1.6vh,1.25rem)] right-[clamp(0.5rem,1.6vh,1.25rem)] grid size-11 place-items-center rounded-full text-navy/60 transition-colors duration-200 hover:bg-navy/[0.07] hover:text-navy"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* ----------------------------------------------------------- header */}
        <div className="shrink-0 pr-12">
          <p className="eyebrow text-[0.6875rem] text-gold-dim">Registration</p>
          <h1
            id="chooser-title"
            className="display mt-[clamp(0.25rem,0.9vh,0.75rem)] text-[clamp(1.375rem,1.1vw+2.3vh,2.75rem)] leading-[0.98] text-navy"
          >
            Choose Your Category
          </h1>
          <p
            id="chooser-sub"
            className="mt-[clamp(0.375rem,1.1vh,0.875rem)] text-[clamp(0.8125rem,0.35vw+0.7vh,1.0625rem)] leading-snug text-muted"
          >
            Select your age category to continue with registration.
          </p>
        </div>

        {/* ------------------------------------------------------------ cards
            `min-h-0` lets this shrink inside the capped panel instead of
            pushing the footer out of view on a short screen. */}
        <ul className="mt-[clamp(0.875rem,2.4vh,1.75rem)] grid min-h-0 gap-[clamp(0.5rem,1.4vh,1rem)] sm:grid-cols-3">
          {categories.map((c, i) => (
            <li key={c.id} className="min-h-0">
              <Link
                to={`/registration/${c.slug}`}
                data-autofocus={i === 0 ? '' : undefined}
                aria-label={`Register for ${c.name} — ${c.ageRange}, ${formatFee(c.fee)} per participant`}
                className="group surface-sunken flex h-full items-center gap-4 rounded-[var(--radius-md)] p-[clamp(0.75rem,1.8vh,1.25rem)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(16,46,82,0.5)] sm:flex-col sm:items-stretch sm:gap-0"
              >
                {/* number — a left rail on phones, a caption on wider screens */}
                <span
                  aria-hidden="true"
                  className="meta-value shrink-0 text-[clamp(1rem,1.6vh,1.5rem)] leading-none tabular-nums"
                  style={{ color: c.accent }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0 flex-1 sm:mt-[clamp(0.375rem,1.2vh,0.75rem)] sm:flex-none">
                  <span className="display block text-[clamp(1.125rem,0.7vw+1.5vh,2rem)] leading-none text-navy">
                    {c.name}
                  </span>
                  <span className="mt-1 block text-[clamp(0.6875rem,0.9vh,0.8125rem)] leading-none text-muted">
                    {c.ageRange}
                  </span>
                </span>

                <span className="shrink-0 text-right sm:mt-[clamp(0.625rem,1.8vh,1.25rem)] sm:text-left">
                  <span className="meta-value block text-[clamp(1.125rem,0.6vw+1.5vh,1.875rem)] leading-none text-navy">
                    {formatFee(c.fee)}
                  </span>
                  <span className="mt-1 block text-[clamp(0.625rem,0.85vh,0.75rem)] leading-none text-muted">
                    per participant
                  </span>
                </span>

                {/* The action. On phones the whole row is the target, so this is
                    a chevron; from `sm` it becomes the labelled button. */}
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="ml-1 shrink-0 text-navy/45 transition-transform duration-300 group-hover:translate-x-1 sm:hidden"
                />
                <span
                  aria-hidden="true"
                  className="mt-[clamp(0.625rem,1.8vh,1.25rem)] hidden min-h-11 items-center justify-between gap-3 rounded-full bg-navy px-4 py-2.5 text-[clamp(0.75rem,0.9vh,0.875rem)] font-semibold text-white transition-colors duration-300 group-hover:bg-navy-mid sm:inline-flex"
                >
                  Register for {c.name}
                  <ArrowRight
                    size={15}
                    className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-[clamp(0.75rem,2vh,1.5rem)] shrink-0 text-[clamp(0.625rem,0.85vh,0.75rem)] leading-snug text-muted">
          {event.date.display} · {event.venue.name}. Registration closes{' '}
          {event.registration.deadlineDisplay}.
        </p>
      </div>
    </div>
  )
}
