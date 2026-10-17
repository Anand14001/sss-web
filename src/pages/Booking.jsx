import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Home,
  Loader2,
  MapPin,
  PhoneCall,
  Printer,
  RefreshCw,
  SearchX,
  ShieldCheck,
  TicketPercent
} from 'lucide-react'
import { api } from '../utils/api'
import { openCheckout } from '../utils/checkout'
import { event, formatFee } from '../data/event'
import { useCategories } from '../context/CategoriesContext'
import { clearPendingRegistration, savePendingRegistration } from '../utils/pendingRegistration'
import { validateCouponCode } from '../utils/validation'
import WhatsAppGroupCTA from '../components/WhatsAppGroupCTA'

/**
 * Formats ISO date/time into a human-readable timestamp, e.g. "15 Oct 2026, 02:30 PM".
 */
function formatTimestamp(isoString) {
  if (!isoString) return null
  try {
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return null
  }
}

/**
 * /booking/:reference — The canonical booking details & payment status page.
 *
 * Single source of UI truth for every registration state.
 * Direct hits, page reloads, and returning visitors all fetch authoritative
 * status from the server.
 */
export default function Booking() {
  const { reference } = useParams()
  const location = useLocation()
  const { categoryBySlug } = useCategories()

  // Track whether auto-opened checkout has executed to avoid re-triggering on rerenders
  const hasAutoOpened = useRef(false)

  // Data fetching state
  const [result, setResult] = useState({
    phase: 'loading', // 'loading' | 'ready' | 'missing' | 'error'
    data: null,
    error: null,
    forRef: null,
  })

  // Payment gateway / action state: null | 'opening' | 'verifying'
  const [busy, setBusy] = useState(null)

  // Dynamic user notification banner
  const [notice, setNotice] = useState(null)

  // Copy-to-clipboard state
  const [copied, setCopied] = useState(false)

  // Refresh trigger token
  const [reloadToken, setReloadToken] = useState(0)

  // Reference validation
  const isValidReference = Boolean(reference && /^[A-Za-z0-9_-]+$/.test(reference))

  // Derived state: only use cached result if it matches current URL reference
  const state =
    result.forRef === reference
      ? result
      : { phase: isValidReference ? 'loading' : 'missing', data: null, error: null }

  /**
   * Refreshes server registration status.
   */
  const refresh = useCallback(() => {
    setNotice(null)
    setResult((prev) => ({ ...prev, phase: 'loading', forRef: null }))
    setReloadToken((token) => token + 1)
  }, [])

  /**
   * Copy booking reference to clipboard.
   */
  const handleCopyReference = useCallback(() => {
    if (!reference) return
    navigator.clipboard
      .writeText(reference)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        /* Clipboard access restricted */
      })
  }, [reference])

  /**
   * Fetch registration status from server.
   */
  useEffect(() => {
    if (!isValidReference) {
      setResult({ phase: 'missing', data: null, error: null, forRef: reference })
      return
    }

    let ignore = false

    ;(async () => {
      try {
        const res = await api.getRegistrationStatus(reference)
        if (!ignore) {
          setResult({
            phase: 'ready',
            data: res.registration,
            error: null,
            forRef: reference,
          })
        }
      } catch (err) {
        if (!ignore) {
          setResult({
            phase: err.status === 404 ? 'missing' : 'error',
            data: null,
            error: err.message || 'Unable to communicate with the server.',
            forRef: reference,
          })
        }
      }
    })()

    return () => {
      ignore = true
    }
  }, [reference, reloadToken, isValidReference])

  /**
   * Synchronize document title with verified booking state.
   */
  useEffect(() => {
    const isPaid =
      state.data?.status === 'PAID' ||
      state.data?.status === 'CONFIRMED' ||
      Boolean(state.data?.isConfirmed) ||
      state.data?.paymentStatus === 'CAPTURED'

    if (state.phase === 'ready' && isPaid) {
      document.title = `Registration Confirmed: ${reference} — ${event.name}`
    } else if (isValidReference) {
      document.title = `Booking ${reference} — ${event.name}`
    } else {
      document.title = `Booking Details — ${event.name}`
    }

    return () => {
      document.title = `${event.name} — ${event.tagline} | 1 November 2026, Salem`
    }
  }, [
    reference,
    state.phase,
    state.data?.status,
    state.data?.isConfirmed,
    state.data?.paymentStatus,
    isValidReference,
  ])

  /**
   * Synchronize pending registration storage in localStorage.
   */
  useEffect(() => {
    if (state.phase !== 'ready' || !state.data) return

    const isPaid =
      state.data.status === 'PAID' ||
      state.data.status === 'CONFIRMED' ||
      Boolean(state.data.isConfirmed) ||
      state.data.paymentStatus === 'CAPTURED'

    if (isPaid) {
      clearPendingRegistration()
    } else if (state.data.status === 'AWAITING_PAYMENT') {
      savePendingRegistration({
        reference: state.data.reference,
        categorySlug: state.data.category,
        fullName: state.data.fullName,
      })
    }
  }, [state.phase, state.data])

  /**
   * Launch Razorpay checkout for a valid order.
   */
  const launchCheckout = useCallback(
    async (order, prefillData = {}) => {
      if (!order || !order.id || !order.keyId) {
        setNotice({
          tone: 'warning',
          message: 'Unable to initialize checkout. Please click Pay Now to retry.',
        })
        return
      }

      const category = categoryBySlug[state.data?.category]
      setBusy('opening')

      try {
        await openCheckout({
          order,
          reference,
          description: category ? `${category.name} Registration (${category.ageRange})` : undefined,
          prefill: {
            name: prefillData.name || state.data?.fullName,
            email: prefillData.email,
            contact: prefillData.contact,
          },
          onVerifying: () => setBusy('verifying'),
          onConfirmed: ({ registration, paymentId }) => {
            setBusy(null)
            setNotice(null)
            clearPendingRegistration()
            setResult((prev) => ({
              ...prev,
              phase: 'ready',
              data: {
                ...prev.data,
                ...registration,
                status: registration?.status || 'CONFIRMED',
                isConfirmed: true,
                paymentStatus: 'CAPTURED',
                paymentId: paymentId || registration?.paymentId,
              },
              forRef: reference,
            }))
          },
          onFailed: ({ reason, pending }) => {
            setBusy(null)
            setNotice({
              tone: pending ? 'pending' : 'warning',
              message: reason,
            })
            if (pending) {
              // Trigger a background re-fetch after 5s to check if late webhook confirmed it
              setTimeout(() => {
                setReloadToken((t) => t + 1)
              }, 5000)
            }
          },
        })
      } catch (err) {
        setBusy(null)
        setNotice({
          tone: 'warning',
          message: err.message || 'Failed to start payment gateway.',
        })
      }
    },
    [reference, state.data],
  )

  /**
   * Handle user-initiated payment retry.
   */
  const handlePay = useCallback(async () => {
    setNotice(null)
    setBusy('opening')

    try {
      const res = await api.retryPayment(reference)

      if (res.alreadyPaid || res.freeRegistration) {
        setBusy(null)
        refresh()
        return
      }

      if (res.repriced) {
        setBusy(null)
        setNotice({
          tone: 'warning',
          message: `The registration fee has been updated to ₹${res.payableAmountPaise / 100} (${res.discountPaise > 0 ? 'coupon discount applied' : 'previous discount elapsed'}). Click Pay Now again to complete payment with this updated fee.`,
        })
        refresh()
        return
      }

      await launchCheckout(res.order)
    } catch (err) {
      setBusy(null)
      setNotice({
        tone: 'warning',
        message: err.message || 'Could not initiate payment. Please try again.',
      })
    }
  }, [reference, refresh, launchCheckout])

  /**
   * Handle auto-open checkout on initial navigation from registration form.
   */
  useEffect(() => {
    if (hasAutoOpened.current) return
    if (state.phase !== 'ready' || !state.data) return

    // If registration is already paid, do not open checkout
    const isAlreadyPaid =
      state.data.status === 'PAID' ||
      state.data.status === 'CONFIRMED' ||
      Boolean(state.data.isConfirmed) ||
      state.data.paymentStatus === 'CAPTURED'

    if (isAlreadyPaid) {
      hasAutoOpened.current = true
      return
    }

    // If arrived with navigation state containing an order, auto-open once
    const navState = location.state
    if (
      navState?.autoOpenCheckout &&
      navState?.order &&
      !navState?.freeRegistration &&
      state.data.status === 'AWAITING_PAYMENT'
    ) {
      hasAutoOpened.current = true
      // Clear location state to prevent repeat triggers on reload/back
      window.history.replaceState({}, document.title)
      launchCheckout(navState.order)
    }
  }, [state.phase, state.data, location.state, launchCheckout])

  const category = state.data ? categoryBySlug[state.data.category] : null
  const isPaid =
    state.data?.status === 'PAID' ||
    state.data?.status === 'CONFIRMED' ||
    Boolean(state.data?.isConfirmed) ||
    state.data?.paymentStatus === 'CAPTURED'
  const isCancelled = state.data?.status === 'CANCELLED'
  const isVerifying = busy === 'verifying'

  return (
    <div className="min-h-screen bg-ivory">
      {/* Masthead */}
      <header className="sticky top-0 z-40 band-dark band-dark-bottom text-white no-print">
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

          <div className="flex items-center gap-3">
            {isPaid ? (
              <Link
                to="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/20"
              >
                <Home size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Event Home</span>
              </Link>
            ) : (
              <Link
                to="/registration"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-sans text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/20"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span className="hidden sm:inline">All Categories</span>
                <span className="sm:hidden">Categories</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="shell py-8 sm:py-14 lg:py-18">
        <div className="mx-auto max-w-2xl">
          {/* Live announcer for accessible dynamic state transitions */}
          <div aria-live="polite" aria-atomic="true">
            {/* 1. INITIAL LOADING SKELETON */}
            {state.phase === 'loading' && <LoadingPanel reference={reference} />}

            {/* 2. REGISTRATION NOT FOUND (404) */}
            {state.phase === 'missing' && <MissingPanel reference={reference} />}

            {/* 3. SERVER OR NETWORK ERROR */}
            {state.phase === 'error' && <ErrorPanel error={state.error} onRetry={refresh} />}

            {/* 4. READY: CONFIRMED OR PENDING */}
            {state.phase === 'ready' && state.data && (
              <>
                {/* Payment Verification Spinner Overlay / Banner */}
                {isVerifying ? (
                  <VerifyingPanel reference={reference} />
                ) : isPaid ? (
                  <ConfirmedPanel
                    registration={state.data}
                    category={category}
                    reference={reference}
                    copied={copied}
                    onCopy={handleCopyReference}
                  />
                ) : isCancelled ? (
                  <CancelledPanel reference={reference} />
                ) : (
                  <PendingPaymentPanel
                    registration={state.data}
                    category={category}
                    reference={reference}
                    busy={busy}
                    notice={notice}
                    onPay={handlePay}
                    onRefresh={refresh}
                  />
                )}
              </>
            )}
          </div>

          <OrganiserContacts />
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ Panels */

/**
 * Loading Skeleton state.
 */
function LoadingPanel({ reference }) {
  return (
    <div className="surface p-6 sm:p-10 text-center animate-fade-in">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-navy/10 text-navy">
        <Loader2 size={38} className="animate-spin text-gold" aria-hidden="true" />
      </div>
      <p className="eyebrow mt-5 text-gold-dim">Checking Server</p>
      <h1 className="display mt-2 text-2xl sm:text-3xl text-navy">
        Retrieving Booking Status
      </h1>
      <p className="mt-3 font-sans text-sm text-muted">
        Looking up registration reference{' '}
        <strong className="font-mono text-navy font-bold">{reference}</strong>...
      </p>

      <div className="surface-sunken my-6 mx-auto max-w-md rounded-2xl p-6 border border-navy/5 text-left space-y-4">
        <div className="h-4 bg-navy/10 rounded w-1/3 animate-pulse" />
        <div className="h-8 bg-navy/10 rounded w-3/4 animate-pulse" />
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="h-4 bg-navy/10 rounded animate-pulse" />
          <div className="h-4 bg-navy/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

/**
 * Payment Verification In Progress state.
 */
function VerifyingPanel({ reference }) {
  return (
    <div className="surface p-6 sm:p-10 text-center animate-fade-in border-2 border-gold/40">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-navy text-gold">
        <Loader2 size={40} className="animate-spin" aria-hidden="true" />
      </div>
      <p className="eyebrow mt-5 text-gold-dim font-bold tracking-wider">
        Verification in Progress
      </p>
      <h1 className="display mt-2 text-2xl sm:text-3xl text-navy">
        Confirming Your Payment
      </h1>
      <p className="mt-3 font-sans text-base text-muted max-w-md mx-auto">
        We are securely validating your payment with Razorpay and the banking network. Please do not
        close or refresh this page.
      </p>

      <div className="surface-sunken my-6 mx-auto max-w-sm rounded-xl p-4 border border-navy/10 text-center font-sans text-xs text-muted">
        <span>Reference: </span>
        <strong className="font-mono text-navy text-sm font-bold">{reference}</strong>
      </div>
    </div>
  )
}

/**
 * Confirmed Booking State.
 */
function ConfirmedPanel({ registration, category, reference, copied, onCopy }) {
  const formattedCreated = formatTimestamp(registration.createdAt)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Printable Booking Pass & Official Receipt Card */}
      <div className="surface p-6 sm:p-10 print-receipt-card text-center relative overflow-hidden">
        {/* Success Header */}
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-800">
          <CheckCircle2 size={44} aria-hidden="true" />
        </div>

        <p className="eyebrow mt-5 text-emerald-800 font-bold tracking-wider uppercase">
          Payment Verified · Registration Confirmed
        </p>
        <h1 className="display mt-2 text-2xl sm:text-4xl text-navy">
          Your Place is Confirmed!
        </h1>
        <p className="mt-3 font-sans text-base text-muted max-w-lg mx-auto">
          Thank you, <strong className="text-navy">{registration.fullName}</strong>. You are
          officially registered for <strong>{event.name}</strong>.
        </p>

        {/* Reference Highlight Badge */}
        <div className="surface-sunken my-7 mx-auto max-w-lg rounded-2xl p-5 sm:p-6 border border-gold/40 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-xs text-gold-dim">Official Registration Reference</p>
              <p className="meta-value mt-1 text-2xl sm:text-3xl font-extrabold text-navy tracking-wide font-mono">
                {reference}
              </p>
            </div>
            <button
              type="button"
              onClick={onCopy}
              className="no-print inline-flex items-center gap-1.5 rounded-full bg-navy/10 hover:bg-navy/20 px-4 py-2 font-sans text-xs font-semibold text-navy transition-colors"
              aria-label="Copy registration reference"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-700" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs font-sans text-muted">
            Quote this reference number at the reception desk on contest day.
          </p>

          <div className="mt-5 pt-4 border-t border-navy/10 grid grid-cols-2 gap-4 text-sm font-sans">
            <div>
              <span className="text-muted block text-xs">Participant</span>
              <span className="font-semibold text-navy mt-0.5 block">{registration.fullName}</span>
            </div>
            <div>
              <span className="text-muted block text-xs">Category</span>
              <span className="font-semibold text-navy mt-0.5 block">
                {category?.name ?? registration.category} ({category?.ageRange ?? 'Official'})
              </span>
            </div>
            <div>
              <span className="text-muted block text-xs">Entry Fee Paid</span>
              <span className="font-bold text-navy mt-0.5 block">
                {registration.amountRupees === 0
                  ? '₹0 (Complimentary Entry)'
                  : formatFee(registration.amountRupees ?? category?.fee)}
              </span>
            </div>
            <div>
              <span className="text-muted block text-xs">Payment Status</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 text-xs mt-0.5 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Check size={12} /> {registration.amountRupees === 0 ? 'Complimentary Entry' : 'Verified & Paid'}
              </span>
            </div>
            {registration.couponCode && (
              <div className="col-span-2">
                <span className="text-muted block text-xs">Coupon Applied</span>
                <span className="font-mono text-xs font-bold text-emerald-800 mt-0.5 block">
                  {registration.couponCode}
                  {registration.discountPaise ? ` (-₹${registration.discountPaise / 100})` : ''}
                </span>
              </div>
            )}
            {registration.paymentId ? (
              <div className="col-span-2">
                <span className="text-muted block text-xs">Transaction ID (Razorpay)</span>
                <span className="font-mono text-xs text-navy/70 mt-0.5 block break-all">
                  {registration.paymentId}
                </span>
              </div>
            ) : registration.amountRupees === 0 ? (
              <div className="col-span-2">
                <span className="text-muted block text-xs">Settlement Mode</span>
                <span className="font-mono text-xs font-semibold text-emerald-800 mt-0.5 block">
                  100% COMPLIMENTARY (Direct Confirmed Entry)
                </span>
              </div>
            ) : null}
            {formattedCreated && (
              <div className="col-span-2">
                <span className="text-muted block text-xs">Registered At</span>
                <span className="font-sans text-xs text-navy/70 mt-0.5 block">
                  {formattedCreated}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Verified Event Particulars */}
        <div className="surface-sunken mx-auto max-w-lg rounded-xl p-5 text-left mb-7 space-y-3 font-sans text-sm text-navy/85 border border-navy/5">
          <div className="flex items-start gap-3">
            <CalendarDays size={18} className="text-gold-dim shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-navy">Contest Date</p>
              <p className="text-muted text-xs mt-0.5">{event.date.display}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-gold-dim shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-navy">Venue &amp; Location</p>
              <p className="text-muted text-xs mt-0.5">
                {event.venue.name}, {event.venue.city}. {event.venue.note}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check size={18} className="text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-navy">Important Participant Instructions</p>
              <p className="text-muted text-xs mt-0.5">
                Hall allocation and reporting timings will be communicated to registered participants prior
                to contest day. Please arrive 15 minutes before your category reporting time with age proof.
              </p>
            </div>
          </div>
        </div>

        {/* Official WhatsApp Group CTA (Stage E) */}
        <WhatsAppGroupCTA
          className="mx-auto max-w-lg mb-7 no-print"
          title="Booking Confirmed!"
          description="Your payment has been successfully verified. Join our official WhatsApp group to stay informed about contest announcements, updates, and participant instructions."
          buttonText="Join WhatsApp Group"
        />

        {/* Action Buttons */}
        <div className="no-print flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-navy/20 bg-white px-6 py-3 font-sans text-sm font-semibold text-navy hover:bg-navy/5 transition-colors shadow-sm"
          >
            <Printer size={16} aria-hidden="true" />
            <span>Print / Save Pass</span>
          </button>

          <Link
            to="/"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-8 py-3 font-sans text-sm font-semibold text-white hover:bg-navy-mid transition-colors shadow-sm"
          >
            <Home size={16} aria-hidden="true" />
            <span>Return to Homepage</span>
          </Link>
        </div>

        {/* Permanent URL Notice */}
        <div className="no-print mt-7 pt-5 border-t border-navy/10 text-center font-sans text-xs text-muted">
          <p>
            You can return to this verified booking pass at any time by visiting:{' '}
            <Link to={`/booking/${reference}`} className="font-semibold text-navy underline">
              /booking/{reference}
            </Link>
          </p>
          <p className="mt-1 text-muted/80">
            A confirmation email has also been dispatched for this verified booking.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Unpaid / Pending Payment State.
 */
function PendingPaymentPanel({
  registration,
  category,
  reference,
  busy,
  notice,
  onPay,
  onRefresh,
}) {
  const isPendingVerification = notice?.tone === 'pending'
  const isRetrying = busy === 'opening' || busy === 'verifying'

  return (
    <div className="surface p-6 sm:p-10 text-center animate-fade-in">
      <div
        className={`mx-auto grid size-20 place-items-center rounded-full ${
          isPendingVerification ? 'bg-amber-100 text-amber-800' : 'bg-navy/10 text-navy'
        }`}
      >
        {isPendingVerification ? (
          <Clock size={44} aria-hidden="true" />
        ) : (
          <Clock size={44} aria-hidden="true" />
        )}
      </div>

      <p
        className={`eyebrow mt-5 font-bold tracking-wider uppercase ${
          isPendingVerification ? 'text-amber-800' : 'text-navy/70'
        }`}
      >
        {isPendingVerification ? 'Awaiting Bank Confirmation' : 'Payment Not Completed'}
      </p>

      <h1 className="display mt-2 text-2xl sm:text-3xl text-navy">
        {isPendingVerification ? 'Payment Confirmation in Progress' : 'Complete Your Registration'}
      </h1>

      <p className="mx-auto mt-3 max-w-md font-sans text-base text-muted">
        {isPendingVerification ? (
          <>
            Your payment was initiated and is awaiting final confirmation from the banking gateway. If
            money has been deducted, <strong>please do not pay again</strong>.
          </>
        ) : (
          <>
            Your registration details for <strong>{registration.fullName}</strong> are saved under
            reference <strong className="text-navy">{reference}</strong>, but the entry fee has not yet
            been confirmed.
          </>
        )}
      </p>

      {/* Reference Card */}
      <div className="surface-sunken my-6 mx-auto max-w-md rounded-2xl border border-gold/40 p-5 text-left font-sans text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <span className="eyebrow text-xs text-gold-dim">Reference ID</span>
          <span className="meta-value text-xl font-extrabold tracking-wide text-navy font-mono">
            {reference}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-navy/10 pt-4">
          <div>
            <span className="block text-xs text-muted">Participant</span>
            <span className="mt-0.5 font-semibold text-navy">{registration.fullName}</span>
          </div>
          <div>
            <span className="block text-xs text-muted">Category</span>
            <span className="mt-0.5 font-semibold text-navy">
              {category?.name ?? registration.category}
            </span>
          </div>
          <div className="col-span-2">
            {registration.couponCode && registration.discountPaise > 0 ? (
              <div className="space-y-1 border-t border-navy/10 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Standard entry fee</span>
                  <span className="font-mono">{formatFee(registration.baseAmountRupees ?? category?.fee)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span>Coupon discount ({registration.couponCode})</span>
                  <span className="font-mono">-₹{registration.discountPaise / 100}</span>
                </div>
                <div className="flex justify-between border-t border-navy/10 pt-1.5 font-bold">
                  <span className="text-navy">Amount Due</span>
                  <span className="font-mono text-navy text-lg">{formatFee(registration.amountRupees)}</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="block text-xs text-muted">Amount Due</span>
                <span className="mt-0.5 font-bold text-navy text-lg">
                  {formatFee(registration.amountRupees ?? category?.fee)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Coupon code application / removal */}
        {!isPendingVerification && (
          <CouponBookingSection
            reference={reference}
            registration={registration}
            onUpdated={onRefresh}
          />
        )}
      </div>

      {/* Notice Alert */}
      {notice && (
        <div
          role="alert"
          className={`mb-6 rounded-xl border p-4 text-left font-sans text-sm ${
            notice.tone === 'pending'
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {notice.tone === 'pending' ? 'Payment Under Verification' : 'Payment Incomplete'}
              </p>
              <p className="mt-1">{notice.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Only offer Pay / Retry if NOT in pending bank verification state */}
        {!isPendingVerification && (
          <button
            type="button"
            onClick={onPay}
            disabled={isRetrying}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-8 py-3 font-sans text-sm font-semibold text-white transition-colors hover:bg-navy-mid disabled:cursor-not-allowed disabled:opacity-75 shadow-sm"
          >
            {isRetrying ? (
              <>
                <Loader2 size={16} className="animate-spin text-gold" aria-hidden="true" />
                <span>Opening Payment...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Pay {formatFee(registration.amountRupees ?? category?.fee)} Now</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRetrying}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-navy/20 bg-white px-6 py-3 font-sans text-sm font-semibold text-navy transition-colors hover:bg-navy/5 shadow-sm"
        >
          <RefreshCw size={16} aria-hidden="true" />
          <span>Refresh Status</span>
        </button>

        <Link
          to="/"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-navy/20 px-6 py-3 font-sans text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
        >
          Return to Homepage
        </Link>
      </div>

      <p className="mt-6 font-sans text-xs text-muted">
        Your registration details are safely preserved under reference{' '}
        <strong className="font-mono text-navy">{reference}</strong>. You can return to this page
        anytime without filling out the registration form again.
      </p>
    </div>
  )
}

/**
 * Cancelled Registration State.
 */
function CancelledPanel({ reference }) {
  return (
    <div className="surface p-6 sm:p-10 text-center animate-fade-in">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-amber-100 text-amber-800">
        <AlertCircle size={44} aria-hidden="true" />
      </div>
      <p className="eyebrow mt-5 text-amber-800 font-bold uppercase tracking-wider">Cancelled</p>
      <h1 className="display mt-2 text-2xl sm:text-3xl text-navy">
        This Registration is Inactive
      </h1>
      <p className="mx-auto mt-3 max-w-md font-sans text-base text-muted">
        Registration reference <strong className="font-mono text-navy">{reference}</strong> has
        been cancelled or replaced. Please start a new registration to participate.
      </p>
      <div className="mt-8">
        <Link
          to="/registration"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-8 py-3 font-sans text-sm font-semibold text-white hover:bg-navy-mid transition-colors shadow-sm"
        >
          Choose a Category &amp; Register
        </Link>
      </div>
    </div>
  )
}

/**
 * Registration Not Found (404) State.
 */
function MissingPanel({ reference }) {
  return (
    <div className="surface p-6 sm:p-10 text-center animate-fade-in">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-amber-100 text-amber-800">
        <SearchX size={44} aria-hidden="true" />
      </div>
      <p className="eyebrow mt-5 text-amber-800 font-bold tracking-wider uppercase">Not Found</p>
      <h1 className="display mt-2 text-2xl sm:text-3xl text-navy">
        No Registration Found
      </h1>
      <p className="mx-auto mt-3 max-w-md font-sans text-base text-muted">
        We could not find any active booking under reference{' '}
        <strong className="font-mono text-navy">{reference || 'provided'}</strong>. Please check the
        code or register for the contest below.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/registration"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-8 py-3 font-sans text-sm font-semibold text-white hover:bg-navy-mid transition-colors shadow-sm"
        >
          Start New Registration
        </Link>
        <Link
          to="/"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-navy/20 px-6 py-3 font-sans text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
        >
          Event Home
        </Link>
      </div>
    </div>
  )
}

/**
 * Recoverable Error State.
 */
function ErrorPanel({ error, onRetry }) {
  return (
    <div className="surface p-6 sm:p-10 text-center animate-fade-in">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-red-100 text-red-800">
        <AlertCircle size={44} aria-hidden="true" />
      </div>
      <p className="eyebrow mt-5 text-red-800 font-bold tracking-wider uppercase">Connection Error</p>
      <h1 className="display mt-2 text-2xl sm:text-3xl text-navy">
        Could Not Check Registration
      </h1>
      <p className="mx-auto mt-3 max-w-md font-sans text-base text-muted">
        {error || 'Something went wrong while connecting to the server.'} Your registration is not
        affected.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-8 py-3 font-sans text-sm font-semibold text-white hover:bg-navy-mid transition-colors shadow-sm"
        >
          <RefreshCw size={16} aria-hidden="true" />
          <span>Try Again</span>
        </button>
        <Link
          to="/"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-navy/20 px-6 py-3 font-sans text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  )
}

/**
 * Organiser Support Contacts.
 */
function OrganiserContacts() {
  return (
    <div className="no-print mt-10 text-center font-sans text-xs text-muted">
      <p className="flex items-center justify-center gap-1.5">
        <PhoneCall size={13} aria-hidden="true" className="text-gold-dim" />
        <span>Need assistance with your booking? Contact the organisers:</span>
      </p>
      <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {event.contacts.map((c) => (
          <span key={c.name}>
            <a href={`tel:${c.tel}`} className="font-semibold text-navy underline hover:text-gold-dim">
              {c.name}: {c.phone}
            </a>
          </span>
        ))}
      </p>
    </div>
  )
}

/**
 * Coupon application / removal widget for registrations awaiting payment.
 */
function CouponBookingSection({ reference, registration, onUpdated }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const hasCoupon = Boolean(registration.couponCode)

  async function handleApply(e) {
    e?.preventDefault()
    setError(null)
    const err = validateCouponCode(code)
    if (err) {
      setError(err)
      return
    }

    setLoading(true)
    try {
      await api.applyCoupon(reference, { code: code.trim().toUpperCase() })
      setCode('')
      setOpen(false)
      onUpdated()
    } catch (err) {
      setError(err.message || 'Failed to apply coupon')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    setLoading(true)
    try {
      await api.removeCoupon(reference)
      onUpdated()
    } catch (err) {
      setError(err.message || 'Failed to remove coupon')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 border-t border-navy/10 pt-3">
      {hasCoupon ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900 border border-emerald-200">
          <div className="flex items-center gap-1.5">
            <TicketPercent size={14} className="text-emerald-700" />
            <span className="font-mono font-bold tracking-wider">{registration.couponCode}</span>
            {registration.discountPaise > 0 && (
              <span className="font-semibold text-emerald-800">
                (-₹{registration.discountPaise / 100})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="text-red-700 hover:text-red-900 underline font-semibold disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold-dim transition-colors cursor-pointer"
          >
            <TicketPercent size={13} className="text-gold-dim" />
            <span>Apply promo or discount code</span>
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {open && (
            <div className="mt-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    if (error) setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleApply()
                    }
                  }}
                  placeholder="PROMO CODE"
                  className="min-h-9 flex-1 rounded-lg border border-navy/20 bg-white px-2.5 font-mono text-xs uppercase tracking-wider text-navy focus:border-navy focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={loading || !code.trim()}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg bg-navy px-3.5 font-sans text-xs font-semibold text-white hover:bg-navy-mid disabled:opacity-60 cursor-pointer"
                >
                  {loading ? <Loader2 size={13} className="animate-spin text-gold" /> : 'Apply'}
                </button>
              </div>
              {error && (
                <p className="mt-1 text-[0.6875rem] font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} className="shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
