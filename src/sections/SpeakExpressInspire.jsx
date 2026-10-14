const beats = [
  {
    word: 'Speak',
    line: 'Step up. Say the first line. The hardest part of the whole contest is already behind you.',
  },
  {
    word: 'Express',
    line: 'Put a shape around what you actually think, and find the words that carry it across a room.',
  },
  {
    word: 'Inspire',
    line: 'Somebody out there is listening and deciding they could do this too. That is the whole idea.',
  },
]

/**
 * The storytelling break in the page.
 *
 * Carried by typography: three words at display scale, each on its own rule, with
 * a single portrait holding the left of the composition. One photograph, not a
 * grid of them — the category photographs have already had their section, and
 * repeating them here would turn a pause in the page into a recap.
 */
export default function SpeakExpressInspire() {
  return (
    <section
      aria-labelledby="theme-title"
      className="band-dark band-dark-top relative overflow-hidden py-20 text-white sm:py-24 lg:py-28 2xl:py-36"
    >
      <div className="shell relative grid gap-12 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:items-center lg:gap-16">
        <figure className="relative m-0 max-w-xs lg:max-w-none" data-reveal>
          <img
            src="images/story-kid.jpg"
            alt="A young speaker at a podium, one finger raised, making a point"
            width="592"
            height="768"
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] w-full rounded-[var(--radius-xl)] object-cover"
          />
          {/* A gold corner tucked under the photograph — the one piece of ornament
              in this section, there to stop the image floating free of the type. */}
          <span aria-hidden="true" className="absolute -right-3 -bottom-3 h-20 w-px bg-gold/60" />
          <span aria-hidden="true" className="absolute -right-3 -bottom-3 h-px w-20 bg-gold/60" />
        </figure>

        <div>
          <p className="eyebrow text-gold-soft" data-reveal>
            Speak · Express · Inspire
          </p>

          <h2 id="theme-title" className="sr-only">
            Speak, express and inspire
          </h2>

          <div className="mt-8 border-t border-white/15">
            {beats.map(({ word, line }) => (
              <div
                key={word}
                data-reveal
                className="group grid items-baseline gap-x-10 gap-y-2 border-b border-white/15 py-7 sm:py-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]"
              >
                <p
                  aria-hidden="true"
                  className="display display-lg text-white transition-colors duration-500 group-hover:text-gold"
                >
                  {word}
                </p>
                <p className="max-w-md text-[0.9375rem] leading-[1.75] text-white/65">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
