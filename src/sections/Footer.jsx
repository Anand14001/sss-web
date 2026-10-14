import { event, navLinks } from '../data/event'
import { scrollToSection } from '../utils/scroll'
import Button from '../components/Button'
import OrganiserLogos from '../components/OrganiserLogos'

// Evaluated once at module load — a Date call during render makes the output unstable.
const CURRENT_YEAR = new Date().getFullYear()

const policies = [
  { label: 'Privacy Policy', href: 'privacy-policy.html' },
  { label: 'Terms & Conditions', href: 'terms-and-conditions.html' },
  { label: 'Refund Policy', href: 'refund-policy.html' },
]

export default function Footer() {
  return (
    // No rounded top here: the rounding marks where the page turns from light to
    // dark, and the final CTA above already does that. Curving the footer as well
    // notched two dark blocks apart and let the page ground show between them.
    // A hairline carries the separation instead.
    <footer className="border-t border-white/10 bg-navy text-white">
      <div className="shell py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            {/* The event wordmark, same asset as the navbar. Sized by height
                with w-auto so the 3:1 ratio is untouched, and capped in width so
                it never outgrows the column it shares with the summary line. */}
            <img
              src="images/title-logo.png"
              alt={`${event.name} — ${event.tagline}`}
              width="2172"
              height="724"
              loading="lazy"
              decoding="async"
              className="h-16 w-auto max-w-full object-contain sm:h-20"
            />
            <p className="mt-4 max-w-sm font-sans text-sm leading-relaxed text-white/60">
              {event.summary}
            </p>

            <div className="mt-8 border-t border-white/12 pt-7">
              <OrganiserLogos tone="light" size="sm" withRoles />
            </div>
          </div>

          <nav aria-label="Footer">
            <h2 className="eyebrow text-gold-soft">Explore</h2>
            <ul className="mt-3">
              {navLinks.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(id)
                    }}
                    className="flex min-h-10 w-fit items-center font-sans text-sm text-white/70 transition-colors duration-200 hover:text-gold-soft"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow text-gold-soft">The event</h2>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="font-sans text-xs tracking-wide text-white/45 uppercase">Date</dt>
                <dd className="mt-0.5 font-sans text-sm text-white/85">{event.date.display}</dd>
              </div>
              <div>
                <dt className="font-sans text-xs tracking-wide text-white/45 uppercase">Venue</dt>
                <dd className="mt-0.5 font-sans text-sm text-white/85">
                  {event.venue.name}, {event.venue.city}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-xs tracking-wide text-white/45 uppercase">
                  For queries
                </dt>
                {/* Block-level links, one contact per line: an inline box ran
                    the two numbers together as "86107 11306Tharu". */}
                <dd className="mt-1 space-y-1">
                  {event.contacts.map((c) => (
                    <a
                      key={c.name}
                      href={`tel:${c.tel}`}
                      className="flex min-h-10 w-fit items-center font-sans text-sm text-white/85 transition-colors duration-200 hover:text-gold-soft"
                    >
                      {c.name} · {c.phone}
                    </a>
                  ))}
                </dd>
              </div>
            </dl>

            <Button route="/registration" className="mt-7 w-full sm:w-auto">
              Register Now
            </Button>
          </div>
        </div>

        <div className="mt-14 border-t border-white/12 pt-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="font-sans text-xs text-white/45">
              © {CURRENT_YEAR} Salem Parenting Club · Speak Up Salem Toastmasters
              Club. All rights reserved.
            </p>

            <p className="font-sans text-xs text-white/45">
              Powered by{' '}
              <a
                href="https://digital-dude.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center font-semibold text-white/70 underline decoration-gold/70 underline-offset-4 transition-colors duration-200 hover:text-gold-soft"
              >
                Digital Dude
              </a>
            </p>

            <nav aria-label="Policies">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {policies.map((p) => (
                  <li key={p.href}>
                    <a
                      href={p.href}
                      className="inline-flex min-h-10 items-center font-sans text-xs text-white/45 transition-colors duration-200 hover:text-gold-soft"
                    >
                      {p.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
