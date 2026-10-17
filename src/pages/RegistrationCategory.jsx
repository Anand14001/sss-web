import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin, PhoneCall, ShieldCheck } from 'lucide-react'
import { event } from '../data/event'
import { useCategories, useCategory } from '../context/CategoriesContext'
import RegistrationForm from '../components/RegistrationForm'

/**
 * One category's registration page — /registration/kid, /teen or /adult.
 *
 * Works on a direct hit, not only when reached from the chooser. An unknown
 * slug redirects to the chooser rather than rendering an empty shell.
 */
export default function RegistrationCategory() {
  const { slug } = useParams()
  const { formatFee } = useCategories()
  const category = useCategory(slug)

  useEffect(() => {
    if (category) document.title = `${category.routeTitle} — ${event.name}`
    return () => {
      document.title = `${event.name} — ${event.tagline} | 1 November 2026, Salem`
    }
  }, [category])

  if (!category) return <Navigate to="/registration" replace />

  return (
    <div className="min-h-screen bg-ivory">
      {/* Masthead. Deliberately simpler than the landing page's sticky header:
          this is a task page, and the only way out should be obvious. */}
      <header className="sticky top-0 z-40 band-dark band-dark-bottom text-white">
        <div className="shell flex items-center justify-between gap-4 py-5">
          <Link to="/" className="flex min-h-11 shrink-0 items-center" aria-label={`${event.name} — home`}>
            <img
              src="/images/title-logo.png"
              alt={`${event.name} — ${event.tagline}`}
              width="2172"
              height="724"
              className="h-10 w-auto max-w-[min(58vw,15rem)] object-contain sm:h-12"
            />
          </Link>

          <Link
            to="/registration"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/20"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Choose another category</span>
            <span className="sm:hidden">Categories</span>
          </Link>
        </div>
      </header>

      <main className="shell py-8 sm:py-14 lg:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow text-gold-dim" style={{ color: category.accent }}>
            {category.name} · {category.ageRange}
          </p>
          <h1 className="display mt-3 text-[clamp(1.75rem,7.6vw,3.75rem)] leading-[0.98] text-navy">
            {category.routeTitle}
          </h1>
          <p className="lede mt-4 text-muted">
            {category.message} Entry is {formatFee(category.fee)} per participant, and
            registration closes {event.registration.deadlineDisplay}.
          </p>
        </div>

        <dl className="surface-sunken mt-6 grid grid-cols-2 gap-x-4 gap-y-3.5 p-4 sm:gap-x-8 lg:hidden">
          {[
            ['Date', event.date.short],
            ['Venue', event.venue.name],
            ['Entry', `${formatFee(category.fee)} per participant`],
            ['Closes', event.registration.deadlineDisplay],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="eyebrow text-[0.625rem] text-muted">{label}</dt>
              <dd className="mt-1 font-sans text-[0.875rem] leading-snug font-medium text-navy">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-14">
          <RegistrationForm category={category} />

          <aside className="space-y-4 self-start sm:space-y-6">
            {/* Mobile shows these in the strip above the form instead. */}
            <div className="surface hidden p-5 sm:p-7 lg:block">
              <p className="eyebrow text-gold-dim">The event</p>
              <dl className="mt-4 grid gap-4 min-[420px]:grid-cols-2 lg:grid-cols-1">
                <div className="flex gap-3.5">
                  <CalendarDays size={17} className="mt-0.5 shrink-0 text-gold-dim" aria-hidden="true" />
                  <div>
                    <dt className="font-sans text-xs tracking-wide text-muted uppercase">Date</dt>
                    <dd className="mt-0.5 font-sans text-sm text-navy/80">{event.date.display}</dd>
                  </div>
                </div>
                <div className="flex gap-3.5">
                  <MapPin size={17} className="mt-0.5 shrink-0 text-gold-dim" aria-hidden="true" />
                  <div>
                    <dt className="font-sans text-xs tracking-wide text-muted uppercase">Venue</dt>
                    <dd className="mt-0.5 font-sans text-sm text-navy/80">
                      {event.venue.name}, {event.venue.city}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Describes what this build actually does — nothing more. */}
            <div className="surface p-5 sm:p-7">
              <p className="eyebrow flex items-center gap-2 text-gold-dim">
                <ShieldCheck size={15} aria-hidden="true" />
                Security & Privacy
              </p>
              <p className="mt-4 font-sans text-sm leading-relaxed text-muted">
                Your details are securely submitted over 256-bit SSL encryption.
                Payments are processed directly via Razorpay’s PCI-DSS compliant gateway.
                No card numbers or bank credentials are ever stored on our servers.
              </p>
              {category.max < 18 && (
                <p className="mt-3 font-sans text-sm leading-relaxed text-muted">
                  <strong className="font-semibold text-navy">Under 18:</strong> a parent or
                  guardian should complete this form and will be the contact for the
                  organisers.
                </p>
              )}
            </div>

            <div className="surface-navy p-5 sm:p-7">
              <p className="eyebrow flex items-center gap-2 text-gold-soft">
                <PhoneCall size={15} aria-hidden="true" />
                Prefer to call?
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 lg:block lg:space-y-2">
                {event.contacts.map((c) => (
                  <li key={c.name}>
                    <a
                      href={`tel:${c.tel}`}
                      className="flex min-h-11 w-fit items-baseline gap-2.5 transition-colors hover:text-gold-soft"
                    >
                      <span className="font-sans text-sm text-white/55">{c.name}</span>
                      <span className="meta-value text-lg">{c.phone}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <Link
          to="/registration"
          className="mt-8 inline-flex sm:mt-10 min-h-11 items-center gap-2 font-sans text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-[6px] transition-colors hover:decoration-navy"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Choose another category
        </Link>
      </main>
    </div>
  )
}
