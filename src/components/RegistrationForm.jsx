import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
} from 'lucide-react'
import { occupations, guardianRelationships, formatFee } from '../data/event'
import { validateRegistration, FIELD_ORDER } from '../utils/validation'
import { api } from '../utils/api'
import { clearPendingRegistration } from '../utils/pendingRegistration'
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
  guardianRelationship: '',
  guardianPhone: '',
  guardianEmail: '',
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

  // Clear any legacy unfinished registration banner state
  useEffect(() => {
    clearPendingRegistration()
  }, [])

  const formRef = useRef(null)
  const formIdempotencyRef = useRef(null)

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
      guardianRelationship: values.guardianRelationship.trim(),
      guardianPhone: values.guardianPhone.trim(),
      guardianEmail: values.guardianEmail.trim(),
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
      // 2. Submit to backend API as an application without upfront payment
      if (!formIdempotencyRef.current) {
        formIdempotencyRef.current =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `web_${Date.now()}_${Math.random()}`
      }

      const payload = {
        fullName: trimmed.fullName,
        email: trimmed.email,
        phone: trimmed.phone,
        dob: trimmed.dob,
        category: category.slug,
        occupation: trimmed.occupation,
        city: trimmed.city,
        guardianName: trimmed.guardianName || undefined,
        guardianRelationship: trimmed.guardianRelationship || undefined,
        guardianPhone: trimmed.guardianPhone || undefined,
        guardianEmail: trimmed.guardianEmail || undefined,
        idempotencyKey: formIdempotencyRef.current,
      }

      const res = await api.createApplication(payload)

      // Reset idempotency ref so a subsequent registration can be submitted
      formIdempotencyRef.current = null

      // 3. Immediately redirect to dedicated application confirmation page
      const appRef = res.application?.reference || res.registration?.reference
      navigate(`/application/confirmation/${appRef}`, {
        state: {
          application: res.application || res.registration,
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
              <div className="sm:col-span-2 pt-4 border-t border-navy/10">
                <div className="flex items-center gap-2">
                  <span className="text-gold-dim">◆</span>
                  <h3 className="font-sans text-sm font-bold tracking-tight text-navy sm:text-base">
                    Parent / Guardian Details
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Mandatory for Junior and Teen registrations. Please provide contact details of the parent or legal guardian.
                </p>
              </div>

              {/* 1. Parent/Guardian Full Name */}
              <Field
                id="guardianName"
                label="Parent / Guardian Full Name"
                required
                error={errors.guardianName}
              >
                {(p) => (
                  <input
                    {...p}
                    type="text"
                    autoComplete="name"
                    placeholder="Enter parent or guardian’s full name"
                    value={values.guardianName}
                    onChange={set('guardianName')}
                  />
                )}
              </Field>

              {/* 2. Parent/Guardian Relationship */}
              <Field
                id="guardianRelationship"
                label="Relationship to Participant"
                required
                error={errors.guardianRelationship}
              >
                {(p) => (
                  <Select
                    {...p}
                    value={values.guardianRelationship}
                    onChange={setValue('guardianRelationship')}
                    placeholder="Choose relationship"
                    options={guardianRelationships.map((r) => ({ value: r, label: r }))}
                  />
                )}
              </Field>

              {/* 3. Parent/Guardian Contact Number */}
              <Field
                id="guardianPhone"
                label="Parent / Guardian Contact Number"
                required
                error={errors.guardianPhone}
              >
                {(p) => (
                  <input
                    {...p}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="10-digit mobile number"
                    value={values.guardianPhone}
                    onChange={set('guardianPhone')}
                  />
                )}
              </Field>

              {/* 4. Parent/Guardian Email Address */}
              <Field
                id="guardianEmail"
                label="Parent / Guardian Email Address"
                required
                error={errors.guardianEmail}
              >
                {(p) => (
                  <input
                    {...p}
                    type="email"
                    autoComplete="email"
                    placeholder="parent@example.com"
                    value={values.guardianEmail}
                    onChange={set('guardianEmail')}
                  />
                )}
              </Field>
            </>
          )}
        </div>

        {/* Fee Guidance & Application Policy */}
        <div className="surface-sunken mt-6 rounded-2xl border border-navy/10 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-muted">Contest Category</span>
            <span className="font-sans text-xs font-bold text-navy">
              {category.name} ({category.ageRange})
            </span>
          </div>

          <div className="mt-3 border-t border-navy/10 pt-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="eyebrow text-[0.6875rem] text-muted">Category Entry Fee</p>
              </div>
              <p className="meta-value text-[2rem] leading-none text-navy">{formatFee(category.fee)}</p>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted">
              Submitting this form records your application in our committee review queue. An official payment invitation link will be sent to your email address only if you are shortlisted.
            </p>
          </div>
        </div>

        {/* Important Dates & Contest Rules */}
        <div className="surface-sunken mt-6 rounded-2xl border border-navy/15 bg-amber-50/40 p-5 sm:p-6 text-navy">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 pb-3">
            <h3 className="font-sans text-sm font-bold tracking-tight text-navy sm:text-base flex items-center gap-2">
              <span className="text-gold-dim">◆</span>
              <span>Important Dates &amp; Contest Rules</span>
            </h3>
            <a
              href="/Salem-Star-Speaker-Contest-Rules.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-navy underline underline-offset-2 hover:text-gold-dim"
            >
              <span>Read Full Contest Rules (PDF)</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <ul className="mt-4 space-y-2.5 font-sans text-xs leading-relaxed text-navy/90 sm:text-sm">
            <li className="flex items-start gap-2.5">
              <span className="shrink-0 text-gold-dim font-bold mt-0.5">◆</span>
              <span>
                Registration closes on <strong>26 October 2026, Monday at 23:59 hours.</strong>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="shrink-0 text-gold-dim font-bold mt-0.5">◆</span>
              <span>Prelims may be conducted online if registrations are higher.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="shrink-0 text-gold-dim font-bold mt-0.5">◆</span>
              <span>
                Only finalists will have to pay <strong className="text-navy font-bold">₹250 as registration fee.</strong>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="shrink-0 text-gold-dim font-bold mt-0.5">◆</span>
              <span>
                Online contestants&apos; briefing and speaking order will be conducted on <strong>30th October 2026, Friday, at 20:30 hours.</strong>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="shrink-0 text-gold-dim font-bold mt-0.5">◆</span>
              <span>Absent contestants shall be represented by those present as proxies.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="shrink-0 text-gold-dim font-bold mt-0.5">◆</span>
              <span>The speaking order, once fixed, shall not be changed.</span>
            </li>
          </ul>
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
              <span>Registering...</span>
            </>
          ) : (
            <span>Register Now</span>
          )}
        </button>
      </fieldset>
    </form>
  )
}
