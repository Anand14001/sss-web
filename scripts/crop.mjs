/**
 * Extracts branding assets from the official event poster into public/images/.
 * Run once with: node scripts/crop.mjs
 * The poster (src/assets/source/poster.jpg) is the supplied source of truth for
 * organiser logos and category photography — nothing here is redrawn or restyled.
 */
import sharp from 'sharp';
import { unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src/assets/source/poster.jpg', import.meta.url));
const OUT = fileURLToPath(new URL('../public/images/', import.meta.url));

const jobs = [
  { name: 'logo-salem-parenting-club', box: { left: 82, top: 28, width: 345, height: 125 }, w: 690, fmt: 'png' },
  { name: 'logo-toastmasters', box: { left: 828, top: 48, width: 150, height: 104 }, w: 300, fmt: 'png' },
  { name: 'hero-microphone', box: { left: 716, top: 168, width: 302, height: 330 }, w: 954, fmt: 'jpg' },
  { name: 'category-kids', box: { left: 10, top: 688, width: 326, height: 198 }, w: 978, fmt: 'jpg' },
  { name: 'category-teens', box: { left: 356, top: 688, width: 318, height: 198 }, w: 978, fmt: 'jpg' },
  { name: 'category-adults', box: { left: 696, top: 688, width: 326, height: 198 }, w: 978, fmt: 'jpg' },
  // Portrait crops used in the editorial sections. Taking a different framing of
  // the same poster artwork keeps one visual cast across the site without showing
  // the identical photograph twice.
  { name: 'story-teen', box: { left: 366, top: 690, width: 148, height: 192 }, w: 592, fmt: 'jpg' },
  { name: 'story-kid', box: { left: 20, top: 690, width: 148, height: 192 }, w: 592, fmt: 'jpg' },
  { name: 'trophy', box: { left: 57, top: 1270, width: 175, height: 133 }, w: 582, fmt: 'png' },
];

for (const { name, box, w, fmt } of jobs) {
  const pipe = sharp(SRC).extract(box).resize({ width: w, withoutEnlargement: false });
  if (fmt === 'png') await pipe.png({ compressionLevel: 9 }).toFile(`${OUT}${name}.png`);
  else await pipe.jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT}${name}.jpg`);
  console.log('wrote', name + '.' + fmt);
}

/**
 * The trophy sits on the poster's ivory background, which reads as an ugly white
 * box once it is placed on the navy Prizes band. Flood-filling the near-white
 * background inward from the edges makes it transparent without touching the
 * trophy's own light highlights, which are enclosed by gold and never reached.
 */
async function cutOutTrophy() {
  const file = `${OUT}trophy.png`
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const isBackground = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    // The poster's ivory/white background…
    const nearWhite = r > 214 && g > 206 && b > 194 && Math.max(r, g, b) - Math.min(r, g, b) < 26
    // …and the navy band that clips the corners of this crop. Neither colour
    // occurs inside the trophy itself, which is entirely gold.
    const navy = b > 35 && b > r + 14 && r < 150 && g < 160
    return nearWhite || navy
  }

  // Every background-coloured pixel goes, wherever it sits — the gaps enclosed by
  // the cup's handles are the same flat white as the surround, and a flood fill
  // seeded from the border can never reach them. The saturation test above is what
  // protects the trophy: its own highlights are pale gold, never neutral white.
  const seen = new Uint8Array(width * height)
  for (let p = 0; p < width * height; p++) {
    const i = p * channels
    if (!isBackground(i)) continue
    seen[p] = 1
    data[i + 3] = 0
  }

  for (let p = 0; p < width * height; p++) {
    if (seen[p]) continue
    const x = p % width
    const y = (p - x) / width
    const touchesBackground =
      (x > 0 && seen[p - 1]) ||
      (x < width - 1 && seen[p + 1]) ||
      (y > 0 && seen[p - width]) ||
      (y < height - 1 && seen[p + width])
    if (!touchesBackground) continue
    const i = p * channels
    const lightest = Math.min(data[i], data[i + 1], data[i + 2])
    if (lightest > 198) {
      data[i + 3] = 0
    } else if (lightest > 178) {
      // Narrow ramp, so the gold edge still lands softly against the navy.
      data[i + 3] = Math.round(255 * (1 - (lightest - 178) / 20))
    }
  }

  const label = new Int32Array(width * height).fill(-1)
  const sizes = []
  for (let start = 0; start < width * height; start++) {
    if (label[start] !== -1 || data[start * channels + 3] < 24) continue
    const id = sizes.length
    let count = 0
    const stack = [start]
    label[start] = id
    while (stack.length) {
      const p = stack.pop()
      count++
      const x = p % width
      const y = (p - x) / width
      const neighbours = []
      if (x > 0) neighbours.push(p - 1)
      if (x < width - 1) neighbours.push(p + 1)
      if (y > 0) neighbours.push(p - width)
      if (y < height - 1) neighbours.push(p + width)
      for (const n of neighbours) {
        if (label[n] !== -1 || data[n * channels + 3] < 24) continue
        label[n] = id
        stack.push(n)
      }
    }
    sizes.push(count)
  }
  const biggest = sizes.indexOf(Math.max(...sizes))
  for (let p = 0; p < width * height; p++) {
    if (label[p] !== -1 && label[p] !== biggest) data[p * channels + 3] = 0
  }
  console.log(`  trophy: kept 1 of ${sizes.length} shapes`)

  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}trophy-cutout.png`)
  // The opaque intermediate is never shipped.
  await unlink(file)
  console.log('wrote trophy-cutout.png')
}

await cutOutTrophy()
