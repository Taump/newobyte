/**
 * Captures the reference ("baseline") state of the old obyte.org for parity checks:
 *   tests/fixtures/baseline/<site>/screens/<slug>@<width>.png  — full-page screenshots
 *   tests/fixtures/baseline/<site>/head/<slug>.json            — <head>: title, meta, link, JSON-LD
 *   tests/fixtures/baseline/<site>/styles/<slug>@<width>.json  — computed styles + boxes of elements
 *
 * The same script can be pointed at the new site, so both captures are produced identically:
 *   pnpm baseline                                  # https://obyte.org → tests/fixtures/baseline/old
 *   pnpm baseline --base http://localhost:3000 --out new
 *   pnpm baseline --only /,/faq --widths 1440      # subset
 *   pnpm baseline --states                         # interactive states only (menus, scrolled header…)
 *
 * The output is gitignored (hundreds of MB). Archive tests/fixtures/baseline/old before the DNS
 * switch — after that obyte.org serves the new site and the old reference is gone.
 */
import { chromium, type Browser, type Page } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'

const { values: args } = parseArgs({
  options: {
    base: { type: 'string', default: 'https://obyte.org' },
    out: { type: 'string', default: 'old' },
    only: { type: 'string' },
    widths: { type: 'string', default: '1440,768,375' },
    concurrency: { type: 'string', default: '3' },
    states: { type: 'boolean', default: false },
  },
})

const BASE = args.base!.replace(/\/$/, '')
const OUT = path.resolve('tests/fixtures/baseline', args.out!)
const WIDTHS = args.widths!.split(',').map(Number)
const CONCURRENCY = Number(args.concurrency)

// Routes of the old site (from https://obyte.org/sitemap, 2026-11-17).
export const ROUTES = [
  '/',
  '/applications',
  '/platform',
  '/platform/autonomous-agents',
  '/platform/smart-contracts',
  '/platform/identity',
  '/platform/payment-channels',
  '/platform/oracles',
  '/platform/tokens',
  '/platform/blackbytes',
  '/platform/textcoins',
  '/platform/prosaic-contracts',
  '/platform/chatbots',
  '/platform/iot',
  '/platform/iot/proofs-of-concept',
  '/technology',
  '/technology/order-providers',
  '/developers',
  '/faq',
  '/contact',
  '/careers',
  '/community-projects',
  '/distribution',
  '/distribution/world-community-grid',
  '/events',
  '/grants',
  '/legal',
  '/legal/privacy',
  '/legal/terms',
  '/resources',
  '/testnet',
]

const slugOf = (route: string) => (route === '/' ? 'home' : route.slice(1).replace(/\//g, '__'))

/** Freeze everything that moves so screenshots are deterministic. */
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important; animation-delay: 0s !important;
    transition-duration: 0s !important; transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  iframe { visibility: hidden !important; }
`

async function freeze(page: Page) {
  await page.addStyleTag({ content: FREEZE_CSS })
  // SMIL scenes (home "Evolution of ledgers"): pause at t=0 inside every <object> SVG.
  await page.evaluate(() => {
    for (const obj of Array.from(document.querySelectorAll('object'))) {
      const svg = (obj as HTMLObjectElement).contentDocument?.documentElement as unknown as
        SVGSVGElement | undefined
      if (svg && 'pauseAnimations' in svg) {
        svg.pauseAnimations()
        svg.setCurrentTime(0)
      }
    }
  })
}

/** Scroll through the page so lazy images load, then back to top. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
}

async function captureHead(page: Page) {
  return page.evaluate(() => {
    const attrs = (el: Element) =>
      Object.fromEntries(Array.from(el.attributes).map((a) => [a.name, a.value]))
    return {
      title: document.title,
      htmlLang: document.documentElement.lang,
      meta: Array.from(document.head.querySelectorAll('meta')).map(attrs),
      link: Array.from(document.head.querySelectorAll('link')).map(attrs),
      jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
        (s) => {
          try {
            return JSON.parse(s.textContent || '')
          } catch {
            return { _unparsed: s.textContent }
          }
        },
      ),
    }
  })
}

const STYLE_PROPS = [
  'display',
  'position',
  'width',
  'height',
  'max-width',
  'min-height',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-transform',
  'text-align',
  'color',
  'background-color',
  'background-image',
  'background-size',
  'background-position',
  'border-top',
  'border-bottom',
  'border-left',
  'border-right',
  'border-radius',
  'box-shadow',
  'opacity',
  'gap',
  'flex-direction',
  'justify-content',
  'align-items',
  'z-index',
  'object-fit',
  'text-decoration-line',
]

/** Computed styles + geometry of every visible element under <body>, keyed by a readable path. */
async function captureStyles(page: Page) {
  return page.evaluate((props) => {
    const out: Array<Record<string, unknown>> = []
    const pathOf = (el: Element): string => {
      const parts: string[] = []
      for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) {
        let p = e.tagName.toLowerCase()
        if (e.id) p += `#${e.id}`
        if (e.classList.length) p += '.' + Array.from(e.classList).join('.')
        const sibs = e.parentElement ? Array.from(e.parentElement.children) : []
        const same = sibs.filter((s) => s.tagName === e!.tagName)
        if (same.length > 1) p += `:nth-of-type(${same.indexOf(e) + 1})`
        parts.unshift(p)
      }
      return parts.join(' > ')
    }
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'BR'].includes(el.tagName)) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      const style: Record<string, string> = {}
      for (const p of props) style[p] = cs.getPropertyValue(p)
      for (const pseudo of ['::before', '::after']) {
        const ps = getComputedStyle(el, pseudo)
        if (ps.content && ps.content !== 'none' && ps.content !== 'normal') {
          const pst: Record<string, string> = { content: ps.content }
          for (const p of props) pst[p] = ps.getPropertyValue(p)
          style[pseudo] = JSON.stringify(pst)
        }
      }
      out.push({
        path: pathOf(el),
        text: el.children.length === 0 ? (el.textContent || '').trim().slice(0, 80) : undefined,
        box: {
          x: Math.round(r.x),
          y: Math.round(r.y + window.scrollY),
          w: Math.round(r.width),
          h: Math.round(r.height),
        },
        style,
      })
    }
    return out
  }, STYLE_PROPS)
}

/**
 * Interactive states that a static full-page screenshot can't show. Screenshots are of the
 * viewport (fixed overlays/menus), styles of the whole document in that state.
 */
type State = { name: string; route: string; width: number; act: (page: Page) => Promise<void> }
const TEXTCOIN = '/#textcoin?fringe-scheme-erode-wish-cross-mule-snack-river-tired-pencil-claw-toe'
export const STATES: State[] = [
  { name: 'menu-open', route: '/', width: 375, act: (p) => p.click('#toggle') },
  {
    name: 'menu-open-submenu',
    route: '/',
    width: 375,
    act: async (p) => {
      await p.click('#toggle')
      await p.waitForTimeout(400)
      // old: jQuery treemenu `.toggler`; new: button[data-toggler]
      await p.locator('#overlay li:has(> ul) > .toggler, #overlay [data-toggler]').first().click()
    },
  },
  {
    name: 'dropdown',
    route: '/',
    width: 1440,
    act: (p) =>
      p.hover('nav.dropmenu > ul > li:nth-child(2) > a, #header nav > ul > li:nth-child(2) > a'),
  },
  {
    name: 'header-scrolled',
    route: '/faq',
    width: 1440,
    act: (p) => p.evaluate(() => window.scrollTo(0, 300)),
  },
  {
    name: 'header-scrolled',
    route: '/faq',
    width: 375,
    act: (p) => p.evaluate(() => window.scrollTo(0, 300)),
  },
  { name: 'textcoin', route: TEXTCOIN, width: 1440, act: async () => {} },
  { name: 'textcoin', route: TEXTCOIN, width: 375, act: async () => {} },
]

async function newPage(browser: Browser, width: number) {
  const context = await browser.newContext({
    viewport: { width, height: width >= 1024 ? 900 : width >= 768 ? 1024 : 812 },
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  })
  // tsx/esbuild wraps named functions in `__name(...)`; make it exist inside page.evaluate.
  await context.addInitScript('window.__name = (fn) => fn')
  return { context, page: await context.newPage() }
}

async function captureState(browser: Browser, state: State) {
  const { context, page } = await newPage(browser, state.width)
  await page.goto(BASE + state.route, { waitUntil: 'load', timeout: 60_000 })
  await settle(page)
  await state.act(page)
  await page.waitForTimeout(800) // let CSS transitions finish
  await freeze(page)
  const id = `state-${state.name}@${state.width}`
  await page.screenshot({ path: path.join(OUT, 'screens', `${id}.png`) })
  await fs.writeFile(
    path.join(OUT, 'styles', `${id}.json`),
    JSON.stringify(await captureStyles(page), null, 1),
  )
  await context.close()
  console.log(`✓ ${id}`)
}

async function captureRoute(browser: Browser, route: string) {
  const slug = slugOf(route)
  for (const width of WIDTHS) {
    const { context, page } = await newPage(browser, width)
    await page.goto(BASE + route, { waitUntil: 'load', timeout: 60_000 })
    await settle(page)
    await freeze(page)

    await page.screenshot({
      path: path.join(OUT, 'screens', `${slug}@${width}.png`),
      fullPage: true,
    })
    const styles = await captureStyles(page)
    await fs.writeFile(
      path.join(OUT, 'styles', `${slug}@${width}.json`),
      JSON.stringify(styles, null, 1),
    )
    if (width === WIDTHS[0]) {
      const head = await captureHead(page)
      await fs.writeFile(path.join(OUT, 'head', `${slug}.json`), JSON.stringify(head, null, 2))
    }
    await context.close()
  }
  console.log(`✓ ${route}`)
}

async function main() {
  const routes = args.only ? args.only.split(',') : ROUTES
  for (const dir of ['screens', 'head', 'styles']) {
    await fs.mkdir(path.join(OUT, dir), { recursive: true })
  }
  const browser = await chromium.launch()
  if (args.states) {
    for (const state of STATES) await captureState(browser, state)
    await browser.close()
    return
  }
  const queue = [...routes]
  const failures: string[] = []
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let route = queue.shift(); route; route = queue.shift()) {
        try {
          await captureRoute(browser, route)
        } catch (err) {
          failures.push(route)
          console.error(`✗ ${route}:`, (err as Error).message)
        }
      }
    }),
  )
  await browser.close()
  await fs.writeFile(
    path.join(OUT, 'meta.json'),
    JSON.stringify(
      { base: BASE, widths: WIDTHS, capturedAt: new Date().toISOString(), routes },
      null,
      2,
    ),
  )
  if (failures.length) {
    console.error(`Failed: ${failures.join(', ')}`)
    process.exit(1)
  }
}

main()
