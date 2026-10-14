import { categories, event } from '../data/event'
import Button from '../components/Button'

const places = ['First place', 'Second place', 'Third place']

/**
 * Prizes.
 *
 * Set as a numbered list, the same device the categories use, rather than three
 * identical boxes — the three placings are a ranking, and a ranking should look
 * like one. No prize values appear anywhere: the organisers have confirmed
 * "top 3 in each category" and nothing further, so the section says exactly that
 * and sends the rest to them.
 */
export default function Prizes() {
  return (
    <section
      id="prizes"
      aria-labelledby="prizes-title"
      className="band-dark-bottom relative overflow-hidden bg-navy py-20 text-white sm:py-24 lg:py-28 2xl:py-36"
    >
      <div className="shell prizes-layout">
        <div className="prizes-trophy" data-reveal>
          <img
            src="images/trophy-cutout.png"
            alt="A gold trophy framed by a laurel wreath"
            width="525"
            height="399"
            loading="lazy"
            decoding="async"
            className="mx-auto h-auto w-full max-w-[12rem] object-contain lg:max-w-none"
          />
        </div>

        <div className="prizes-intro">
          <p className="eyebrow text-gold-soft" data-reveal>
            Recognition
          </p>

          <h2
            id="prizes-title"
            className="display mt-4 text-[clamp(1.75rem,8.5vw,3.75rem)] text-white sm:mt-5 sm:text-[clamp(2.125rem,5.2vw,3.75rem)]"
            data-reveal
          >
            Exciting
            <br />
            <span className="text-gold">Prizes</span>
          </h2>

          <p className="lede mt-5 max-w-lg text-white/75" data-reveal>
            {event.prizes.detail} Nine participants leave this stage with something to
            show for it — three in Kids, three in Teens, three in Adults.
          </p>
        </div>

        <div className="prizes-rest">
          <ol className="border-t border-white/15 lg:mt-10" data-reveal>
            {places.map((place, i) => (
              <li
                key={place}
                className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-white/15 py-4"
              >
                <span
                  aria-hidden="true"
                  className={`meta-value text-xl tabular-nums ${i === 0 ? 'text-gold' : 'text-gold/55'}`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="display-soft text-[1.5rem] text-white sm:text-[1.75rem]">
                  {place}
                </span>
                <span className="ml-auto font-sans text-xs tracking-wide text-white/45 uppercase">
                  in every category
                </span>
              </li>
            ))}
          </ol>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2" data-reveal>
            {categories.map((c) => (
              <li key={c.id} className="font-sans text-xs font-medium tracking-wide text-white/55">
                {c.name} · {c.ages}
              </li>
            ))}
          </ul>

          <p className="mt-7 max-w-lg font-sans text-sm leading-relaxed text-white/55" data-reveal>
            {event.prizes.note}
          </p>

          <Button route="/registration" className="mt-9" data-reveal>
            Enter the contest
          </Button>
        </div>
      </div>
    </section>
  )
}
