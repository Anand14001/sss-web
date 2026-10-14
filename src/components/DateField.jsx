import { useCallback, useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import Calendar from './Calendar'
import { useDismissable } from '../hooks/useDismissable'

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** ISO to the DD/MM/YYYY the field shows. Anything else is already display text. */
const toDisplay = (value) => {
  if (!value) return ''
  if (!ISO.test(value)) return value
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

/** Inserts the slashes as the digits arrive, and stops at eight. */
const formatTyping = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/**
 * Date of birth: a typable DD/MM/YYYY field with a calendar beside it.
 *
 * Typing is kept because it is far quicker for a birth date than clicking back
 * through a calendar, and the calendar is kept because not everyone wants to
 * type. Both write the same value.
 *
 * The value handed upwards is ISO (`yyyy-mm-dd`) once the eight digits make a
 * real date, and the raw typed text while they do not — which is what lets the
 * existing validation tell "nothing entered" apart from "not a real date".
 */
export default function DateField({
  id,
  name,
  value,
  onChange,
  max,
  className = '',
  'aria-invalid': ariaInvalid,
  'aria-describedby': describedBy,
  'aria-required': ariaRequired,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)

  const close = useCallback((returnFocus) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  useDismissable(open, rootRef, close)

  const handleTyping = (e) => {
    const display = formatTyping(e.target.value)
    const [d, m, y] = display.split('/')
    if (d?.length === 2 && m?.length === 2 && y?.length === 4) {
      const iso = `${y}-${m}-${d}`
      const date = new Date(`${iso}T00:00:00`)
      // Only promote to ISO if the parts survive the round trip — 31/02/2010
      // would otherwise roll silently into March.
      const real =
        !Number.isNaN(date.getTime()) &&
        date.getDate() === Number(d) &&
        date.getMonth() + 1 === Number(m) &&
        date.getFullYear() === Number(y)
      onChange(real ? iso : display)
      return
    }
    onChange(display)
  }

  return (
    <div ref={rootRef} className="relative">
      <div className={`${className} flex items-center gap-2 pl-4`}>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          placeholder="DD / MM / YYYY"
          maxLength={10}
          value={toDisplay(value)}
          onChange={handleTyping}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          aria-required={ariaRequired}
          className="min-w-0 flex-1 bg-transparent py-3 font-sans text-base text-navy placeholder:text-muted/60 focus:outline-none"
        />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close the calendar' : 'Choose a date from the calendar'}
          className="mr-1.5 grid size-10 shrink-0 place-items-center rounded-full text-navy/55 transition-colors duration-200 hover:bg-navy/[0.07] hover:text-navy"
        >
          <CalendarDays size={18} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-30 mt-2">
          <Calendar
            value={ISO.test(value || '') ? value : ''}
            max={max}
            labelledBy={id}
            onSelect={(iso) => {
              onChange(iso)
              close(true)
            }}
          />
        </div>
      )}
    </div>
  )
}
