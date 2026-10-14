/**
 * Builds the favicon set from src/assets/source/favicon-master.png.
 * Run with: node scripts/favicon.mjs
 *
 * The supplied artwork is a transparent PNG wrapped in an SVG by
 * RealFaviconGenerator (1.55 MB). Shipping that as-is would put a 1.5 MB file on
 * every page for a 32px icon, and a transparent icon loses its navy figure
 * against a dark browser theme — so the mark is composited onto the brand navy
 * and emitted at the sizes browsers actually ask for.
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../src/assets/source/favicon-master.png', import.meta.url))
const OUT = fileURLToPath(new URL('../public/', import.meta.url))
const NAVY = { r: 10, g: 28, b: 52, alpha: 1 }

/** Padding keeps the star's points off the edge at small sizes. */
const build = async (size, name, padRatio) => {
  const inner = Math.round(size * (1 - padRatio * 2))
  const art = await sharp(SRC).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: art, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(OUT + name)
  console.log('wrote', name, `${size}x${size}`)
}

await build(32, 'favicon-32.png', 0.06)
await build(192, 'favicon-192.png', 0.08)
await build(180, 'apple-touch-icon.png', 0.1)
