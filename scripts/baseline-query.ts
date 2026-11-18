/**
 * Query computed styles captured by `pnpm baseline` — the reference for porting a component.
 *
 *   pnpm baseline:query home@1440 '#header'               # elements whose path matches the regex
 *   pnpm baseline:query home@375 'mobile-menu' --all      # include default-looking values
 *   pnpm baseline:query faq@1440 'white-block' --limit 3
 *   pnpm baseline:query faq@1440 'h4' --site new          # same query against a capture of the new site
 *   --full prints the whole element path (default: last 3 segments)
 *
 * Output: one block per element — path, box (x,y,w,h) and the style values that differ from
 * browser defaults and are not simply inherited from the parent (pseudo-elements included).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    site: { type: 'string', default: 'old' },
    limit: { type: 'string', default: '40' },
    all: { type: 'boolean', default: false },
    full: { type: 'boolean', default: false },
  },
})

const [capture, pattern = '.'] = positionals
if (!capture) {
  console.error(
    'usage: baseline-query <slug@width> [path-regex] [--site old|new] [--limit N] [--all]',
  )
  process.exit(1)
}

type Entry = {
  path: string
  text?: string
  box: Record<string, number>
  style: Record<string, string>
}

const BORING = new Set([
  'auto',
  'none',
  'normal',
  '0px',
  'static',
  'visible',
  'rgba(0, 0, 0, 0)',
  '0px none rgb(0, 0, 0)',
  'start',
  'row',
  '1',
])

// Inherited properties are only shown where they change relative to the parent element.
const INHERITED = new Set([
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-transform',
  'text-align',
  'color',
])

const file = path.resolve('tests/fixtures/baseline', opts.site!, 'styles', `${capture}.json`)
const entries: Entry[] = JSON.parse(await fs.readFile(file, 'utf8'))
const byPath = new Map(entries.map((e) => [e.path, e]))
const parentOf = (p: string) => byPath.get(p.split(' > ').slice(0, -1).join(' > '))
const re = new RegExp(pattern)
const matches = entries.filter((e) => re.test(e.path)).slice(0, Number(opts.limit))

for (const e of matches) {
  const { x, y, w, h } = e.box
  const shown = opts.full ? e.path : e.path.split(' > ').slice(-3).join(' > ')
  console.log(`\n${shown}${e.text ? `  “${e.text}”` : ''}\n  box ${x},${y} ${w}×${h}`)
  const parent = parentOf(e.path)
  for (const [k, v] of Object.entries(e.style)) {
    if (k.startsWith('::')) {
      // pseudo-element: show content + the non-default values in one line
      const ps: Record<string, string> = JSON.parse(v)
      if (!opts.all && ps.display === 'none') continue
      const shown = Object.entries(ps)
        .filter(
          ([pk, pv]) =>
            pk === 'content' ||
            opts.all ||
            !(BORING.has(pv) || pv.startsWith('0px ') || INHERITED.has(pk)),
        )
        .map(([pk, pv]) => `${pk}: ${pv}`)
      console.log(`  ${k} { ${shown.join('; ')} }`)
      continue
    }
    if (k === 'width' || k === 'height') continue // already in `box`
    if (!opts.all && (BORING.has(v) || (k.startsWith('border-') && v.startsWith('0px')))) continue
    if (!opts.all && INHERITED.has(k) && parent?.style[k] === v) continue
    console.log(`  ${k}: ${v}`)
  }
}
console.error(`\n${matches.length} of ${entries.filter((e) => re.test(e.path)).length} matches`)
