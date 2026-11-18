/**
 * Frame-by-frame comparison of the home "Evolution of ledgers" SMIL scenes, old vs new site.
 * Each scene's <object> is paused at fixed times (SVG pauseAnimations + setCurrentTime) and the
 * scene block is screenshotted on both sites, then compared with pixelmatch.
 *
 *   pnpm compare:animation --new http://localhost:3005 [--old https://obyte.org] [--width 1440]
 *
 * Output: tests/fixtures/baseline/diff/animation-<scene>-<t>s.png (old | diff | new).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'

import { chromium, type Page } from '@playwright/test'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

const { values: opts } = parseArgs({
  options: {
    old: { type: 'string', default: 'https://obyte.org' },
    new: { type: 'string', default: 'http://localhost:3000' },
    width: { type: 'string', default: '1440' },
  },
})

const TIMES = [0, 2, 5, 8, 11]
/** old site.js switches scenes at 12 s / 32 s; Replay restarts from scene 1 */
const SCENE_STARTS = [0, 12_000, 32_000]
const OUT = path.resolve('tests/fixtures/baseline/diff')

async function open(url: string) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: Number(opts.width), height: 900 } })
  await page.clock.install()
  await page.goto(url, { waitUntil: 'networkidle' })
  // bring the section into view (new site loads the SVGs lazily; both restart on scroll)
  await page.getByText('Evolution of ledgers').first().scrollIntoViewIfNeeded()
  return { browser, page }
}

/** The object of the visible scene, its SVG loaded. */
async function sceneObject(page: Page) {
  const obj = page.locator('object[type="image/svg+xml"]').first()
  await page.waitForFunction(
    () =>
      !!(document.querySelector('object[type="image/svg+xml"]') as HTMLObjectElement | null)
        ?.contentDocument?.documentElement,
  )
  return obj
}

async function frame(page: Page, t: number) {
  const obj = await sceneObject(page)
  await obj.evaluate((o: HTMLObjectElement, time) => {
    const svg = o.contentDocument!.documentElement as unknown as SVGSVGElement
    svg.pauseAnimations()
    svg.setCurrentTime(time)
  }, t)
  await page.waitForTimeout(100)
  return PNG.sync.read(await obj.screenshot())
}

const sites = { old: await open(opts.old!), new: await open(opts.new!) }
await fs.mkdir(OUT, { recursive: true })
let worst = 0
for (const [i, start] of SCENE_STARTS.entries()) {
  for (const s of Object.values(sites))
    await s.page.clock.runFor(start - (SCENE_STARTS[i - 1] ?? 0))
  for (const t of TIMES) {
    const [a, b] = [await frame(sites.old.page, t), await frame(sites.new.page, t)]
    const w = Math.min(a.width, b.width)
    const h = Math.min(a.height, b.height)
    const crop = (p: PNG) => {
      const c = new PNG({ width: w, height: h })
      PNG.bitblt(p, c, 0, 0, w, h, 0, 0)
      return c
    }
    const [ca, cb] = [crop(a), crop(b)]
    const diff = new PNG({ width: w, height: h })
    const n = pixelmatch(ca.data, cb.data, diff.data, w, h, { threshold: 0.1 })
    const pct = (100 * n) / (w * h)
    worst = Math.max(worst, pct)
    const sheet = new PNG({ width: w * 3, height: h })
    PNG.bitblt(ca, sheet, 0, 0, w, h, 0, 0)
    PNG.bitblt(diff, sheet, 0, 0, w, h, w, 0)
    PNG.bitblt(cb, sheet, 0, 0, w, h, w * 2, 0)
    const file = path.join(OUT, `animation-scene${i + 1}-${t}s.png`)
    await fs.writeFile(file, PNG.sync.write(sheet))
    const size =
      a.width === b.width && a.height === b.height
        ? ''
        : ` (size ${a.width}×${a.height} vs ${b.width}×${b.height})`
    console.log(`scene ${i + 1} t=${t}s: ${pct.toFixed(2)}%${size}`)
  }
}
for (const s of Object.values(sites)) await s.browser.close()
console.log(`worst frame: ${worst.toFixed(2)}%`)
