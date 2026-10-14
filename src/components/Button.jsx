import { Link } from 'react-router-dom'
import { scrollToSection } from '../utils/scroll'

/**
 * The site's one button.
 *
 * `to` is an in-page anchor and `route` is a router link — the two are kept
 * distinct so a CTA that leaves the page can never be mistaken for one that
 * scrolls within it.
 *
 * Five variants, no more. Pill geometry is reserved for the actions that move a
 * visitor forward — `primary`, `navy`, `ghost` — so a pill always means "this is
 * the thing to press". `quiet` is a text action with a rule under it, and never
 * a pill, which keeps the hierarchy legible without a second shape language.
 *
 * Hover moves background and colour only. Nothing reflows, nothing resizes, and
 * every state is reachable by keyboard; `active:` gives the press a physical
 * response on touch devices, where there is no hover at all.
 */
const base =
  'group/btn inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-sans font-semibold ' +
  'transition-[background-color,color,box-shadow,transform] duration-300 ease-out ' +
  'select-none active:scale-[0.985] disabled:pointer-events-none disabled:opacity-60'

const sizes = {
  md: 'min-h-12 px-7 text-[0.9375rem]',
  lg: 'min-h-14 px-9 text-base',
}

const variants = {
  primary:
    'rounded-full bg-gold text-navy-deep shadow-[0_8px_20px_-10px_rgba(214,161,58,0.9)] ' +
    'hover:bg-gold-soft hover:shadow-[0_12px_26px_-10px_rgba(214,161,58,0.95)]',
  navy: 'rounded-full bg-navy text-white hover:bg-navy-mid shadow-[0_10px_26px_-16px_rgba(16,46,82,0.9)]',
  // On ivory: no outline, a tinted field that deepens on hover.
  soft: 'rounded-full bg-navy/[0.06] text-navy hover:bg-navy/[0.11]',
  // On navy: the same idea inverted.
  ghost: 'rounded-full bg-white/10 text-white hover:bg-white/[0.18]',
  // Inline text action.
  quiet:
    'px-0 text-navy underline decoration-gold decoration-2 underline-offset-[6px] ' +
    'hover:decoration-navy',
}

export default function Button({
  children,
  to,
  route,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}) {
  const classes = `${base} ${variant === 'quiet' ? 'min-h-11' : sizes[size]} ${variants[variant]} ${className}`

  if (route) {
    return (
      <Link to={route} className={classes} onClick={onClick} {...rest}>
        {children}
      </Link>
    )
  }

  if (to) {
    return (
      <a
        href={`#${to}`}
        className={classes}
        onClick={(e) => {
          e.preventDefault()
          scrollToSection(to)
          onClick?.(e)
        }}
        {...rest}
      >
        {children}
      </a>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  )
}
