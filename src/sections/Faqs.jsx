import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { faqs, event } from '../data/event'
import SectionIntro from '../components/SectionIntro'

/**
 * Accordion built on buttons with `aria-expanded` + `aria-controls` rather than
 * <details>, so the open/closed state is announced consistently and the panel can
 * animate. Only one panel is open at a time.
 */
export default function Faqs() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faqs" aria-labelledby="faqs-title" className="band-light py-20 sm:py-24 lg:py-28 2xl:py-36">
      <div className="shell grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionIntro
            eyebrow="FAQs"
            id="faqs-title"
            title={
              <>
                Questions,
                <br />
                answered.
              </>
            }
            lede="If something is not covered here, the organisers will have the answer."
          />
          <p className="mt-6 font-sans text-sm text-muted" data-reveal>
            {event.contacts.map((c, i) => (
              <span key={c.name}>
                {i > 0 && <span className="mx-2 text-navy/25">·</span>}
                {c.name}{' '}
                <a
                  href={`tel:${c.tel}`}
                  className="inline-flex min-h-10 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4"
                >
                  {c.phone}
                </a>
              </span>
            ))}
          </p>
        </div>

        <dl className="m-0 space-y-2">
          {faqs.map((item, i) => {
            const isOpen = open === i
            const panelId = `faq-panel-${i}`
            const buttonId = `faq-button-${i}`
            return (
              <div
                key={item.q}
                data-reveal
                className={`rounded-[var(--radius-md)] px-5 transition-colors duration-300 sm:px-6 ${
                  isOpen ? 'bg-ivory-deep' : 'hover:bg-ivory-deep/60'
                }`}
              >
                <dt>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="group flex w-full min-h-16 items-center justify-between gap-5 py-5 text-left font-sans text-[1.0625rem] font-semibold text-navy"
                  >
                    {item.q}
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-navy/[0.07] text-navy transition-colors duration-300 group-hover:bg-navy/[0.12]"
                    >
                      {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                    </span>
                  </button>
                </dt>
                <dd
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="m-0 max-w-2xl pb-6 text-base leading-[1.75] text-muted"
                >
                  {item.a}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
