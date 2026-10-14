import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** Evaluated once: a Date built during render makes the output unstable. */
const TODAY = new Date()

const pad = (n) => String(n).padStart(2, '0')
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const sameDay = (a, b) => a && b && toIso(a) === toIso(b)

/** Monday-first offset for the first of the month. */
const leadingBlanks = (year, month) => (new Date(year, month, 1).getDay() + 6) % 7

/**
 * Date picker panel.
 *
 * Three views — days, months, years — because this field collects a date of
 * birth. Stepping a month at a time would mean a couple of hundred clicks to
 * reach 1995, so the caption is a button that drops straight to a year grid.
 *
 * Keyboard: arrows move a day at a time, up/down a week, PageUp/PageDown a
 * month, Home/End to the ends of the week, Enter or Space to choose.
 */
export default function Calendar({ value, max, onSelect, labelledBy }) {
  const selected = value ? new Date(`${value}T00:00:00`) : null
  const maxDate = max ? new Date(`${max}T00:00:00`) : null
  const initial = selected ?? maxDate ?? TODAY

  const [view, setView] = useState('days')
  const [cursor, setCursor] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1))
  const [focusDay, setFocusDay] = useState(() => new Date(initial))
  const gridRef = useRef(null)
  const shouldFocus = useRef(false)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Year range: wide enough for any entrant, never past the maximum date.
  const lastYear = (maxDate ?? TODAY).getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => lastYear - i)

  const isDisabled = (date) => (maxDate ? date > maxDate : false)

  // Only pull focus after a keyboard move, never on open — opening should leave
  // focus where the person put it.
  useEffect(() => {
    if (view !== 'days' || !shouldFocus.current) return
    shouldFocus.current = false
    gridRef.current?.querySelector('[data-focus="true"]')?.focus()
  }, [view, focusDay])

  const moveFocus = (days) => {
    const next = new Date(focusDay)
    next.setDate(next.getDate() + days)
    shouldFocus.current = true
    setFocusDay(next)
    if (next.getMonth() !== month || next.getFullYear() !== year) {
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1))
    }
  }

  const onGridKeyDown = (e) => {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (steps[e.key] !== undefined) {
      e.preventDefault()
      moveFocus(steps[e.key])
      return
    }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault()
      const next = new Date(focusDay)
      next.setMonth(next.getMonth() + (e.key === 'PageUp' ? -1 : 1))
      shouldFocus.current = true
      setFocusDay(next)
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1))
      return
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const weekday = (focusDay.getDay() + 6) % 7
      moveFocus(e.key === 'Home' ? -weekday : 6 - weekday)
    }
  }

  const shiftMonth = (delta) => setCursor(new Date(year, month + delta, 1))

  const navButton =
    'grid size-10 shrink-0 place-items-center rounded-full text-navy transition-colors duration-200 hover:bg-navy/[0.07] disabled:pointer-events-none disabled:opacity-30'

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={labelledBy}
      data-lenis-prevent
      className="w-[19.5rem] rounded-[var(--radius-md)] bg-white p-4 shadow-[0_1px_2px_rgba(16,46,82,0.06),0_22px_50px_-20px_rgba(16,46,82,0.45)]"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={view !== 'days'}
          aria-label="Previous month"
          className={navButton}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setView(view === 'days' ? 'years' : 'days')}
          aria-label={`${MONTHS[month]} ${year}. Choose a different month or year`}
          className="min-h-10 rounded-full px-4 font-sans text-[0.9375rem] font-semibold text-navy transition-colors duration-200 hover:bg-navy/[0.07]"
        >
          {MONTHS[month]} {year}
        </button>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={view !== 'days' || (maxDate && new Date(year, month + 1, 1) > maxDate)}
          aria-label="Next month"
          className={navButton}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {view === 'days' && (
        <>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d, i) => (
              <div
                key={`${d}-${i}`}
                aria-hidden="true"
                className="grid h-8 place-items-center font-sans text-[0.6875rem] font-semibold tracking-wide text-muted uppercase"
              >
                {d}
              </div>
            ))}
          </div>

          <div
            ref={gridRef}
            role="grid"
            onKeyDown={onGridKeyDown}
            className="grid grid-cols-7 gap-1"
          >
            {Array.from({ length: leadingBlanks(year, month) }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(year, month, i + 1)
              const isSelected = sameDay(date, selected)
              const disabled = isDisabled(date)
              // Exactly one day in the grid is tabbable, so Tab moves past the
              // calendar rather than through every date in the month.
              const isTabStop =
                sameDay(date, focusDay) ||
                (focusDay.getMonth() !== month && i + 1 === Math.min(focusDay.getDate(), daysInMonth))

              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  tabIndex={isTabStop ? 0 : -1}
                  data-focus={isTabStop ? 'true' : undefined}
                  aria-selected={isSelected}
                  aria-label={`${i + 1} ${MONTHS[month]} ${year}`}
                  disabled={disabled}
                  onClick={() => onSelect(toIso(date))}
                  className={`grid size-10 place-items-center rounded-full font-sans text-[0.9375rem] transition-colors duration-150 disabled:pointer-events-none disabled:text-navy/20 ${
                    isSelected
                      ? 'bg-navy font-semibold text-white'
                      : 'text-navy/85 hover:bg-navy/[0.07]'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </>
      )}

      {view === 'years' && (
        <div className="mt-3 grid max-h-60 grid-cols-4 gap-1 overflow-y-auto" data-lenis-prevent>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setCursor(new Date(y, month, 1))
                setView('months')
              }}
              className={`min-h-10 rounded-full font-sans text-[0.9375rem] transition-colors duration-150 ${
                y === year ? 'bg-navy font-semibold text-white' : 'text-navy/85 hover:bg-navy/[0.07]'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {view === 'months' && (
        <div className="mt-3 grid grid-cols-3 gap-1">
          {MONTHS.map((m, i) => {
            const disabled = maxDate && new Date(year, i, 1) > maxDate
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setCursor(new Date(year, i, 1))
                  setView('days')
                }}
                className={`min-h-11 rounded-[var(--radius-sm)] font-sans text-sm transition-colors duration-150 disabled:pointer-events-none disabled:text-navy/20 ${
                  i === month ? 'bg-navy font-semibold text-white' : 'text-navy/85 hover:bg-navy/[0.07]'
                }`}
              >
                {m.slice(0, 3)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
