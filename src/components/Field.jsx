/**
 * Control styling, split so a composite control (an input with a button beside
 * it, like the date field) can take the frame without the padding — otherwise
 * its inner input and its calendar button would sit inside a second box.
 */
const FRAME =
  'w-full min-h-13 rounded-[var(--radius-sm)] border bg-ivory/60 font-sans text-base text-navy ' +
  'transition-[background-color,border-color] duration-200'
const PADDING = 'px-4 py-3'
const SELF_FOCUS = 'placeholder:text-muted/60 focus:border-navy focus:bg-white focus:outline-none'
// A wrapper cannot take focus itself, so it reacts to focus landing inside it
// and draws the same gold ring the rest of the site uses.
const CHILD_FOCUS =
  'focus-within:border-navy focus-within:bg-white ' +
  'focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-gold'

/**
 * One labelled form control with its error wiring.
 *
 * The error is tied to the control through `aria-describedby` and announced via
 * `role="alert"`, and `aria-invalid` marks the control itself — so the message
 * is reachable by screen reader, not only visible.
 *
 * `composite` is for controls that render their own internal layout: they get
 * the frame and a focus-within ring instead of padding and a focus ring.
 */
export default function Field({
  id,
  label,
  error,
  hint,
  required,
  composite = false,
  children,
  className = '',
}) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  const edge = error ? 'border-[#B3261E]' : 'border-navy/15 hover:border-navy/30'
  const control = composite
    ? `${FRAME} ${CHILD_FOCUS} ${edge}`
    : `${FRAME} ${PADDING} ${SELF_FOCUS} ${edge}`

  return (
    <div className={className}>
      <label htmlFor={id} className="block font-sans text-sm font-semibold text-navy">
        {label}
        {required ? (
          <span className="text-gold-dim"> *</span>
        ) : (
          <span className="ml-1.5 font-normal text-muted">(optional)</span>
        )}
      </label>

      <div className="mt-2">
        {children({
          id,
          name: id,
          'aria-invalid': error ? 'true' : undefined,
          'aria-describedby': describedBy,
          'aria-required': required || undefined,
          className: control,
        })}
      </div>

      {hint && (
        <p id={hintId} className="mt-1.5 font-sans text-xs text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 font-sans text-sm font-medium text-[#B3261E]">
          {error}
        </p>
      )}
    </div>
  )
}
