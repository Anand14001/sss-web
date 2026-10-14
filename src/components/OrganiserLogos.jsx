import { event } from '../data/event'

/**
 * The two organiser marks, lifted unaltered from the official poster.
 * They keep their own aspect ratios — never stretched, never recoloured.
 */
export default function OrganiserLogos({ tone = 'dark', size = 'md', withRoles = false }) {
  const onDark = tone === 'light'
  const heights = { sm: 'h-8 sm:h-9', md: 'h-10 sm:h-12', lg: 'h-12 sm:h-14' }
  const [spc, tm] = event.organisers

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-4 sm:gap-x-7">
      <figure className="m-0">
        {withRoles && (
          <figcaption className={`eyebrow mb-2 text-[0.625rem] ${onDark ? 'text-white/50' : 'text-muted'}`}>
            {spc.role}
          </figcaption>
        )}
        <img
          src={spc.logo}
          alt={spc.alt}
          width="690"
          height="250"
          className={`${heights[size]} w-auto ${onDark ? 'rounded-lg bg-white/95 px-2.5 py-1.5' : ''}`}
        />
      </figure>

      <span
        aria-hidden="true"
        className={`hidden h-9 w-px sm:block ${onDark ? 'bg-white/25' : 'bg-navy/15'}`}
      />

      <figure className="m-0">
        {withRoles && (
          <figcaption className={`eyebrow mb-2 text-[0.625rem] ${onDark ? 'text-white/50' : 'text-muted'}`}>
            {tm.role}
          </figcaption>
        )}
        <div className="flex items-center gap-3">
          <img
            src={tm.logo}
            alt={tm.alt}
            width="300"
            height="208"
            className={`${heights[size]} w-auto`}
          />
          <span
            className={`max-w-[9rem] font-sans text-[0.8125rem] leading-tight font-semibold ${
              onDark ? 'text-white/85' : 'text-navy'
            }`}
          >
            Speak Up Salem Toastmasters Club
          </span>
        </div>
      </figure>
    </div>
  )
}
