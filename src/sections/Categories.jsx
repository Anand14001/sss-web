import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { categories, event, formatFee } from '../data/event'
import SectionIntro from '../components/SectionIntro'

/**
 * The three contest categories, as image-led editorial panels.
 *
 * Each entry pairs a large rounded photograph with an open text column, and the
 * two swap sides down the page so the section has a gait rather than a grid.
 * There is no card chrome — no outline, no shadow box; the picture and the type
 * carry it, over a softly tinted field.
 *
 * The age label rides on the image so a visitor scanning the photographs alone
 * still sees who each one is for. Accent colours come from the poster's own
 * colour wash behind each category and appear only on that label and the
 * running number — enough to tell three panels apart without three layouts.
 */
export default function Categories() {
  return (
    <section id="categories" aria-labelledby="categories-title" className="band-light py-20 sm:py-24 lg:py-28 2xl:py-36">
      <div className="shell">
        <SectionIntro
          eyebrow="Contest categories"
          id="categories-title"
          title={
            <>
              Three age groups.
              <br />
              One stage.
            </>
          }
          lede="Every participant competes within their own age band, and each band has its own entry fee."
        />

        <ul className="mt-14 space-y-6 sm:mt-16 sm:space-y-8">
          {categories.map((c, i) => (
            <li
              key={c.id}
              data-reveal
              className={`group surface-sunken grid items-center gap-8 p-5 sm:p-7 lg:grid-cols-2 lg:gap-14 lg:p-8 ${
                i % 2 === 1 ? 'lg:[&>figure]:order-2' : ''
              }`}
            >
              <figure className="relative m-0 overflow-hidden rounded-[var(--radius-lg)]">
                <img
                  src={c.image}
                  alt={c.alt}
                  width="954"
                  height="636"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.035] sm:aspect-[3/2]"
                  style={{ backgroundColor: c.tint }}
                />
                <figcaption
                  className="absolute bottom-4 left-4 rounded-full px-4 py-1.5 font-sans text-xs font-semibold tracking-[0.14em] text-white uppercase sm:bottom-5 sm:left-5"
                  style={{ backgroundColor: `${c.accent}f0` }}
                >
                  {c.ages}
                </figcaption>
              </figure>

              <div className="lg:py-4 lg:pr-6">
                <p
                  className="meta-value text-[1.625rem] leading-none tabular-nums"
                  style={{ color: c.accent }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </p>

                <h3 className="display display-md mt-3 text-navy">{c.name}</h3>

                <p className="display-soft mt-3 text-[clamp(1.25rem,2.1vw,1.625rem)] text-navy/60 italic">
                  {c.message}
                </p>

                <p className="mt-5 max-w-md text-base leading-[1.75] text-muted">{c.blurb}</p>

                <div className="divider mt-8" />

                <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                  <p className="flex items-baseline gap-2">
                    <span className="meta-value text-[2rem] leading-none text-navy">
                      {formatFee(c.fee)}
                    </span>
                    <span className="font-sans text-xs text-muted">per participant</span>
                  </p>

                  <Link
                    to={`/registration/${c.slug}`}
                    className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-navy px-6 py-3 font-sans text-sm font-semibold text-white shadow-[0_10px_26px_-16px_rgba(16,46,82,0.9)] transition-[background-color,transform] duration-300 ease-out hover:bg-navy-mid active:scale-[0.985]"
                  >
                    Register for {c.name}
                    <ArrowRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform duration-300 ease-out group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-xl text-sm leading-relaxed text-muted" data-reveal>
          {event.prelims}
        </p>
      </div>
    </section>
  )
}
