import { event, feeRange } from '../data/event'
import Button from '../components/Button'

const stats = [
  { label: 'Contest date', value: event.date.display },
  { label: 'Registration fee', value: `${feeRange} by category` },
  { label: 'Last day to register', value: event.registration.deadlineDisplay },
]

export default function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-title"
      className="band-dark band-dark-top relative overflow-hidden py-20 text-white sm:py-24 lg:py-28 2xl:py-36"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
      />

      <div className="shell relative text-center">
        <p className="eyebrow text-gold-soft" data-reveal>
          {event.registration.availability}
        </p>

        <h2 id="final-cta-title" className="display display-lg mx-auto mt-6 max-w-4xl" data-reveal>
          Your voice
          <br />
          <span className="bg-gradient-to-r from-gold-soft via-gold to-gold-dim bg-clip-text text-transparent">
            deserves the stage.
          </span>
        </h2>

        <p className="display-soft mx-auto mt-6 text-[clamp(1.375rem,2.8vw,2rem)] text-white/85" data-reveal>
          {event.promise}
        </p>

        <dl className="mx-auto mt-12 grid max-w-3xl gap-px border-y border-white/12 sm:grid-cols-3" data-reveal>
          {stats.map(({ label, value }) => (
            <div key={label} className="px-4 py-6">
              <dt className="eyebrow text-[0.625rem] text-white/45">{label}</dt>
              <dd className="meta-value mt-2 text-[1.25rem] leading-snug text-white">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-11 flex flex-wrap justify-center gap-3" data-reveal>
          <Button route="/registration" size="lg">
            Register Now
          </Button>
          <Button href={`tel:${event.contacts[0].tel}`} size="lg" variant="ghost">
            Call {event.contacts[0].name} · {event.contacts[0].phone}
          </Button>
        </div>
      </div>
    </section>
  )
}
