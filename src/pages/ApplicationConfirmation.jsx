import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  FileText,
  HelpCircle,
  Home,
  MapPin,
  PhoneCall,
  Printer,
  Sparkles
} from 'lucide-react'
import { api } from '../utils/api'
import { event } from '../data/event'
import { useCategories } from '../context/CategoriesContext'
import WhatsAppGroupCTA from '../components/WhatsAppGroupCTA'

export default function ApplicationConfirmation() {
  const { reference } = useParams()
  const location = useLocation()
  const initialApp = location.state?.application || null
  const { categoryBySlug, formatFee } = useCategories()

  const [app, setApp] = useState(initialApp)
  const [loading, setLoading] = useState(!initialApp)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    document.title = `Application Received: ${reference} — ${event.name}`
  }, [reference])

  useEffect(() => {
    if (app) return
    let active = true

    async function loadStatus() {
      try {
        setLoading(true)
        const res = await api.getRegistrationStatus(reference)
        if (active) {
          setApp(res.registration)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to locate application details.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    if (reference) {
      loadStatus()
    }
    return () => {
      active = false
    }
  }, [reference, app])

  const handleCopy = () => {
    if (!reference) return
    navigator.clipboard?.writeText(reference).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const category = categoryBySlug[app?.category] || categoryBySlug[app?.categorySlug] || null
  const formattedDate = app?.createdAt
    ? new Date(app.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })

  return (
    <div className="min-h-screen bg-ivory text-navy selection:bg-gold selection:text-navy">
      {/* Header */}
      <header className="sticky top-0 z-40 band-dark band-dark-bottom text-white print:hidden">
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
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/20"
          >
            <Home size={16} aria-hidden="true" />
            <span>Return Home</span>
          </Link>
        </div>
      </header>

      <main className="shell py-8 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-3xl">
          {/* Success Banner */}
          <div className="surface overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-xl sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                <CheckCircle2 size={44} strokeWidth={2.2} />
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                <Clock size={13} className="text-amber-600" />
                <span>Application Received · Awaiting Review</span>
              </div>

              <h1 className="display mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">
                Application Submitted Successfully
              </h1>

              <p className="mt-3 max-w-xl font-sans text-base leading-relaxed text-muted sm:text-lg">
                Thank you for applying for <strong className="font-semibold text-navy">{event.name}</strong>.
                Your application has been received and entered into our review queue.
              </p>

              {/* Reference Number Card */}
              <div className="mt-6 w-full max-w-md rounded-2xl border border-gold/30 bg-gold/10 p-4 text-center">
                <p className="eyebrow text-xs text-navy/70 uppercase tracking-wider">Application Reference Number</p>
                <div className="mt-2 flex items-center justify-center gap-2.5">
                  <span className="font-mono text-2xl font-black tracking-wider text-navy sm:text-3xl">
                    {reference}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 text-navy shadow-sm transition hover:bg-white active:scale-95 cursor-pointer"
                    title="Copy reference number"
                    aria-label="Copy reference number"
                  >
                    {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-navy/60">
                  {copied ? 'Copied to clipboard!' : 'Save this reference for all communications and status tracking.'}
                </p>
              </div>
            </div>

            {/* Official WhatsApp Group Invitation (Stage A) */}
            <WhatsAppGroupCTA
              className="mt-8"
              title="Join Our Official WhatsApp Group"
              description="Stay connected with the Salem Star Speaker Contest organisers. Join our official WhatsApp group to receive important announcements, contest updates, and participant instructions."
              buttonText="Join WhatsApp Group"
            />

            {/* Participant & Submission Summary */}
            <div className="mt-8 border-t border-navy/10 pt-6">
              <h3 className="eyebrow text-xs text-gold-dim">Applicant Details</h3>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="rounded-xl bg-ivory/60 p-4">
                  <dt className="text-xs text-muted uppercase tracking-wider">Participant Name</dt>
                  <dd className="mt-1 font-sans text-base font-bold text-navy">
                    {app?.fullName || 'Participant'}
                  </dd>
                </div>

                <div className="rounded-xl bg-ivory/60 p-4">
                  <dt className="text-xs text-muted uppercase tracking-wider">Category Applied</dt>
                  <dd className="mt-1 font-sans text-base font-bold text-navy">
                    {category ? `${category.name} (${category.ageRange})` : app?.category || 'General'}
                  </dd>
                </div>

                <div className="rounded-xl bg-ivory/60 p-4">
                  <dt className="text-xs text-muted uppercase tracking-wider">Registered Email</dt>
                  <dd className="mt-1 font-mono text-sm font-medium text-navy break-all">
                    {app?.email || 'Registered email'}
                  </dd>
                </div>

                <div className="rounded-xl bg-ivory/60 p-4">
                  <dt className="text-xs text-muted uppercase tracking-wider">Submission Date</dt>
                  <dd className="mt-1 font-sans text-sm font-medium text-navy">
                    {formattedDate}
                  </dd>
                </div>

                {category && (
                  <div className="rounded-xl bg-ivory/60 p-4 sm:col-span-2">
                    <dt className="text-xs text-muted uppercase tracking-wider">Category Registration Fee (If Shortlisted)</dt>
                    <dd className="mt-1 flex items-baseline justify-between font-sans text-base font-bold text-navy">
                      <span>{formatFee(category.fee)} per participant</span>
                      <span className="text-xs font-normal text-muted">(Payable only after official invitation)</span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* What Happens Next: Timeline */}
            <div className="mt-8 border-t border-navy/10 pt-6">
              <h3 className="eyebrow text-xs text-gold-dim">What Happens Next?</h3>
              <ol className="mt-4 space-y-4">
                <li className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                    1
                  </span>
                  <div>
                    <h4 className="font-sans text-sm font-bold text-navy">Committee Review</h4>
                    <p className="mt-0.5 font-sans text-sm text-muted">
                      Organisers review applicant age eligibility, category criteria, and capacity.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <h4 className="font-sans text-sm font-bold text-navy">Shortlisting &amp; Email Notification</h4>
                    <p className="mt-0.5 font-sans text-sm text-muted">
                      Shortlisted applicants receive an official invitation with a secure payment link sent to <span className="font-mono text-navy font-semibold">{app?.email}</span>.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                    3
                  </span>
                  <div>
                    <h4 className="font-sans text-sm font-bold text-navy">Payment &amp; Final Seat Confirmation</h4>
                    <p className="mt-0.5 font-sans text-sm text-muted">
                      Once the entry fee is paid via Razorpay, your speaking slot and registration will be permanently confirmed.
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Event Summary */}
            <div className="mt-8 rounded-2xl border border-navy/10 bg-ivory/50 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3">
                  <CalendarDays size={18} className="mt-0.5 shrink-0 text-gold-dim" />
                  <div>
                    <dt className="text-xs text-muted uppercase tracking-wider">Event Date</dt>
                    <dd className="mt-0.5 font-sans text-sm font-semibold text-navy">{event.date.display}</dd>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-gold-dim" />
                  <div>
                    <dt className="text-xs text-muted uppercase tracking-wider">Venue</dt>
                    <dd className="mt-0.5 font-sans text-sm font-semibold text-navy">
                      {event.venue.name}, {event.venue.city}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-navy/20 bg-white px-6 py-2.5 font-sans text-sm font-semibold text-navy transition hover:bg-navy/5 cursor-pointer"
              >
                <Printer size={16} />
                <span>Print or Save Confirmation</span>
              </button>

              <Link
                to="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy px-8 py-2.5 font-sans text-sm font-semibold text-white shadow-md transition hover:bg-navy-mid cursor-pointer"
              >
                <span>Back to Homepage</span>
              </Link>
            </div>
          </div>

          {/* Organizer Help Strip */}
          <aside className="mt-8 surface-navy rounded-3xl p-6 text-white sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow flex items-center gap-2 text-gold-soft">
                  <PhoneCall size={15} />
                  Questions about your application?
                </p>
                <p className="mt-1 font-sans text-sm text-white/70">
                  Feel free to reach out to our event coordinators.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {event.contacts.map((c) => (
                  <a
                    key={c.name}
                    href={`tel:${c.tel}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-sans text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <span>{c.name}:</span>
                    <span className="font-mono text-gold-soft">{c.phone}</span>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
