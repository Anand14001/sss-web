import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  X
} from 'lucide-react'
import { occupations, formatFee } from '../data/event'
import { validateRegistration, validateCouponCode, FIELD_ORDER } from '../utils/validation'
import { api } from '../utils/api'
import {
  readPendingRegistration,
  savePendingRegistration,
} from '../utils/pendingRegistration'
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
 * Registration Form Component.
 *
 * Handles participant details collection and client-side validation.
 * On submission, creates the registration via the backend API, persists
 * the pending reference for recovery, and immediately redirects the visitor
 * to their dedicated canonical booking page (/booking/:reference).
 *
 * Booking status, payment gateway interaction, receipts, and confirmations
 * are exclusively owned by the canonical booking page.
 */
export default function RegistrationForm({ category }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Coupon state
  const [couponOpen, setCouponOpen] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState(null)
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  // An entry created on a previous visit that was never paid for.
  const [resumable] = useState(() => readPendingRegistration())

  const formRef = useRef(null)
  const prevCategorySlugRef = useRef(category.slug)

  // Re-validate coupon when category changes
  useEffect(() => {
    if (prevCategorySlugRef.current === category.slug) return
    prevCategorySlugRef.current = category.slug

    if (!appliedCoupon) return
    let active = true

    ;(async () => {
      try {
        const res = await api.validateCoupon({
          code: appliedCoupon.code,
          category: category.slug,
          categorySlug: category.slug,
          email: values.email?.trim() || undefined
        })
        if (!active) return
        if (res.valid) {
          const couponMeta = res.coupon || {}
          const quoteMeta = res.quote || {}
          setAppliedCoupon({
            ...couponMeta,
            ...quoteMeta,
            code: couponMeta.displayCode || couponMeta.code || quoteMeta.code || appliedCoupon.code,
            discountValue: couponMeta.discountValue ?? quoteMeta.discountValue ?? appliedCoupon.discountValue,
            discountType: couponMeta.discountType || quoteMeta.discountType || appliedCoupon.discountType || 'PERCENTAGE',
            isFree: Boolean(res.isFree || couponMeta.isFree || quoteMeta.isFree || quoteMeta.payableAmountPaise === 0)
          })
          setCouponError(null)
        } else {
          setAppliedCoupon(null)
          setCouponError(
            `Coupon ${appliedCoupon.code} is not valid for ${category.name} (${res.error || res.message || 'category mismatch'}).`
          )
        }
      } catch {
        if (!active) return
        setAppliedCoupon(null)
        setCouponError('Could not verify coupon for new category.')
      }
    })()

    return () => {
      active = false
    }
  }, [category.slug, category.name, appliedCoupon, values.email])

  async function handleApplyCoupon(e) {
    e?.preventDefault()
    setCouponError(null)
    const err = validateCouponCode(couponInput)
    if (err) {
      setCouponError(err)
      return
    }

    setCouponLoading(true)
    try {
      const res = await api.validateCoupon({
        code: couponInput.trim(),
        category: category.slug,
        categorySlug: category.slug,
        email: values.email?.trim() || undefined
      })
      if (res.valid) {
        const couponMeta = res.coupon || {}
        const quoteMeta = res.quote || {}
        setAppliedCoupon({
          ...couponMeta,
          ...quoteMeta,
          code: couponMeta.displayCode || couponMeta.code || quoteMeta.code || couponInput.trim().toUpperCase(),
          discountValue: couponMeta.discountValue ?? quoteMeta.discountValue,
          discountType: couponMeta.discountType || quoteMeta.discountType || 'PERCENTAGE',
          isFree: Boolean(res.isFree || couponMeta.isFree || quoteMeta.isFree || quoteMeta.payableAmountPaise === 0)
        })
        setCouponError(null)
      } else {
        setAppliedCoupon(null)
        setCouponError(res.error || res.message || 'Invalid or ineligible coupon code')
      }
    } catch (err) {
      setAppliedCoupon(null)
      setCouponError(err.message || 'Failed to check coupon code')
    } finally {
      setCouponLoading(false)
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError(null)
  }

  const setValue = (name) => (value) => {
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const { [name]: _cleared, ...rest } = prev
      return rest
    })
    if (serverError) setServerError(null)
  }

  const set = (name) => (e) => setValue(name)(e.target.value)

  /**
   * Form submission: validates inputs and calls backend to create registration & order.
   * Upon success, redirects immediately to /booking/:reference.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

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
    setIsSubmitting(true)

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
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      }

      const res = await api.createRegistration(payload)

      // 3. Persist pending registration reference so an abandoned or closed tab can be resumed
      if (!res.freeRegistration) {
        savePendingRegistration({
          reference: res.registration.reference,
          categorySlug: category.slug,
          fullName: res.registration.fullName,
        })
      }

      // 4. Immediately redirect to dedicated booking page
      navigate(`/booking/${res.registration.reference}`, {
        state: {
          autoOpenCheckout: !res.freeRegistration && Boolean(res.order),
          order: res.order,
          freeRegistration: Boolean(res.freeRegistration),
        },
      })
    } catch (err) {
      setIsSubmitting(false)
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

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="surface p-5 sm:p-8 lg:p-10 relative">
      {/* Prompt for unfinished registration from a prior session */}
      {resumable && (
        <div className="mb-6 flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="min-w-0 flex-1 font-sans text-sm">
            <p className="font-bold">You have an unfinished registration</p>
            <p className="mt-1 text-amber-900/90">
              {resumable.fullName ? `${resumable.fullName} — ` : ''}
              reference <strong className="font-mono">{resumable.reference}</strong> was created but
              payment was not completed.
            </p>
            <Link
              to={`/booking/${resumable.reference}`}
              className="mt-2 inline-flex min-h-9 items-center gap-1.5 font-semibold text-navy underline underline-offset-2 hover:text-gold-dim"
            >
              Finish paying for it &rarr;
            </Link>
          </div>
        </div>
      )}

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

      <fieldset className="m-0 border-0 p-0" disabled={isSubmitting}>
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

          {/* 4 — set by the category route */}
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
                  Set by the category you selected. Use “Choose another category” to change it.
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
            hint={`Must be ${category.ageRange} on contest date.`}
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

        {/* Coupon Code Disclosure & Input */}
        <div className="mt-6 border-t border-navy/10 pt-5">
          {!appliedCoupon ? (
            <div>
              <button
                type="button"
                onClick={() => setCouponOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold-dim transition-colors cursor-pointer"
              >
                <TicketPercent size={16} className="text-gold-dim" />
                <span>Have a coupon code?</span>
                {couponOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {couponOpen && (
                <div className="mt-3 max-w-md">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase())
                        if (couponError) setCouponError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleApplyCoupon()
                        }
                      }}
                      placeholder="ENTER PROMO CODE"
                      className="min-h-11 flex-1 rounded-xl border border-navy/20 bg-white px-3.5 font-mono text-sm tracking-wider uppercase text-navy placeholder:text-muted/60 focus:border-navy focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-navy px-5 font-sans text-sm font-semibold text-white transition-colors hover:bg-navy-mid disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {couponLoading ? (
                        <Loader2 size={15} className="animate-spin text-gold" />
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-700 shrink-0" />
                <span className="font-mono text-sm font-bold tracking-wider">{appliedCoupon.code}</span>
                <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  {appliedCoupon.isFree
                    ? '100% Free'
                    : appliedCoupon.discountType === 'FLAT'
                      ? `₹${appliedCoupon.discountValue} OFF`
                      : `${appliedCoupon.discountValue ?? (appliedCoupon.baseAmountPaise ? Math.round(((appliedCoupon.discountPaise || 0) / appliedCoupon.baseAmountPaise) * 100) : '')}% OFF`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2 cursor-pointer"
              >
                <X size={13} />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>

        {/* Fee Summary */}
        <div className="surface-sunken mt-6 rounded-2xl border border-navy/10 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-muted">Contest Category</span>
            <span className="font-sans text-xs font-bold text-navy">
              {category.name} ({category.ageRange})
            </span>
          </div>

          {appliedCoupon ? (
            <div className="mt-3 space-y-2 border-t border-navy/10 pt-3">
              <div className="flex justify-between font-sans text-sm">
                <span className="text-muted">Standard entry fee</span>
                <span className="font-mono text-navy">{formatFee(category.fee)}</span>
              </div>
              <div className="flex justify-between font-sans text-sm font-semibold text-emerald-700">
                <span className="flex items-center gap-1">
                  <span>Coupon discount ({appliedCoupon.code})</span>
                  {appliedCoupon.isFree && <Sparkles size={13} />}
                </span>
                <span className="font-mono">
                  -₹{((appliedCoupon.discountPaise || 0) / 100).toFixed((appliedCoupon.discountPaise || 0) % 100 === 0 ? 0 : 2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-navy/10 pt-2.5">
                <div>
                  <span className="font-sans text-sm font-bold text-navy">Total Payable</span>
                  {appliedCoupon.isFree && (
                    <span className="block text-[0.6875rem] font-semibold text-emerald-700">
                      Payment gateway bypassed (Complimentary free entry)
                    </span>
                  )}
                </div>
                <span className="meta-value text-2xl font-black text-navy sm:text-3xl">
                  {appliedCoupon.isFree
                    ? '₹0'
                    : `₹${((appliedCoupon.payableAmountPaise || 0) / 100).toFixed((appliedCoupon.payableAmountPaise || 0) % 100 === 0 ? 0 : 2)}`}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-baseline justify-between border-t border-navy/10 pt-3">
              <div>
                <p className="eyebrow text-[0.6875rem] text-muted">Total Payable Fee</p>
                <p className="text-[0.6875rem] text-muted mt-0.5">One-time entry fee</p>
              </div>
              <p className="meta-value text-[2.25rem] leading-none text-navy">{formatFee(category.fee)}</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-navy px-8 py-4 font-sans text-base font-semibold text-white shadow-[0_12px_30px_-16px_rgba(16,46,82,0.95)] transition-[background-color,transform,box-shadow] duration-300 ease-out hover:bg-navy-mid hover:shadow-[0_16px_34px_-16px_rgba(16,46,82,1)] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin text-gold" />
              <span>Creating Registration...</span>
            </>
          ) : appliedCoupon?.isFree ? (
            <>
              <Sparkles size={18} className="text-gold" />
              <span>Complete Free Registration · ₹0</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} className="text-gold" />
              <span>
                Proceed to Booking &amp; Payment ·{' '}
                {appliedCoupon
                  ? `₹${((appliedCoupon.payableAmountPaise || 0) / 100).toFixed((appliedCoupon.payableAmountPaise || 0) % 100 === 0 ? 0 : 2)}`
                  : formatFee(category.fee)}
              </span>
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
