import { useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import { occupations, event, formatFee } from '../data/event'
import { validateRegistration, FIELD_ORDER } from '../utils/validation'
import Field from './Field'
import Select from './Select'
import DateField from './DateField'

/** The seven official fields, in the order the organisers' form lists them. */
const EMPTY = {
  fullName: '',
  email: '',
  phone: '',
  dob: '',
  occupation: '',
  city: '',
}

/** Today, as yyyy-mm-dd — the latest date of birth the picker will offer. */
const todayIso = () => new Date().toISOString().slice(0, 10)

/**
 * The registration form for one category.
 *
 * The category is fixed by the route and shown read-only: a participant on
 * /registration/kid cannot accidentally submit as an adult. Changing category
 * means going back to the chooser, which is what the back link is for.
 */
export default function RegistrationForm({ category }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  // idle | checking | checked — never "submitted": nothing is submitted anywhere.
  const [status, setStatus] = useState('idle')
  const formRef = useRef(null)

  const setValue = (name) => (value) => {
    setValues((v) => ({ ...v, [name]: value }))
    // Clear a field's error as soon as the user starts correcting it. Other
    // fields keep both their values and their errors.
    setErrors((prev) => {
      if (!prev[name]) return prev
      const { [name]: _cleared, ...rest } = prev
      return rest
    })
    if (status === 'checked') setStatus('idle')
  }

  const set = (name) => (e) => setValue(name)(e.target.value)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (status === 'checking') return // no double submits

    // Trim on submit, not on change — trimming mid-typing stops people typing
    // the space between their names.
    const trimmed = {
      ...values,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      city: values.city.trim(),
    }
    setValues(trimmed)

    const found = validateRegistration(trimmed, category)
    setErrors(found)

    const firstBad = FIELD_ORDER.find((f) => found[f])
    if (firstBad) {
      setStatus('idle')
      formRef.current?.querySelector(`[name="${firstBad}"]`)?.focus()
      return
    }

    // No backend exists, so there is nowhere to send this. The form confirms the
    // details are complete and consistent, and says plainly that registration
    // itself still happens through the organisers. It must never report success.
    setStatus('checked')
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="surface p-5 sm:p-8 lg:p-10">
      <fieldset className="m-0 border-0 p-0" disabled={status === 'checking'}>
        <legend className="sr-only">Participant details — {category.routeTitle}</legend>

        <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
          {/* 1 */}
          <Field id="fullName" label="Full Name" required error={errors.fullName} className="sm:col-span-2">
            {(p) => (
              <input
                {...p}
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
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
                placeholder="Enter your phone number"
                value={values.phone}
                onChange={set('phone')}
              />
            )}
          </Field>

          {/* 4 — set by the route, so it is shown rather than asked. `readOnly`
              instead of `disabled` keeps it in the tab order and readable to a
              screen reader; the padlock says why it cannot be edited. */}
          <Field id="ageCategory" label="Age Category" required composite>
            {(p) => (
              <div className={`${p.className} flex items-center gap-3 px-4 py-3`}>
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
        </div>

        {/* Fee for this category, read from the one config. */}
        <div className="surface-sunken mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:mt-8 sm:px-6 sm:py-5">
          <div>
            <p className="eyebrow text-[0.6875rem] text-muted">Registration fee</p>
            <p className="mt-1.5 font-sans text-sm text-navy/75">
              {category.name} · {category.ageRange}
            </p>
          </div>
          <p className="meta-value text-[2.5rem] leading-none text-navy">{formatFee(category.fee)}</p>
        </div>

        <button
          type="submit"
          className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full bg-navy px-8 py-4 font-sans text-base font-semibold text-white shadow-[0_12px_30px_-16px_rgba(16,46,82,0.95)] transition-[background-color,transform,box-shadow] duration-300 ease-out hover:bg-navy-mid hover:shadow-[0_16px_34px_-16px_rgba(16,46,82,1)] active:scale-[0.99] disabled:opacity-70"
        >
          Complete Registration
        </button>
      </fieldset>

      {/* Live region, so the outcome is announced and not only seen. */}
      <div aria-live="polite" className="empty:hidden">
        {status === 'checked' && (
          <div className="surface-sunken mt-6 border-l-4 border-gold p-5">
            <p className="font-sans text-sm font-semibold text-navy">
              Your details are complete — but this form cannot submit them yet.
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
              Online registration for {event.name} is not connected on this website yet, so
              nothing has been sent, saved or paid. To take your place in {category.name},
              call{' '}
              {event.contacts.map((c, i) => (
                <span key={c.name}>
                  {i > 0 && ' or '}
                  {c.name} on{' '}
                  <a
                    href={`tel:${c.tel}`}
                    className="font-semibold text-navy underline underline-offset-2"
                  >
                    {c.phone}
                  </a>
                </span>
              ))}
              , and they will confirm your place and explain how to pay the{' '}
              {formatFee(category.fee)} fee.
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
              Keep this page open — your answers are still in the fields above, ready to read
              out.
            </p>
          </div>
        )}
      </div>
    </form>
  )
}
