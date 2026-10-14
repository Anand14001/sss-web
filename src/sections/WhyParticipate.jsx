import { benefits } from '../data/event'
import SectionIntro from '../components/SectionIntro'

/**
 * Deliberately not five identical cards: the first benefit takes a wide feature
 * slot beside the heading, and the remaining four fall into a numbered editorial
 * list. The varied rhythm is the point.
 */
export default function WhyParticipate() {
  const [lead, ...rest] = benefits

  return (
    <section
      aria-labelledby="why-title"
      className="band-light py-20 sm:py-24 lg:py-28 2xl:py-36"
    >
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <SectionIntro
              eyebrow="Why participate"
              id="why-title"
              title={
                <>
                  What you take
                  <br />
                  home afterwards.
                </>
              }
            />

            <div
              data-reveal
              className="surface mt-8 border-l-4 border-gold p-7 sm:p-8"
            >
              <h3 className="display-soft text-[1.625rem] text-navy">
                {lead.title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{lead.body}</p>
            </div>

            <p className="mt-6 font-sans text-sm text-muted" data-reveal>
              These are the skills the contest gives you room to practise — not promises
              about how far they will take you.
            </p>
          </div>

          <ol className="grid gap-x-10 gap-y-8 self-center sm:grid-cols-2 lg:pt-6">
            {rest.map((b, i) => (
              <li key={b.title} data-reveal className="pt-5">
                <span className="meta-value text-xl text-gold-dim">
                  {String(i + 2).padStart(2, '0')}
                </span>
                <h3 className="mt-2 font-sans text-base leading-snug font-semibold text-navy">
                  {b.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
