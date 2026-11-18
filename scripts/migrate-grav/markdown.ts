/**
 * Grav (Parsedown, Markdown Extra off) → HTML, reproducing the parts of Parsedown's behaviour
 * the old content depends on:
 * - a line starting with a block-level tag opens an HTML block that lasts until the matching
 *   closing tag (CommonMark would end it at the first blank line and turn indented lines into
 *   code blocks);
 * - markdown inside HTML blocks is NOT parsed;
 * - `#Heading` without a space is a heading;
 * - Grav link attributes: `[x](https://a.b/?target=_blank&rel=noopener)` → target/rel attributes.
 */
import { marked } from 'marked'

// Parsedown's "text level" elements: a line starting with one of these is NOT an HTML block.
const TEXT_LEVEL = new Set(
  'a br bdo abbr blink nextid acronym basefont b em big cite small spacer listing tt i rp del code strike marquee q rt ins font strong s dfn u var sub samp kbd span sup img label'.split(
    ' ',
  ),
)
const VOID = new Set(
  'area base br col embed hr img input link meta param source track wbr'.split(' '),
)

type Segment = { kind: 'html' | 'md'; text: string }

/**
 * A line of only text-level tags (`<br>`) that starts a paragraph: Parsedown makes it paragraph
 * text (and a following `## heading` still starts a heading), CommonMark/marked an HTML block that
 * swallows everything up to the next blank line. An empty <span> in front keeps marked from
 * seeing an HTML block start; the span itself produces no content.
 */
function startsParagraphWithTextTags(line: string, mdSoFar: string[]) {
  const tags = line.match(/<\/?([a-zA-Z][\w-]*)[^>]*>/g)
  if (!tags || line.replace(/<[^>]*>/g, '').trim()) return false
  if (
    !tags.every((t) =>
      TEXT_LEVEL.has(
        t
          .replace(/^<\/?/, '')
          .split(/[\s>/]/)[0]
          .toLowerCase(),
      ),
    )
  )
    return false
  // a paragraph starts unless the previous line is paragraph text (blank lines, code fences,
  // headings, list items end/aren't paragraphs)
  const prev = mdSoFar[mdSoFar.length - 1]
  return prev === undefined || !prev.trim() || /^\s*(```|~~~|#{1,6}\s|[-*+]\s|\d+\.\s|>)/.test(prev)
}

export function splitSegments(source: string): Segment[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const segments: Segment[] = []
  let md: string[] = []
  const flushMd = () => {
    if (md.join('').trim()) segments.push({ kind: 'md', text: md.join('\n') })
    md = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const comment = /^ {0,3}<!--/.test(line)
    const open = line.match(/^ {0,3}<([a-zA-Z][\w-]*)/)
    const tag = open?.[1].toLowerCase()
    if (!comment && (!tag || TEXT_LEVEL.has(tag))) {
      md.push(startsParagraphWithTextTags(line, md) ? `<span></span>${line}` : line)
      continue
    }
    flushMd()
    const block: string[] = []
    if (comment) {
      while (i < lines.length) {
        block.push(lines[i])
        if (lines[i].includes('-->')) break
        i++
      }
    } else if (VOID.has(tag!)) {
      block.push(line)
    } else {
      const openRe = new RegExp(`<${tag}(?=[\\s>/])`, 'gi')
      const closeRe = new RegExp(`</${tag}\\s*>`, 'gi')
      let depth = 0
      while (i < lines.length) {
        block.push(lines[i])
        depth += (lines[i].match(openRe)?.length ?? 0) - (lines[i].match(closeRe)?.length ?? 0)
        if (depth <= 0) break
        i++
      }
    }
    segments.push({ kind: 'html', text: block.join('\n') })
  }
  flushMd()
  return segments
}

/** Grav: query params target/rel on a link URL become attributes. */
export function applyGravLinkAttributes(html: string): string {
  return html.replace(/<a\s+href="([^"]*)"/g, (whole, href: string) => {
    const decoded = href.replace(/&amp;/g, '&')
    const q = decoded.indexOf('?')
    if (q === -1) return whole
    const params = new URLSearchParams(decoded.slice(q + 1))
    const target = params.get('target')
    const rel = params.get('rel')
    if (!target && !rel) return whole
    params.delete('target')
    params.delete('rel')
    const rest = params.toString()
    const clean = (decoded.slice(0, q) + (rest ? `?${rest}` : '')).replace(/&/g, '&amp;')
    return `<a href="${clean}"${target ? ` target="${target}"` : ''}${rel ? ` rel="${rel}"` : ''}`
  })
}

export function gravMarkdownToHtml(source: string): string {
  const html = splitSegments(source)
    .map((s) =>
      s.kind === 'html'
        ? s.text
        : (marked.parse(s.text.replace(/^(#{1,6})(?=[^#\s])/gm, '$1 '), {
            async: false,
            gfm: true,
          }) as string),
    )
    .join('\n')
  return applyGravLinkAttributes(html)
}
