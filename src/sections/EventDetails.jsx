import { CalendarDays, MapPin, CalendarX2, IndianRupee, Layers, Phone } from 'lucide-react'
import { categories, event, formatFee } from '../data/event'
import SectionIntro from '../components/SectionIntro'

const rows = [
  {
    Icon: CalendarDays,
    label: 'Date',
    value: event.date.display,
    note: 'Reporting time is shared with registered participants.',
  },
  {
    Icon: MapPin,
    label: 'Venue',
    value: event.venue.name,
    note: `${event.venue.city}. ${event.venue.note}`,
  },
  {
    Icon: CalendarX2,
    label: 'Last day to register',
    value: event.registration.deadlineDisplay,
    note: `${event.registration.availability} — registration may close sooner.`,
  },
  {
    Icon: IndianRupee,
    label: 'Registration fee',
    value: categories.map((c) => `${c.name} ${formatFee(c.fee)}`).join(' · '),
    note: 'Per participant. Each age category has its own fee.',
  },
  {
    Icon: Layers,
    label: 'Preliminary rounds',
    value: 'May be conducted',
    note: event.prelims,
  },
]

export default function EventDetails() {
  return (
    <section
      id="details"
      aria-labelledby="details-title"
      className="band-light py-20 sm:py-24 lg:py-28 2xl:py-36"
    >
      <div className="shell">
        <SectionIntro
          eyebrow="Event details"
          id="details-title"
          title={
            <>
              Everything you
              <br />
              need to know.
            </>
          }
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-14">
          {/* Scannable definition list — one row per fact, legible at 320px. */}
          <dl className="surface-sunken mt-2 px-6 py-2 sm:px-8">
            {rows.map(({ Icon, label, value, note }) => (
              <div
                key={label}
                data-reveal
                className="grid gap-x-6 gap-y-1.5 py-6 not-last:border-b not-last:border-navy/10 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:py-7"
              >
                <dt className="flex items-center gap-2.5 font-sans text-sm font-semibold tracking-wide text-muted uppercase">
                  <Icon size={17} className="shrink-0 text-gold-dim" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="m-0">
                  <p className="meta-value text-[1.5rem] leading-tight text-navy sm:text-[1.625rem]">
                    {value}
                  </p>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{note}</p>
                </dd>
              </div>
            ))}
          </dl>

          {/* Contact panel. No map is shown: the organisers have given a venue
              name but no verified address or coordinates. */}
          <aside data-reveal className="surface-navy self-start p-7 sm:p-8 lg:sticky lg:top-28">
            <p className="eyebrow text-gold-soft">For queries</p>
            <h3 className="display-soft mt-4 text-[1.75rem]">
              Talk to the organisers.
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/70">
              Anything not answered on this page — directions, timings, the running order —
              comes straight from them.
            </p>

            <ul className="mt-7 space-y-3">
              {event.contacts.map((c) => (
                <li key={c.name}>
                  <a
                    href={`tel:${c.tel}`}
                    className="flex min-h-14 items-center gap-3.5 rounded-full bg-white/[0.07] px-5 py-3 transition-colors duration-300 hover:bg-white/[0.14]"
                  >
                    <Phone size={17} className="shrink-0 text-gold" aria-hidden="true" />
                    <span>
                      <span className="block font-sans text-xs tracking-wide text-white/55 uppercase">
                        {c.name}
                      </span>
                      <span className="meta-value block text-lg">{c.phone}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
