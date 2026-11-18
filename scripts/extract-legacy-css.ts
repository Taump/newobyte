/**
 * Generates src/shared/styles/legacy.css — the page-specific styles of the old inner pages,
 * taken from the CSS the old site actually served (Spectre + theme.min.css, in that order).
 *
 * Inner pages differ a lot (≈700 rules unique to one page or another), so instead of rewriting
 * them as Tailwind classes they are ported as-is: content blocks render the old markup and class
 * names (flex-block, sub-block, dev-blog …) and these rules style them. Kept: every selector that
 * targets an article variant class (`.smart-contracts-wrap …`) or a class used in the old article
 * markup, minus anything belonging to the header/footer/home sections (ported to Tailwind).
 * `url(../assets/…)` files are copied to src/shared/assets/legacy/ (JPEG/PNG as WebP) and bundled
 * by Next.
 *
 *   pnpm extract:legacy-css [--theme old-site/docroot/user/themes/obyte]
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'

import postcss, { type AtRule, type Declaration, type Root, type Rule } from 'postcss'
import sharp from 'sharp'

import { ARTICLE_VARIANTS, TEXT_WIDE_VARIANTS } from '../src/shared/cms/variants'

const { values: args } = parseArgs({
  options: { theme: { type: 'string', default: 'old-site/docroot/user/themes/obyte' } },
})
const THEME = path.resolve(args.theme!)
const OUT = path.resolve('src/shared/styles/legacy.css')
const BACKGROUNDS_OUT = path.resolve('src/shared/styles/legacyBackgrounds.ts')
const ASSETS = path.resolve('src/shared/assets/legacy')

/** Classes used inside the old article markdown (inner pages) that content blocks render. */
const CONTENT_CLASSES = new Set(
  `all-link attestor-block attestors-list blackbytes-block blackbytes-details blue bottom bullet
  bullet-padding cat categories-list category category-block center content-block content-img
  content-small content-wrap d-flex d-inline-flex date dev-blog dev-img-block distribution-block
  element-block event-block fancy-list first five flex-block flex-list flex-text four google-block
  iframe-block iframe-wrap img-block img1 img2 info-block info-img inner-wrap left link-list
  list-block max-width med-width mobile one providers resource-block resources-list right second
  section-heading seven six small sub-block sub-paragraph sub-text sub-text-block sub-title
  text-block third three title title-block top-block two video-block w-550 w-670 w-745 white
  white-block grid-xl section container`.split(/\s+/),
)
const VARIANTS = new Set<string>([...ARTICLE_VARIANTS, ...TEXT_WIDE_VARIANTS])

/**
 * Header, footer, mobile menu, home sections, textcoin banner, newsletter (done in Tailwind) and
 * old templates no page uses any more (modular-features, article-wrap …).
 */
const EXCLUDED = new Set(
  `navbar logo desktop-menu dropmenu mobile-menu mobile-logo mobile-container overlay treemenu
  toggle-btn new-hero comparison quote-component quote-wrap-big technology clip-container
  scene-block independent independent-bg independent-overlay big-changes timeline-wrap
  swiper-outer-wrap swiper-container swiper-slide downloads-wrap team-wrap member exchanges-wrap
  exchange-block coin-block checkout-wrap twelve-words-wrap modular-hero ml-form-embedContainer
  textcoin-wrap wechat-wrap btn
  smart-contracts link community-wrap article-wrap articles-list-wrap article-content
  modular-features modular-text`.split(/\s+/),
)
const EXCLUDED_IDS = /#(header|footer|textcoin|toggle|overlay|to-top|to-start|mlb2)/

const classesOf = (selector: string) =>
  [...selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1])

function keepSelector(selector: string) {
  if (EXCLUDED_IDS.test(selector)) return false
  const cls = classesOf(selector)
  if (cls.some((c) => EXCLUDED.has(c))) return false
  return cls.some((c) => VARIANTS.has(c) || CONTENT_CLASSES.has(c))
}

/** Keeps matching rules (and only their matching selectors); drops everything else. */
function filter(root: Root) {
  root.walkRules((rule: Rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/.test((rule.parent as AtRule).name)) return
    const kept = rule.selectors.filter(keepSelector)
    if (kept.length) rule.selectors = kept
    else rule.remove()
  })
  root.walkAtRules((at) => {
    if (/keyframes|font-face|charset|import/.test(at.name)) at.remove()
    else if (!at.nodes?.length) at.remove()
  })
}

const exists = (file: string) =>
  fs.access(file).then(
    () => true,
    () => false,
  )

const URL_RE = /url\((['"]?)([^'")]+)\1\)/g
const isLocal = (url: string) => !/^(data:|https?:|#)/.test(url)

/**
 * Copies a theme asset next to legacy.css. JPEG/PNG become WebP (the old files were not
 * compressed for the web: header photos of 300–650 KB) unless WebP comes out larger.
 */
/** generated file → theme file it came from */
const SOURCE_OF = new Map<string, string>()

async function copyAsset(file: string): Promise<string> {
  const rel = path.relative(path.join(THEME, 'assets'), file)
  if (rel.startsWith('..')) throw new Error(`asset outside theme/assets: ${file}`)
  const dest = path.join(ASSETS, rel)
  await fs.mkdir(path.dirname(dest), { recursive: true })
  if (/\.(jpe?g|png)$/i.test(file)) {
    const webp = dest.replace(/\.\w+$/, '.webp')
    const png = /\.png$/i.test(file)
    const data = await sharp(file)
      .webp(png ? { quality: 90, alphaQuality: 100, effort: 6 } : { quality: 82, effort: 6 })
      .toBuffer()
    if (data.byteLength < (await fs.stat(file)).size) {
      await fs.writeFile(webp, data)
      SOURCE_OF.set(webp, file)
      return webp
    }
  }
  await fs.copyFile(file, dest)
  SOURCE_OF.set(dest, file)
  return dest
}

async function copyAssets(root: Root, fromDir: string) {
  const decls: Declaration[] = []
  root.walkDecls((d) => {
    if (d.value.includes('url(')) decls.push(d)
  })
  const fileOf = (url: string) => path.resolve(fromDir, url.split(/[?#]/)[0])
  const copied = new Map<string, Promise<string>>()
  const kept: Declaration[] = []
  for (const decl of decls) {
    const files = [...decl.value.matchAll(URL_RE)]
      .map((m) => m[2])
      .filter(isLocal)
      .map(fileOf)
    const missing = []
    for (const f of files) if (!(await exists(f))) missing.push(f)
    if (missing.length) {
      // the old site requested these and got 404 — the declaration never had an effect
      console.warn(`  dropped (missing file): ${decl.toString()}`)
      decl.remove()
      continue
    }
    for (const f of files) if (!copied.has(f)) copied.set(f, copyAsset(f))
    kept.push(decl)
  }
  const dests = new Map<string, string>()
  for (const [file, dest] of copied) dests.set(file, await dest)
  for (const decl of kept) {
    decl.value = decl.value.replace(URL_RE, (all, _q, url: string) => {
      if (!isLocal(url)) return all
      const dest = dests.get(fileOf(url))!
      return `url('${path.relative(path.dirname(OUT), dest).split(path.sep).join('/')}')`
    })
  }
}

const sources = ['css-compiled/spectre.min.css', 'css-compiled/theme.min.css']
// regenerated from scratch: no files left over from earlier runs
await fs.rm(ASSETS, { recursive: true, force: true })
let out = ''
for (const src of sources) {
  const file = path.join(THEME, src)
  const root = postcss.parse(await fs.readFile(file, 'utf8'), { from: file })
  filter(root)
  await copyAssets(root, path.dirname(file))
  out += `\n/* ── from ${src} ── */\n${root.toString()}\n`
}

const header = `/*
 * GENERATED by scripts/extract-legacy-css.ts — do not edit by hand; re-run the script.
 * Page-specific styles of the old inner pages (see the script for what is kept and why).
 * In the components layer: Tailwind utilities still win, element defaults (base) lose.
 */
`
const css = postcss.parse(out)
css.walkComments((c) => {
  if (!c.text.startsWith('──')) c.remove()
})

/*
 * Accessibility (WCAG AA, Lighthouse color-contrast): the old light blues (#4a90e2, #3085ee) as
 * TEXT colour are below 4.5:1 on the page greys — text uses the site's primary token instead.
 * Backgrounds/borders (bullets, dots, rules) keep the old colour.
 */
const LOW_CONTRAST_TEXT = /^#(4a90e2|3085ee)$/i
css.walkDecls('color', (d) => {
  if (LOW_CONTRAST_TEXT.test(d.value.trim())) d.value = 'var(--color-primary)'
})

/*
 * The header picture of each page variant (`.section.faq-wrap { background: url(…) }`) is the
 * largest element of most inner pages:
 * - the page preloads it (the browser would find it only after loading the CSS) — see the map
 *   written to legacyBackgrounds.ts;
 * - phones get a centre crop: the picture is drawn at its natural size, centred (also in the
 *   ≤768px rules), so a phone only ever shows the middle of a 2473px-wide photo. The crop keeps
 *   the same pixels in view at a third of the size.
 */
const SMALL_MAX = 768
const SMALL_WIDTH = 800
const backgrounds = new Map<string, { selector: string; url: string; small?: string }>()
css.walkRules((rule) => {
  if (rule.parent?.type === 'atrule') return // only the default (desktop-first) rules
  for (const selector of rule.selectors) {
    const variant = /^(?:\.section)?\.([a-z0-9-]+)$/.exec(selector)?.[1]
    if (!variant || !VARIANTS.has(variant) || backgrounds.has(variant)) continue
    rule.walkDecls(/^background(-image)?$/, (d) => {
      const url = /url\((['"]?)([^'")]+)\1\)/.exec(d.value)?.[2]
      if (url && !backgrounds.has(variant)) backgrounds.set(variant, { selector, url })
    })
  }
})
const crops = new Map<string, Promise<string | undefined>>()
async function centreCrop(url: string): Promise<string | undefined> {
  const dest = path.resolve(path.dirname(OUT), url)
  const source = SOURCE_OF.get(dest) ?? dest
  const { width = 0, height = 0 } = await sharp(source).metadata()
  // same parity as the original: the crop's centre lands on the same pixel
  const w = SMALL_WIDTH + ((width - SMALL_WIDTH) % 2)
  if (width <= w) return undefined
  const small = dest.replace(/(\.\w+)$/, '-sm.webp')
  await sharp(source)
    .extract({ left: (width - w) / 2, top: 0, width: w, height })
    .webp(
      /\.png$/i.test(source)
        ? { quality: 90, alphaQuality: 100, effort: 6 }
        : { quality: 82, effort: 6 },
    )
    .toFile(small)
  return path.relative(path.dirname(OUT), small).split(path.sep).join('/')
}
/** Drawn at natural size in every rule of the selector (a scaled picture can't be cropped). */
function naturalSize(selector: string) {
  let natural = true
  css.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return
    rule.walkDecls((d) => {
      if (d.prop === 'background-size' && d.value.trim() !== 'auto') natural = false
      // shorthand `position/size`
      if (d.prop !== 'background') return
      const SIZE = '(?:auto|cover|contain|[\\d.]+(?:px|%|r?em|vw|vh)?)'
      const size = new RegExp(`/\\s*(${SIZE}(?:\\s+${SIZE})?)`).exec(d.value)?.[1]
      if (size && !/^auto(\s+auto)?$/.test(size)) natural = false
    })
  })
  return natural
}
for (const bg of backgrounds.values()) {
  if (!naturalSize(bg.selector)) continue
  if (!crops.has(bg.url)) crops.set(bg.url, centreCrop(bg.url))
  bg.small = await crops.get(bg.url)
}
const smallRules = [...backgrounds.values()]
  .filter((bg) => bg.small)
  .map((bg) => `  ${bg.selector} { background-image: url('${bg.small}'); }`)
css.append(
  postcss.parse(
    `/* ── phones: centre crops of the header pictures (scripts/extract-legacy-css.ts) ── */\n@media (max-width: ${SMALL_MAX}px) {\n${smallRules.join('\n')}\n}`,
  ),
)

await fs.writeFile(OUT, `${header}@layer components {\n${css.toString()}\n}\n`)
const rules = (await fs.readFile(OUT, 'utf8')).match(/\{/g)?.length ?? 0
console.log(`✓ ${path.relative(process.cwd(), OUT)} (${rules} blocks)`)

const files = [...new Set([...backgrounds.values()].flatMap((b) => [b.url, b.small ?? b.url]))]
const name = (url: string) => `bg${files.indexOf(url)}`
await fs.writeFile(
  BACKGROUNDS_OUT,
  `// GENERATED by scripts/extract-legacy-css.ts — the header picture of each page variant
// (\`small\`: the centre crop shown at ≤${SMALL_MAX}px).
${files.map((f) => `import ${name(f)} from ${JSON.stringify(f)}`).join('\n')}

export const SMALL_MAX_WIDTH = ${SMALL_MAX}

export const LEGACY_BACKGROUNDS: Record<string, { src: string; small: string }> = {
${[...backgrounds].map(([v, b]) => `  ${JSON.stringify(v)}: { src: ${name(b.url)}.src, small: ${name(b.small ?? b.url)}.src },`).join('\n')}
}
`,
)
console.log(`✓ ${path.relative(process.cwd(), BACKGROUNDS_OUT)} (${backgrounds.size} variants)`)
