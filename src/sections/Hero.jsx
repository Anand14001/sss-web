import { useRef } from 'react'
import { ArrowDown } from 'lucide-react'
import { event, feeRange } from '../data/event'
import { useHeroIntro } from '../hooks/useReveal'
import Button from '../components/Button'
import OrganiserLogos from '../components/OrganiserLogos'

const facts = [
  { label: 'Date', value: event.date.display },
  { label: 'Venue', value: event.venue.name },
  { label: 'Entry', value: `${feeRange} by category` },
  { label: 'Closes', value: event.registration.deadlineDisplay },
]

/**
 * Hero.
 *
 * Composed as a poster rather than a banner: from `lg` the photograph bleeds off
 * the right edge and runs the full height of the section, behind the header, and
 * the headline sits over its left falloff. The microphone occupies the upper-right
 * of the crop, so the type never crosses it.
 *
 * Below `lg` the composition is rebuilt, not shrunk — the image becomes a wide
 * band under the copy, where a tall portrait crop would push the headline and the
 * primary CTA off the first screen.
 */
export default function Hero() {
  const scope = useRef(null)
  useHeroIntro(scope)

  return (
    <section
      id="home"
      ref={scope}
      aria-labelledby="hero-title"
      className="band-dark band-dark-bottom relative overflow-hidden text-white"
    >
      {/* ------------------------------------------------ bleeding media layer */}
      <div
        data-hero-media
        className="absolute inset-y-0 right-0 hidden w-[47%] lg:block"
      >
        <img
          src="images/hero-microphone.jpg"
          alt="A stage microphone in front of a softly blurred audience"
          width="906"
          height="990"
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover object-[58%_28%] [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.18)_18%,rgba(0,0,0,0.75)_46%,black_72%)]"
        />
        {/* Only a slight darkening, to keep the audience behind the microphone
            from competing with the headline. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#0A1C34]/20"
        />
      </div>

      <div className="shell-wide relative flex min-h-[100svh] flex-col justify-center pt-28 pb-10 lg:pt-36 lg:pb-14">
        <div className="lg:max-w-[62%]">
          <p data-hero-fade className="eyebrow text-gold-soft">
            Salem · Public Speaking Contest
          </p>

          {/* Masked lines, so the intro can slide each one up from behind. */}
          <h1 id="hero-title" className="mt-7 sm:mt-9">
            <span className="block overflow-hidden">
              <span className="display display-xl block text-white" data-hero-line>
                Salem
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="display display-xl block text-gold" data-hero-line>
                Star
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="display display-xl block text-gold" data-hero-line>
                Speaker
              </span>
            </span>
          </h1>

          <div className="mt-7 max-w-xl border-l border-gold/50 pl-5 sm:pl-6" data-hero-fade>
            <p className="display-soft text-[clamp(1.5rem,2.9vw,2.125rem)] text-white">
              Find your voice. Own the stage.
            </p>
            <p className="mt-3 text-[1.0625rem] leading-[1.7] text-white/65">
              A platform for kids, teens and adults to build confidence, express
              themselves and inspire others through the power of public speaking.
            </p>
          </div>

          <div data-hero-fade className="mt-9 flex flex-wrap items-center gap-3">
            <Button route="/registration" size="lg">
              Register Now
            </Button>
            <Button to="about" size="lg" variant="ghost">
              Explore the Contest
              <ArrowDown size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Tablet only. On a phone the photograph is left out altogether: the
            headline and the Register CTA should own the first screen, and a band
            below them pushed both off it. From lg the bleeding panel takes over. */}
        <div
          className="relative mt-10 hidden overflow-hidden rounded-[var(--radius-xl)] sm:mt-12 md:block lg:hidden"
          data-hero-fade
        >
          <img
            src="images/hero-microphone.jpg"
            alt=""
            width="906"
            height="990"
            fetchPriority="high"
            decoding="async"
            className="aspect-[5/3] w-full object-cover object-[58%_22%] sm:aspect-[21/9]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#0A1C34] via-transparent to-transparent"
          />
        </div>

        <div data-hero-fade className="mt-10 lg:mt-14">
          <OrganiserLogos tone="light" size="sm" withRoles />
        </div>
      </div>

      {/* ------------------------------------------------ metadata baseline
          Set small and plain on one rule, the way an event programme prints its
          particulars — the headline carries the weight, not these. */}
      <div className="relative border-t border-white/10">
        <dl className="shell-wide grid grid-cols-2 gap-x-8 gap-y-5 py-6 sm:py-7 lg:grid-cols-4">
          {facts.map(({ label, value }) => (
            <div key={label} data-hero-fade>
              <dt className="eyebrow text-[0.6875rem] text-white/45">{label}</dt>
              <dd className="meta-value mt-1.5 text-[1.0625rem] leading-snug text-white sm:text-[1.125rem]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
