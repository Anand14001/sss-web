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
 * The same photograph is art-directed twice more below `lg`, rather than shrunk:
 * on a phone it is a tall slice anchored to the right edge, dropped low enough
 * that the microphone head sits beside "Find your voice" and masked on its left
 * and its two short edges so it dissolves into the navy instead of reading as a
 * pasted-in panel; on a tablet it is a wide band under the copy, where the extra
 * width makes a vertical slice look starved.
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
          width="1024"
          height="1536"
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

      {/* ------------------------------------------- phone atmosphere layer
          A sharp crop large enough to read as a microphone can only ever fill
          part of the band's height, which left the top-right corner empty. The
          same frame, thrown far out of focus and held well back, fills it: what
          survives the blur is the warm stage bokeh, so the corner carries the
          photograph's light from under the header downwards and the sharp slice
          below reads as the foreground of one picture rather than a panel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-[84%] overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.07)_36%,rgba(0,0,0,0.5)_62%,black_86%),linear-gradient(to_bottom,black_0%,black_44%,transparent_84%)] [mask-composite:intersect] md:hidden"
      >
        {/* Zoomed well past `cover` and parked on the frame's top-right corner —
            the one part of the photograph that is stage lights and nothing else,
            so there is no second, ghosted microphone behind the real one. */}
        <div className="absolute inset-[-8%] bg-[url('/images/hero-microphone.jpg')] bg-[length:auto_260%] bg-[90%_32%] opacity-55 blur-[14px]" />
      </div>

      <div className="shell-wide relative flex min-h-[100svh] flex-col justify-center pt-28 pb-10 lg:pt-36 lg:pb-14">
        <div className="relative isolate lg:max-w-[62%]">
          {/* ------------------------------------------- phone media layer
              A tall slice of the same photograph, anchored to this copy block
              rather than to the section, so the microphone keeps its position
              against the headline however many lines the copy takes. It is
              sized in `vw` so the microphone stays the same fraction of the
              screen at every phone width, bleeds back out through the gutter,
              and sits on the negative layer of this block's stacking context —
              behind the type, above the band. */}
          <div
            data-hero-media
            aria-hidden="true"
            className="pointer-events-none absolute top-[28%] right-[calc(var(--gutter)*-1)] -z-10 aspect-[1024/2000] w-[64vw] max-w-[21rem] md:hidden"
          >
            <img
              src="images/hero-microphone.jpg"
              alt=""
              width="1024"
              height="1536"
              fetchPriority="high"
              decoding="async"
              className="size-full object-cover object-[0%_50%] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.06)_24%,rgba(0,0,0,0.5)_48%,rgba(0,0,0,0.92)_74%,black_88%),linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.45)_13%,black_27%,black_60%,rgba(0,0,0,0.3)_85%,transparent_98%)]"
            />
          </div>

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

          {/* The measure steps up with the viewport: on a phone it stops short of
              the microphone's left falloff, so no line runs into the stand. */}
          <div
            className="mt-7 max-w-[min(15rem,calc(66vw-0.75rem))] border-l border-gold/50 pl-5 sm:max-w-sm sm:pl-6 md:max-w-xl"
            data-hero-fade
          >
            <p className="display-soft text-[clamp(1.375rem,5.6vw,1.5rem)] text-white sm:text-[clamp(1.5rem,2.9vw,2.125rem)]">
              {/* Broken by hand on a phone: left to wrap, the narrow measure
                  turns the two sentences into "…Own / the stage." */}
              <span className="block sm:inline">Find your voice. </span>
              <span className="block sm:inline">Own the stage.</span>
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

        {/* Tablet only. A phone gets the tall right-hand slice above, and from lg
            the full bleeding panel takes over; between the two a wide band under
            the copy reads better than either. */}
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
