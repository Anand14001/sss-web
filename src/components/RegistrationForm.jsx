import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Lock,
  Loader2,
  Printer,
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import { occupations, event, formatFee } from '../data/event'
import { validateRegistration, FIELD_ORDER } from '../utils/validation'
import { api, loadRazorpayCheckout } from '../utils/api'
import Field from './Field'
import Select from './Select'
import DateField from './DateField'

const EMPTY = {
  fullName: '',
  email: '',
  phone: '',
  dob: '',
  occupation: '',
  city: '',
  guardianName: '',
  guardianPhone: '',
}

const todayIso = () => new Date().toISOString().slice(0, 10)

/**
 * Production-ready Registration Form with real backend API & Razorpay Checkout.
 */
export default function RegistrationForm({ category }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  
  // States: 'idle' | 'submitting' | 'checkout' | 'verifying' | 'polling' | 'confirmed' | 'failed'
  const [status, setStatus] = useState('idle')
  
  // Registration and payment confirmation details
  const [confirmedData, setConfirmedData] = useState(null)
  const [failureReason, setFailureReason] = useState(null)
  const [currentReference, setCurrentReference] = useState(null)
  const [copied, setCopied] = useState(false)

  const formRef = useRef(null)

  const setValue = (name) => (value) => {
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const { [name]: _cleared, ...rest } = prev
      return rest
    })
    if (serverError) setServerError(null)
    if (status === 'failed') setStatus('idle')
  }

  const set = (name) => (e) => setValue(name)(e.target.value)

  const handleCopyReference = () => {
    if (!confirmedData?.reference) return
    navigator.clipboard.writeText(confirmedData.reference).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  /**
   * Polls the backend status endpoint up to maxAttempts if verification takes time.
   */
  const pollPaymentStatus = async (reference, maxAttempts = 6) => {
    setStatus('polling')
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await new Promise((res) => setTimeout(res, 2500))
        const res = await api.getRegistrationStatus(reference)
        if (res.registration && res.registration.status === 'PAID') {
          setConfirmedData({
            reference: res.registration.reference,
            fullName: res.registration.fullName,
            category: category.name,
            amount: res.registration.amountRupees,
            paymentId: res.registration.orderId || 'Verified'
          })
          setStatus('confirmed')
          return
        }
      } catch {
        // continue polling
      }
    }
    // If polling expired, show pending guidance
    setFailureReason('Payment verification is taking longer than usual. Please check your email or contact support with your registration reference.')
    setStatus('failed')
  }

  /**
   * Launches Razorpay Checkout modal with the server-created order.
   */
  const launchRazorpayModal = async (registration, order) => {
    try {
      setStatus('checkout')
      const Razorpay = await loadRazorpayCheckout()

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: event.name,
        description: `${category.name} Registration (${category.ageRange})`,
        image: '/images/title-logo.png',
        order_id: order.id,
        prefill: {
          name: values.fullName,
          email: values.email,
          contact: values.phone,
        },
        theme: {
          color: '#102E52',
        },
        modal: {
          ondismiss: () => {
            if (status !== 'confirmed') {
              setStatus('failed')
              setFailureReason('Payment window was closed before completion. You can retry to confirm your entry.')
            }
          },
        },
        handler: async (response) => {
          setStatus('verifying')
          try {
            const verifyRes = await api.verifyPayment({
              registrationReference: registration.reference,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            if (verifyRes.success) {
              setConfirmedData({
                reference: verifyRes.registration.reference,
                fullName: verifyRes.registration.fullName,
                category: category.name,
                amount: verifyRes.registration.amountRupees,
                paymentId: response.razorpay_payment_id,
              })
              setStatus('confirmed')
            } else {
              throw new Error('Payment verification returned unconfirmed status.')
            }
          } catch (err) {
            console.error('Payment verification failed:', err)
            // Attempt bounded polling in case webhook confirmed it
            await pollPaymentStatus(registration.reference)
          }
        },
      }

      const rzpInstance = new Razorpay(options)
      rzpInstance.on('payment.failed', (resp) => {
        setStatus('failed')
        setFailureReason(resp.error?.description || 'Payment was unsuccessful.')
      })
      rzpInstance.open()
    } catch (err) {
      setStatus('failed')
      setFailureReason(err.message || 'Failed to initialize payment gateway.')
    }
  }

  /**
   * Form submission: validates inputs and calls backend to create registration & order.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'submitting' || status === 'checkout' || status === 'verifying') return

    const trimmed = {
      ...values,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      city: values.city.trim(),
      guardianName: values.guardianName.trim(),
      guardianPhone: values.guardianPhone.trim(),
    }
    setValues(trimmed)

    // 1. Client-side UX validation
    const found = validateRegistration(trimmed, category)
    setErrors(found)

    const firstBad = FIELD_ORDER.find((f) => found[f])
    if (firstBad) {
      formRef.current?.querySelector(`[name="${firstBad}"]`)?.focus()
      return
    }

    setServerError(null)
    setStatus('submitting')

    try {
      // 2. Submit to backend API
      const payload = {
        fullName: trimmed.fullName,
        email: trimmed.email,
        phone: trimmed.phone,
        dob: trimmed.dob,
        category: category.slug,
        occupation: trimmed.occupation,
        city: trimmed.city,
        guardianName: trimmed.guardianName || undefined,
        guardianPhone: trimmed.guardianPhone || undefined,
      }

      const res = await api.createRegistration(payload)
      setCurrentReference(res.registration.reference)

      // 3. Launch Razorpay modal with server order
      await launchRazorpayModal(res.registration, res.order)
    } catch (err) {
      setStatus('idle')
      if (err.details) {
        setErrors(err.details)
        const firstServerBad = FIELD_ORDER.find((f) => err.details[f])
        if (firstServerBad) {
          formRef.current?.querySelector(`[name="${firstServerBad}"]`)?.focus()
        }
      } else {
        setServerError(err.message || 'An error occurred while creating your registration.')
      }
    }
  }

  /**
   * Retry payment for an existing reference without re-entering form data.
   */
  const handleRetryPayment = async () => {
    if (!currentReference) {
      setStatus('idle')
      return
    }

    setStatus('submitting')
    setServerError(null)

    try {
      const res = await api.retryPayment(currentReference)
      if (res.alreadyPaid) {
        setConfirmedData({
          reference: currentReference,
          fullName: values.fullName,
          category: category.name,
          amount: category.fee,
        })
        setStatus('confirmed')
        return
      }

      await launchRazorpayModal({ reference: currentReference }, res.order)
    } catch (err) {
      setStatus('failed')
      setFailureReason(err.message || 'Unable to retry payment. Please try again.')
    }
  }

  // --------------------------------------------------------------------------
  // 1. CONFIRMED SUCCESS STATE
  // --------------------------------------------------------------------------
  if (status === 'confirmed' && confirmedData) {
    return (
      <div className="surface p-6 sm:p-10 lg:p-12 text-center animate-fade-in">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-800">
          <CheckCircle2 size={44} aria-hidden="true" />
        </div>

        <p className="eyebrow mt-5 text-emerald-800 font-bold uppercase tracking-wider">
          Payment Verified
        </p>
        <h2 className="display mt-2 text-2xl sm:text-4xl text-navy">
          Registration Confirmed!
        </h2>
        <p className="mt-3 font-sans text-base text-muted max-w-lg mx-auto">
          Thank you, <strong>{confirmedData.fullName || values.fullName}</strong>. You are officially
          registered for <strong>{event.name}</strong>.
        </p>

        {/* Reference Badge */}
        <div className="surface-sunken my-8 mx-auto max-w-md rounded-2xl p-6 border border-gold/40 text-left">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-xs text-gold-dim">Registration Reference</p>
              <p className="meta-value mt-1 text-2xl sm:text-3xl font-extrabold text-navy tracking-wide">
                {confirmedData.reference}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyReference}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy/10 hover:bg-navy/20 px-3.5 py-2 font-sans text-xs font-semibold text-navy transition-colors"
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

          <div className="mt-5 pt-4 border-t border-navy/10 grid grid-cols-2 gap-4 text-sm font-sans">
            <div>
              <span className="text-muted block text-xs">Category</span>
              <span className="font-semibold text-navy mt-0.5 block">{category.name}</span>
            </div>
            <div>
              <span className="text-muted block text-xs">Amount Paid</span>
              <span className="font-bold text-navy mt-0.5 block">{formatFee(category.fee)}</span>
            </div>
            {confirmedData.paymentId && (
              <div className="col-span-2">
                <span className="text-muted block text-xs">Transaction ID</span>
                <span className="font-mono text-xs text-navy/70 mt-0.5 block break-all">
                  {confirmedData.paymentId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Important Info Card */}
        <div className="surface-sunken mx-auto max-w-md rounded-xl p-5 text-left mb-8 space-y-3 font-sans text-sm text-navy/85">
          <p className="flex items-start gap-2.5">
            <Check size={18} className="text-emerald-700 shrink-0 mt-0.5" />
            <span>
              A confirmation email has been sent to <strong>{values.email}</strong>.
            </span>
          </p>
          <p className="flex items-start gap-2.5">
            <Check size={18} className="text-emerald-700 shrink-0 mt-0.5" />
            <span>
              <strong>Event Date:</strong> {event.date.display} at {event.venue.name}.
            </span>
          </p>
          <p className="flex items-start gap-2.5">
            <Check size={18} className="text-emerald-700 shrink-0 mt-0.5" />
            <span>
              Hall allocation and reporting schedule will be sent to registered participants prior to contest day.
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-navy/20 bg-white px-6 py-3 font-sans text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
          >
            <Printer size={16} />
            Print / Save Receipt
          </button>

          <Link
            to="/"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-8 py-3 font-sans text-sm font-semibold text-white hover:bg-navy-mid transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // 2. PAYMENT FAILED / CANCELLED STATE
  // --------------------------------------------------------------------------
  if (status === 'failed') {
    return (
      <div className="surface p-6 sm:p-10 lg:p-12 text-center animate-fade-in">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-amber-100 text-amber-800">
          <AlertCircle size={44} aria-hidden="true" />
        </div>

        <p className="eyebrow mt-5 text-amber-800 font-bold uppercase tracking-wider">
          Payment Not Completed
        </p>
        <h2 className="display mt-2 text-2xl sm:text-3xl text-navy">
          Checkout Incomplete
        </h2>
        <p className="mt-3 font-sans text-base text-muted max-w-lg mx-auto">
          {failureReason ||
            'The payment was not completed or was cancelled. Your registration details are saved.'}
        </p>

        {currentReference && (
          <div className="surface-sunken my-6 mx-auto max-w-sm rounded-xl p-4 border border-amber-200 text-left font-sans text-sm">
            <span className="text-muted text-xs block">Reference ID</span>
            <span className="font-bold text-navy text-lg block">{currentReference}</span>
            <span className="text-xs text-muted block mt-1">
              Category: {category.name} ({formatFee(category.fee)})
            </span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleRetryPayment}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-navy px-8 py-3 font-sans text-sm font-semibold text-white hover:bg-navy-mid transition-colors"
          >
            <RefreshCw size={16} />
            Retry Payment ({formatFee(category.fee)})
          </button>

          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-navy/20 px-6 py-3 font-sans text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
          >
            Edit Details
          </button>
        </div>

        <p className="mt-8 font-sans text-xs text-muted">
          Need help? Contact the organisers:{' '}
          {event.contacts.map((c, i) => (
            <span key={c.name}>
              {i > 0 && ' or '}
              <a href={`tel:${c.tel}`} className="font-semibold text-navy underline">
                {c.name} ({c.phone})
              </a>
            </span>
          ))}
        </p>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // 3. EDITABLE FORM VIEW
  // --------------------------------------------------------------------------
  const isBusy = status === 'submitting' || status === 'checkout' || status === 'verifying' || status === 'polling'

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="surface p-5 sm:p-8 lg:p-10 relative">
      {serverError && (
        <div
          role="alert"
          className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-red-900 flex items-start gap-3"
        >
          <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
          <div className="font-sans text-sm">
            <p className="font-bold">Unable to proceed with registration</p>
            <p className="mt-1 text-red-800/90">{serverError}</p>
          </div>
        </div>
      )}

      <fieldset className="m-0 border-0 p-0" disabled={isBusy}>
        <legend className="sr-only">Participant details — {category.routeTitle}</legend>

        <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
          {/* 1 */}
          <Field id="fullName" label="Full Name" required error={errors.fullName} className="sm:col-span-2">
            {(p) => (
              <input
                {...p}
                type="text"
                autoComplete="name"
                placeholder="Enter participant’s full name"
                value={values.fullName}
                onChange={set('fullName')}
              />
            )}
          </Field>

          {/* 2 */}
          <Field id="email" label="Email Address" required error={errors.email}>
            {(p) => (
              <input
                {...p}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={set('email')}
              />
            )}
          </Field>

          {/* 3 */}
          <Field id="phone" label="Phone Number" required error={errors.phone}>
            {(p) => (
              <input
                {...p}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={values.phone}
                onChange={set('phone')}
              />
            )}
          </Field>

          {/* 4 — set by the route */}
          <Field id="ageCategory" label="Age Category" required composite>
            {(p) => (
              <div className={`${p.className} flex items-center gap-3 px-4 py-3 bg-navy/[0.02]`}>
                <input
                  {...p}
                  type="text"
                  readOnly
                  value={category.formLabel}
                  aria-describedby={`${p.id}-locked`}
                  className="min-h-10 min-w-0 flex-1 cursor-default bg-transparent font-sans text-base font-semibold text-navy focus:outline-none"
                />
                <Lock size={15} aria-hidden="true" className="shrink-0 text-muted" />
                <span id={`${p.id}-locked`} className="sr-only">
                  Set by the page you are on. Use “Choose another category” to change it.
                </span>
              </div>
            )}
          </Field>

          {/* 5 */}
          <Field
            id="dob"
            label="Date of Birth (DD / MM / YYYY)"
            required
            composite
            error={errors.dob}
            hint={`Must be ${category.ageRange} on ${event.date.display}.`}
          >
            {(p) => (
              <DateField {...p} value={values.dob} onChange={setValue('dob')} max={todayIso()} />
            )}
          </Field>

          {/* 6 */}
          <Field id="occupation" label="Occupation" required error={errors.occupation}>
            {(p) => (
              <Select
                {...p}
                value={values.occupation}
                onChange={setValue('occupation')}
                placeholder="Choose your occupation"
                options={occupations.map((o) => ({ value: o, label: o }))}
              />
            )}
          </Field>

          {/* 7 */}
          <Field id="city" label="City / Town" required error={errors.city}>
            {(p) => (
              <input
                {...p}
                type="text"
                autoComplete="address-level2"
                placeholder="Enter your city or town"
                value={values.city}
                onChange={set('city')}
              />
            )}
          </Field>

          {/* Guardian Info for Minors */}
          {category.max < 18 && (
            <>
              <div className="sm:col-span-2 pt-2 border-t border-navy/10">
                <p className="eyebrow text-xs text-gold-dim">Parent or Guardian Details (Optional)</p>
              </div>

              <Field id="guardianName" label="Parent / Guardian Name" error={errors.guardianName}>
                {(p) => (
                  <input
                    {...p}
                    type="text"
                    placeholder="Enter parent or guardian's name"
                    value={values.guardianName}
                    onChange={set('guardianName')}
                  />
                )}
              </Field>

              <Field id="guardianPhone" label="Parent / Guardian Phone" error={errors.guardianPhone}>
                {(p) => (
                  <input
                    {...p}
                    type="tel"
                    inputMode="tel"
                    placeholder="Parent or guardian mobile"
                    value={values.guardianPhone}
                    onChange={set('guardianPhone')}
                  />
                )}
              </Field>
            </>
          )}
        </div>

        {/* Fee Summary */}
        <div className="surface-sunken mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 sm:mt-8 sm:px-6 sm:py-5 rounded-2xl border border-navy/10">
          <div>
            <p className="eyebrow text-[0.6875rem] text-muted">Contest Registration Fee</p>
            <p className="mt-1 font-sans text-sm text-navy/75 font-medium">
              {category.name} · {category.ageRange}
            </p>
          </div>
          <div className="text-right">
            <p className="meta-value text-[2.25rem] leading-none text-navy">{formatFee(category.fee)}</p>
            <p className="text-[0.6875rem] text-muted mt-1">One-time entry fee</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isBusy}
          className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-navy px-8 py-4 font-sans text-base font-semibold text-white shadow-[0_12px_30px_-16px_rgba(16,46,82,0.95)] transition-[background-color,transform,box-shadow] duration-300 ease-out hover:bg-navy-mid hover:shadow-[0_16px_34px_-16px_rgba(16,46,82,1)] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {status === 'submitting' && (
            <>
              <Loader2 size={18} className="animate-spin text-gold" />
              <span>Preparing Payment...</span>
            </>
          )}
          {status === 'checkout' && (
            <>
              <Loader2 size={18} className="animate-spin text-gold" />
              <span>Waiting for Payment in Razorpay...</span>
            </>
          )}
          {(status === 'verifying' || status === 'polling') && (
            <>
              <Loader2 size={18} className="animate-spin text-gold" />
              <span>Confirming Payment with Gateway...</span>
            </>
          )}
          {status === 'idle' && (
            <>
              <ShieldCheck size={18} className="text-gold" />
              <span>Pay &amp; Register {formatFee(category.fee)}</span>
            </>
          )}
        </button>

        <p className="mt-4 text-center font-sans text-xs text-muted flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-navy/50" />
          <span>Secured by 256-bit SSL encryption &amp; Razorpay payment gateway</span>
        </p>
      </fieldset>
    </form>
  )
}
