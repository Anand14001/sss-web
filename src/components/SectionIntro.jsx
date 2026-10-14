/**
 * Shared section opener: a gold eyebrow label above the headline.
 *
 * Every section announces itself the same way, which is what carries the rhythm
 * down the page — not a change of background colour between sections.
 */
export default function SectionIntro({
  eyebrow,
  title,
  lede,
  align = 'left',
  tone = 'dark',
  size = 'lg',
  className = '',
  as: Heading = 'h2',
  id,
}) {
  const centred = align === 'center'
  const onDark = tone === 'light'

  return (
    <div className={`${centred ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'} ${className}`} data-reveal>
      <p className={`eyebrow ${onDark ? 'text-gold-soft' : 'text-gold-dim'}`}>{eyebrow}</p>

      <Heading
        id={id}
        className={`display ${size === 'md' ? 'display-md' : 'display-lg'} mt-5 ${
          onDark ? 'text-white' : 'text-navy'
        }`}
      >
        {title}
      </Heading>

      {lede && <p className={`lede mt-6 ${onDark ? 'text-white/75' : 'text-muted'}`}>{lede}</p>}
    </div>
  )
}
