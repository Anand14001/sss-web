import { event } from '../data/event'
import SectionIntro from '../components/SectionIntro'
import Button from '../components/Button'

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="band-light py-20 sm:py-24 lg:py-28 2xl:py-36">
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-24">
        {/* Asymmetric media column, deliberately offset from the text baseline. */}
        <div className="relative pb-12 sm:pb-10 lg:pt-10 lg:pb-16">
          <figure className="relative m-0">
            {/* Portrait on a phone, landscape from `sm`. The landscape crop was
                half of the problem below: its height is a fraction of the
                content width, so as the screen narrowed the photograph shrank
                while the card — sized by its own text, which only grew as it
                rewrapped — did not. By 320 the card stood taller than the
                picture it is meant to break out of. A 4:5 frame is also close
                to the asset's native 1098×1448, so `cover` no longer has to
                throw away the top of the speaker's head. */}
            <img
              src="images/story-teen.jpg"
              alt="A teenage speaker mid-sentence, holding a microphone"
              width="592"
              height="768"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full rounded-[var(--radius-xl)] object-cover object-[50%_18%] sm:aspect-[4/3] sm:object-center lg:aspect-[4/5]"
              data-reveal
            />
            {/* Navy block breaking out of the photograph's bottom-right corner.
                Below lg the image spans the full content width, so there is no
                room to push past its right edge — the card only drops below it
                there, and takes on the sideways break once the two columns
                appear and open a gap to grow into. */}
            <figcaption
              data-reveal
              className="surface-navy absolute right-0 -bottom-10 z-10 w-[min(21rem,85%)] p-6 shadow-[0_18px_44px_-24px_rgba(10,28,52,0.75)] max-[359px]:p-5 sm:-bottom-8 sm:p-8 lg:-right-[14%] lg:-bottom-11 lg:w-[min(21rem,72%)]"
            >
              <p className="display-soft text-[1.75rem] max-[359px]:text-[1.5rem] sm:text-[2rem]">
                “{event.promise}”
              </p>
              <p className="mt-3 font-sans text-sm text-white/65">
                The three things every speaker on this stage is asked to do.
              </p>
            </figcaption>
          </figure>
        </div>

        <div>
          <SectionIntro
            eyebrow="About the contest"
            id="about-title"
            title={
              <>
                A stage for the
                <br />
                voice you already
                <br />
                have.
              </>
            }
          />

          <div className="mt-8 max-w-xl space-y-5 text-[1.0625rem] leading-[1.75] text-navy/80" data-reveal>
            <p>
              Salem Star Speaker is a public speaking contest run by{' '}
              <strong className="font-semibold text-navy">Salem Parenting Club</strong> in
              association with{' '}
              <strong className="font-semibold text-navy">
                Speak Up Salem Toastmasters Club
              </strong>
              . It exists for a simple reason: most people never get a proper chance to
              stand up and be heard.
            </p>
            <p>
              Over one day, participants bring an idea they care about and say it out loud
              to a room that is listening. That is where the real learning happens — in
              the shaping of a thought, in the nerves before the first line, and in the
              moment the room responds.
            </p>
            <p>
              It is open to three age groups, so a ten-year-old finding their first
              sentence and an adult sharpening a professional voice each compete where they
              belong.
            </p>
          </div>

          {/* Three outcomes, set as an editorial list rather than another icon grid. */}
          {/* Flex, not three equal grid columns. The words differ in width, so
              equal columns left a long tail of empty space after the short one
              ("FIND") and none after the long one — the gaps were even in CSS
              but plainly uneven to the eye. Content-width items with a single
              gap put the same space between each pair. */}
          <ul
            className="mt-10 grid gap-y-5 pt-8 sm:flex sm:flex-wrap sm:gap-x-12"
            data-reveal
          >
            {[
              ['Find', 'your voice'],
              ['Express', 'your ideas'],
              ['Inspire', 'an audience'],
            ].map(([verb, rest]) => (
              <li key={verb}>
                {/* Deliberately below the heading scale — at display-md these
                    three ran into each other. */}
                <p className="display text-[clamp(1.5rem,2.3vw,2rem)] text-gold-dim">{verb}</p>
                <p className="mt-1 font-sans text-sm text-muted">{rest}</p>
              </li>
            ))}
          </ul>

          <Button to="categories" variant="soft" className="mt-10" data-reveal>
            See the three categories
          </Button>
        </div>
      </div>
    </section>
  )
}
