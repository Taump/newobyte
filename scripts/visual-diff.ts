/**
 * Pixel comparison of baseline captures: old site vs new site (same capture id).
 *
 *   pnpm visual:diff faq@1440                       # whole page
 *   pnpm visual:diff faq@1440 --clip 0,0,1440,100   # region x,y,w,h (e.g. the header)
 *   pnpm visual:diff faq@1440 --bottom 1000         # last N pixels (footer)
 *
 * Writes tests/fixtures/baseline/diff/<id>.png (old | diff | new) and prints the mismatch %.
 * Pages of different height are compared over the common height (and the difference reported).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'

import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    clip: { type: 'string' },
    bottom: { type: 'string' },
    threshold: { type: 'string', default: '0.1' },
  },
})
const [id] = positionals
if (!id) throw new Error('usage: visual-diff <slug@width> [--clip x,y,w,h | --bottom N]')

const root = 'tests/fixtures/baseline'
const read = async (site: string) =>
  PNG.sync.read(await fs.readFile(path.join(root, site, 'screens', `${id}.png`)))
const [a, b] = await Promise.all([read('old'), read('new')])

const crop = (img: PNG, x: number, y: number, w: number, h: number) => {
  const out = new PNG({ width: w, height: h })
  PNG.bitblt(img, out, x, y, Math.min(w, img.width - x), Math.min(h, img.height - y), 0, 0)
  return out
}

let region: [number, number, number, number]
const width = Math.min(a.width, b.width)
if (opts.clip) region = opts.clip.split(',').map(Number) as typeof region
else if (opts.bottom) {
  const n = Number(opts.bottom)
  region = [0, 0, width, n] // computed per image below
} else region = [0, 0, width, Math.min(a.height, b.height)]

const [x, y, w, h] = region
const ca = opts.bottom ? crop(a, 0, a.height - h, w, h) : crop(a, x, y, w, h)
const cb = opts.bottom ? crop(b, 0, b.height - h, w, h) : crop(b, x, y, w, h)
const diff = new PNG({ width: w, height: h })
const changed = pixelmatch(ca.data, cb.data, diff.data, w, h, { threshold: Number(opts.threshold) })

const sheet = new PNG({ width: w * 3, height: h })
PNG.bitblt(ca, sheet, 0, 0, w, h, 0, 0)
PNG.bitblt(diff, sheet, 0, 0, w, h, w, 0)
PNG.bitblt(cb, sheet, 0, 0, w, h, w * 2, 0)
const outDir = path.join(root, 'diff')
await fs.mkdir(outDir, { recursive: true })
const out = path.join(outDir, `${id}${opts.clip ? `-clip` : opts.bottom ? '-bottom' : ''}.png`)
await fs.writeFile(out, PNG.sync.write(sheet))

const pct = ((changed / (w * h)) * 100).toFixed(2)
console.log(`${id}: ${pct}% pixels differ (${changed}/${w * h}) → ${out}`)
if (a.height !== b.height) console.log(`page height: old ${a.height}px, new ${b.height}px`)
