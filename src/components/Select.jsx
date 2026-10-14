import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useDismissable } from '../hooks/useDismissable'

/**
 * A select built to the ARIA select-only combobox pattern, so the menu can be
 * styled to match the rest of the site instead of being drawn by the operating
 * system.
 *
 * It is a real replacement, not a div that looks like a select:
 *   - the trigger is a <button>, which is a labelable element, so the Field's
 *     <label for> still focuses it and clicking the label still works;
 *   - Enter / Space / ArrowUp / ArrowDown open it, arrows and Home / End move
 *     the active option, Enter or Space commits, Escape cancels and returns
 *     focus to the trigger;
 *   - typing jumps to the option starting with those letters, the way a native
 *     select does;
 *   - the listbox carries `data-lenis-prevent`, without which Lenis would
 *     swallow the wheel event and scroll the page behind the open menu.
 *
 * `options` is `[{ value, label }]`. The empty value renders as `placeholder`.
 */
export default function Select({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Choose an option',
  className = '',
  'aria-invalid': ariaInvalid,
  'aria-describedby': describedBy,
  'aria-required': ariaRequired,
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)
  const typeahead = useRef({ term: '', at: 0 })
  // Derived from the field id, not useId(): useId() emits colons, which make
  // the value unusable as a CSS selector for anything querying the listbox.
  const listId = `${id}-listbox`

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  const close = useCallback((returnFocus) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  useDismissable(open, rootRef, close)

  // Open on the current selection, or the first option when nothing is chosen.
  const openMenu = (startAt = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActive(startAt)
    setOpen(true)
  }

  const commit = (index) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    close(true)
  }

  // Keep the active option in view as the arrows move through a long list.
  useEffect(() => {
    if (!open || active < 0) return
    listRef.current?.querySelectorAll('[role="option"]')[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (e) => {
    const { key } = e

    if (!open) {
      if (key === 'Enter' || key === ' ' || key === 'ArrowDown' || key === 'ArrowUp') {
        e.preventDefault()
        openMenu(key === 'ArrowUp' ? Math.max(selectedIndex, 0) : selectedIndex >= 0 ? selectedIndex : 0)
      }
      return
    }

    switch (key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(i + 1, options.length - 1))
        return
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(i - 1, 0))
        return
      case 'Home':
        e.preventDefault()
        setActive(0)
        return
      case 'End':
        e.preventDefault()
        setActive(options.length - 1)
        return
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(active)
        return
      case 'Tab':
        // Leaving the field commits nothing and closes the menu.
        close(false)
        return
      default:
        break
    }

    // Typeahead: letters jump to the next option starting with what was typed.
    if (key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = Date.now()
      const t = typeahead.current
      t.term = now - t.at > 800 ? key : t.term + key
      t.at = now
      const match = options.findIndex((o) => o.label.toLowerCase().startsWith(t.term.toLowerCase()))
      if (match >= 0) setActive(match)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        aria-required={ariaRequired}
        data-value={value || ''}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`${className} flex items-center justify-between gap-3 text-left`}
      >
        <span className={selected ? 'text-navy' : 'text-muted/80'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-navy/45 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={id}
          tabIndex={-1}
          // Without this Lenis hijacks the wheel and scrolls the page instead.
          data-lenis-prevent
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-[var(--radius-md)] bg-white p-1.5 shadow-[0_1px_2px_rgba(16,46,82,0.06),0_18px_44px_-18px_rgba(16,46,82,0.42)]"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                // Pointer down, not click: the dismiss handler fires on
                // pointerdown and would close the menu before a click landed.
                onPointerDown={(e) => {
                  e.preventDefault()
                  commit(i)
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-[0.9375rem] transition-colors duration-150 ${
                  i === active ? 'bg-navy/[0.07]' : ''
                } ${isSelected ? 'font-semibold text-navy' : 'text-navy/85'}`}
              >
                {o.label}
                {isSelected && <Check size={16} aria-hidden="true" className="shrink-0 text-gold-dim" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
