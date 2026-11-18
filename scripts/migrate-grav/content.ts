/**
 * Converts old article HTML into Lexical: recurring markup patterns become content blocks,
 * plain markup becomes rich text, anything unknown becomes a RawHTML block (and is reported).
 */
import { JSDOM } from 'jsdom'

import {
  blockNode,
  htmlToNodes,
  htmlToState,
  nodeId,
  root,
  uploadNode,
  type Editors,
  type EditorState,
  type LexicalNode,
} from './lexical'
import type { MediaImporter } from './media'
import { monthStart } from './month'
import type { Report } from './report'

/** Items that become collection documents instead of page content (see lists.ts). */
export type Collected = {
  events: {
    date: string
    title: string
    content: unknown
    images: { image: number }[]
    video: object
  }[]
  faq: { question: string; answer: unknown }[]
}

export type Ctx = {
  page: string
  editors: Editors
  media: MediaImporter
  report: Report
  collected: Collected
}

/** `<script>document.write('<a href="mailto:o'); document.write('@'); …</script>` → the HTML it wrote. */
export const unobfuscateEmails = (source: string) =>
  source.replace(
    /<script>\s*((?:document\.write\('[^']*'\);?\s*)+)<\/script>/g,
    (_, calls: string) =>
      [...calls.matchAll(/document\.write\('([^']*)'\)/g)].map((m) => m[1]).join(''),
  )

const classes = (el: Element) => Array.from(el.classList)
const has = (el: Element, cls: string) => el.classList.contains(cls)
const isEl = (n: Node): n is Element => n.nodeType === 1
const children = (el: Element) => Array.from(el.children)
const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
/** Classes other than the one that identified the pattern — kept as styling modifiers. */
const otherClasses = (el: Element, cls: string) =>
  classes(el)
    .filter((c) => c !== cls)
    .join(' ') || null
/** `<div class="a b">` — for the report. */
const describe = (el: Element) => `<${el.tagName.toLowerCase()} class="${classes(el).join(' ')}">`

/** YouTube/Vimeo iframe → { provider, videoId } */
export function videoFromIframe(iframe: Element | null) {
  const src = iframe?.getAttribute('src') ?? ''
  const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/)
  if (yt) return { provider: 'youtube', videoId: yt[1] }
  const vimeo = src.match(/player\.vimeo\.com\/video\/(\d+)/)
  if (vimeo) return { provider: 'vimeo', videoId: vimeo[1] }
  return null
}

const bgImageUrl = (el: Element | null) =>
  el?.getAttribute('style')?.match(/url\(['"]?([^'")]+)['"]?\)/)?.[1] ?? null

/** `fallbackAlt` (e.g. the event title) is used when the old <img> had no alt text. */
async function imageId(img: Element | null | undefined, ctx: Ctx, fallbackAlt?: string) {
  if (!img) return null
  const alt = img.getAttribute('alt')?.trim() || fallbackAlt
  return ctx.media.id(img.getAttribute('src'), { page: ctx.page, alt })
}

/** Rich text for a nested field (card/callout bodies): images become upload nodes. */
async function richText(nodes: Node[], ctx: Ctx): Promise<EditorState | null> {
  const out = await convertFlow(nodes, ctx, false)
  return out.length ? root(out) : null
}

const richTextOf = (
  el: Element | null | undefined,
  ctx: Ctx,
  skip: (c: Element) => boolean = () => false,
) =>
  el
    ? richText(
        Array.from(el.childNodes).filter((n) => !(isEl(n) && skip(n))),
        ctx,
      )
    : Promise.resolve(null)

/** Rewrites old asset URLs to uploaded media URLs (used for RawHTML fallbacks). */
async function rewriteAssetUrls(el: Element, ctx: Ctx) {
  for (const img of Array.from(el.querySelectorAll('img[src]'))) {
    const m = await ctx.media.import(img.getAttribute('src')!, {
      page: ctx.page,
      alt: img.getAttribute('alt'),
    })
    if (m) img.setAttribute('src', m.url)
  }
  for (const node of [el, ...Array.from(el.querySelectorAll('[style*="url("]'))]) {
    const url = bgImageUrl(node)
    if (!url) continue
    const m = await ctx.media.import(url, { page: ctx.page })
    if (m) node.setAttribute('style', node.getAttribute('style')!.replace(url, m.url))
  }
}

async function rawHtml(el: Element, ctx: Ctx, reason: string): Promise<LexicalNode> {
  await rewriteAssetUrls(el, ctx)
  ctx.report.rawHtml.push({
    page: ctx.page,
    reason,
    snippet: el.outerHTML.replace(/\s+/g, ' ').slice(0, 120),
  })
  return blockNode('rawHtml', { html: el.outerHTML })
}

// ---------------------------------------------------------------------------------------------
// Pattern recognizers. Each returns Lexical nodes, or null when the element doesn't match.
// ---------------------------------------------------------------------------------------------

/** `rest` = the following sibling nodes; a recognizer may consume some of them (PageIntro). */
type Recognizer = (
  el: Element,
  ctx: Ctx,
  rest: Node[],
  topLevel: boolean,
) => Promise<LexicalNode[] | null>

/** h1 + .sub-block / .sub-title + .sub-text-block / .sub-text → PageIntro (consumes siblings). */
const pageIntro: Recognizer = async (el, ctx, rest) => {
  if (el.tagName !== 'H1') return null
  const texts: { id: string; style: string; text: unknown }[] = []
  const fields: Record<string, unknown> = { title: text(el), leadStyle: 'subBlock', texts }
  const isIntroPart = (n: Node | undefined): n is Element =>
    !!n &&
    isEl(n) &&
    ['sub-block', 'sub-title', 'sub-text-block', 'sub-text', 'sub-paragraph'].some((c) => has(n, c))
  const skipBlank = () => {
    while (rest[0] && !isEl(rest[0]) && !rest[0].textContent?.trim()) rest.shift()
  }
  skipBlank()
  // inside a block (e.g. the first flex block of /applications) only a title with a lead is one
  if (el.parentElement?.tagName !== 'BODY' && !isIntroPart(rest[0])) return null
  for (; isIntroPart(rest[0]); skipBlank()) {
    const next = rest.shift() as Element
    const state = await richTextOf(next, ctx)
    if (has(next, 'sub-block') || has(next, 'sub-title')) {
      fields.lead = state
      // /legal/privacy: <div class="sub-block"><div class="sub-text">…</div><p>…</p></div>
      const nested = next.firstElementChild && has(next.firstElementChild, 'sub-text')
      fields.leadStyle = has(next, 'sub-title') ? 'subTitle' : nested ? 'subBlockText' : 'subBlock'
      continue
    }
    // the exact old wrapper: <p class="sub-text small">, <p class="sub-text-block">,
    // <div class="sub-text">, <div class="sub-text-block"> with or without <p> inside
    const style = has(next, 'sub-paragraph')
      ? 'subParagraph'
      : has(next, 'small')
        ? 'small'
        : next.tagName === 'P'
          ? 'paragraph'
          : has(next, 'sub-text')
            ? 'plain'
            : next.firstElementChild?.tagName === 'P'
              ? 'block'
              : 'blockInline'
    texts.push({ id: nodeId(), style, text: state })
  }
  return [blockNode('pageIntro', fields)]
}

/**
 * Image + text rows: `.flex-block`, the same structure as `.flex-text` (/platform/textcoins) and
 * as `.d-flex` with an `.img-block` + `.info-block` (/technology).
 */
const flexBlock: Recognizer = async (el, ctx) => {
  const imgBlock = children(el).find((c) => has(c, 'img-block'))
  const info = children(el).find((c) => has(c, 'info-block') || has(c, 'content-block'))
  const kind =
    has(el, 'content-wrap') && imgBlock && info
      ? 'content-wrap'
      : has(el, 'google-block') && imgBlock && info
        ? 'google-block d-inline-flex'
        : has(el, 'flex-block')
          ? 'flex-block'
          : has(el, 'flex-text')
            ? 'flex-text'
            : has(el, 'd-flex') && imgBlock && info
              ? 'd-flex'
              : null
  if (!kind) return null
  // image-only rows (/platform/iot/proofs-of-concept) have the <img> directly in the row
  const imageOnly = !info && !imgBlock && children(el).every((c) => c.tagName === 'IMG')
  const imgs = imgBlock
    ? Array.from(imgBlock.querySelectorAll('img'))
    : imageOnly
      ? children(el)
      : []
  const desktop = imgs.find((i) => !has(i, 'mobile'))
  const mobile = imgs.find((i) => has(i, 'mobile'))
  const imageFirst =
    imgBlock && info ? children(el).indexOf(imgBlock) < children(el).indexOf(info) : true
  return [
    blockNode('flexBlock', {
      image: await imageId(desktop, ctx),
      mobileImage: await imageId(mobile, ctx),
      imagePosition: imageFirst ? 'left' : 'right',
      kind,
      modifiers:
        classes(el)
          .filter((c) => !kind.split(' ').includes(c))
          .join(' ') || null,
      plainText: !!info && !hasBlockChildren(info),
      imageStyle: (desktop && classes(desktop).find((c) => IMAGE_STYLES.has(c))) || null,
      imageModifiers: imgBlock ? otherClasses(imgBlock, 'img-block') : null,
      content: imageOnly ? null : await richTextOf(info ?? el, ctx, (c) => c === imgBlock),
    }),
  ]
}

const devCallout: Recognizer = async (el, ctx) => {
  if (!has(el, 'dev-blog')) return null
  const info = el.querySelector('.info-block')
  const cat = info?.querySelector('.cat')
  const title = info?.querySelector('.title')
  return [
    blockNode('devCallout', {
      image: await imageId(el.querySelector('.dev-img-block img, .img-block img'), ctx),
      category: text(cat) || null,
      title: text(title),
      content: await richTextOf(info, ctx, (c) => c === cat || c === title),
      white: has(el, 'white'),
    }),
  ]
}

const cardGrid: Recognizer = async (el, ctx) => {
  if (!has(el, 'categories-list')) return null
  const blocks = children(el).filter((c) => has(c, 'category-block'))
  const variant = blocks.some((b) => b.querySelector('.all-link'))
    ? 'linkCards'
    : blocks.some((b) => b.querySelector('.link-list'))
      ? 'linkLists'
      : 'text'
  const cards = []
  for (const b of blocks) {
    const title = b.querySelector('.title')
    const linkList = b.querySelector('.link-list')
    const bodyRoot = b.querySelector('.info-block') ?? b
    cards.push({
      id: nodeId(),
      title: text(title),
      image:
        (await imageId(b.querySelector('.img-block img'), ctx)) ??
        (await ctx.media.id(bgImageUrl(b.querySelector('.inner-wrap[style]')), {
          page: ctx.page,
          alt: text(title),
        })),
      link: b.querySelector('a.all-link')?.getAttribute('href') ?? null,
      // `<a>` items, or rows `<div><a>name</a>: description</div>` (/developers tools)
      links: linkList
        ? Array.from(linkList.querySelectorAll('a')).map((a) => ({
            id: nodeId(),
            label: text(a),
            link: a.getAttribute('href'),
            description:
              a.parentElement !== linkList
                ? (a.parentElement?.textContent ?? '').slice((a.textContent ?? '').length) || null
                : null,
          }))
        : [],
      linkRows: !!linkList && children(linkList).some((c) => c.tagName === 'DIV'),
      content:
        variant === 'text'
          ? await richTextOf(bodyRoot, ctx, (c) => c === title)
          : await richTextOf(bodyRoot, ctx, (c) => c === linkList),
      modifier: otherClasses(b, 'category-block'),
    })
  }
  return [blockNode('cardGrid', { variant, cards })]
}

const whiteBox: Recognizer = async (el, ctx) => {
  if (!has(el, 'white-block')) return null
  const first = el.firstElementChild
  // FAQ entries (<h4>question</h4><p>answer</p>) become the FAQ collection; the first one is
  // replaced by the list block, the rest by nothing
  if (ctx.page === '/faq' && first?.tagName === 'H4') {
    const isFirst = ctx.collected.faq.length === 0
    ctx.collected.faq.push({
      question: text(first),
      answer: await richTextOf(el, ctx, (c) => c === first),
    })
    return isFirst ? [blockNode('faqFeed', {})] : []
  }
  const label = el.querySelector(':scope > .category')
  // no block-level children (e.g. just <b>…</b>): the old box showed the text without <p>
  const plainText = !hasBlockChildren(el, label)
  return [
    blockNode('whiteBox', {
      label: text(label) || null,
      content: await richTextOf(el, ctx, (c) => c === label),
      plainText,
    }),
  ]
}

const eventList: Recognizer = async (el, ctx) => {
  if (!has(el, 'fancy-list')) return null
  const items = []
  for (const item of children(el).filter((c) => has(c, 'element-block'))) {
    const date = item.querySelector(':scope > .date')
    const title = item.querySelector(':scope > .title, :scope > h2')
    const media = Array.from(item.querySelectorAll('img'))
    const video = videoFromIframe(item.querySelector('iframe'))
    const images = []
    for (const img of media) {
      const id = await imageId(img, ctx, text(title))
      if (id) images.push({ id: nodeId(), image: id })
    }
    items.push({
      id: nodeId(),
      date: text(date) || null,
      title: text(title),
      content: await richTextOf(
        item,
        ctx,
        (c) =>
          c === date ||
          c === title ||
          has(c, 'd-flex') ||
          has(c, 'iframe-block') ||
          c.tagName === 'IMG',
      ),
      images,
      video: video ?? {},
    })
  }
  if (ctx.page === '/grants') return [blockNode('eventList', { variant: 'grants', items })]
  // /events: the cards become the Events collection; the page shows it through a feed block
  for (const i of items) {
    if (!i.date) throw new Error(`${ctx.page}: event "${i.title}" has no date`)
    ctx.collected.events.push({
      date: monthStart(i.date),
      title: i.title,
      content: i.content,
      images: i.images.map(({ image }) => ({ image })),
      video: i.video,
    })
  }
  return [blockNode('eventsFeed', {})]
}

const MEDIA_LISTS: Record<string, { item: string; variant: string }> = {
  'resources-list': { item: 'resource-block', variant: 'resources' },
  'attestors-list': { item: 'attestor-block', variant: 'attestors' },
  'blackbytes-details': { item: 'blackbytes-block', variant: 'blackbytes' },
}

const mediaList: Recognizer = async (el, ctx) => {
  const kind = Object.keys(MEDIA_LISTS).find((k) => has(el, k))
  if (!kind) return null
  const { item, variant } = MEDIA_LISTS[kind]
  const items = []
  for (const b of children(el).filter((c) => has(c, item))) {
    const imgBlock = b.querySelector(':scope > .img-block')
    const info = b.querySelector(':scope > .info-block') ?? b
    const title = info.querySelector('.title, h2, h3')
    items.push({
      id: nodeId(),
      image: await imageId(imgBlock?.querySelector('img') ?? b.querySelector('img'), ctx),
      title: text(title) || null,
      link: title?.querySelector('a')?.getAttribute('href') ?? null,
      content: await richTextOf(info, ctx, (c) => c === title || c === imgBlock),
    })
  }
  return [blockNode('mediaList', { variant, items })]
}

const columns: Recognizer = async (el, ctx) => {
  if (!has(el, 'columns')) return null
  const cols = []
  for (const col of children(el).filter((c) => has(c, 'column'))) {
    const width = Number(
      classes(col)
        .find((c) => /^col-\d+$/.test(c))
        ?.slice(4) ?? 6,
    )
    const iframe = col.querySelector('iframe')
    cols.push({
      id: nodeId(),
      width,
      video: videoFromIframe(iframe) ?? {},
      content: await richTextOf(col.querySelector('.text-block') ?? col, ctx, (c) =>
        c.contains(iframe),
      ),
    })
  }
  return [blockNode('columns', { columns: cols })]
}

const video: Recognizer = async (el) => {
  const iframe =
    el.tagName === 'IFRAME'
      ? el
      : el.children.length === 1
        ? el.querySelector(':scope > iframe')
        : null
  const v = videoFromIframe(iframe)
  return v
    ? [blockNode('videoEmbed', { ...v, title: iframe?.getAttribute('title') ?? null })]
    : null
}

const code: Recognizer = async (el) => {
  if (el.tagName !== 'PRE') return null
  const codeEl = el.querySelector('code')
  const language = codeEl?.className.match(/language-(\w+)/)?.[1] ?? 'plaintext'
  return [
    blockNode('Code', { language, code: (codeEl ?? el).textContent?.replace(/\n$/, '') ?? '' }),
  ]
}

/**
 * Empty paragraphs from blank markdown lines: dropped. Paragraphs that hold only <br>s are the
 * authors' vertical spacing (`<br><br>` between sections) and stay — they render as empty lines.
 * Bare <br>s between elements (not inside a paragraph) become a Spacer block with that many lines.
 */
const spacer: Recognizer = async (el, _ctx, rest) => {
  if (el.tagName === 'P' && !text(el) && !el.querySelector('img,iframe,br')) return []
  if (el.tagName !== 'BR') return null
  let lines = 1
  for (;;) {
    while (rest[0] && !isEl(rest[0]) && !rest[0].textContent?.trim()) rest.shift()
    if (!(rest[0] && isEl(rest[0]) && rest[0].tagName === 'BR')) break
    rest.shift()
    lines++
  }
  return [blockNode('spacer', { lines })]
}

/** Non-whitespace text directly inside the element (not in a child element). */
const directText = (el: Element) =>
  Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent?.trim())

/** True if the element holds block-level markup (else it's a run of inline text → no <p>). */
const hasBlockChildren = (el: Element, ignore?: Element | null) =>
  children(el).some(
    (c) => c !== ignore && /^(P|DIV|UL|OL|H[1-6]|TABLE|PRE|BLOCKQUOTE|IFRAME|IMG)$/.test(c.tagName),
  )

/** Old wrappers / styled paragraphs (see the Box block): `div.flex-list`, `p.bullet` … */
const BOX_DIVS = [
  'list-block d-flex',
  'flex-list',
  'content-small',
  'd-flex',
  'text-block',
  'container grid-xl > top-block',
  'top-block > container grid-xl',
  'event-block',
]
const BOX_TEXT = [
  'p.bullet',
  'p.bullet-padding',
  'p.med-width',
  'p.max-width',
  'p.w-550',
  'p.w-670',
  'p.w-745',
  'p.text-center',
  'h2.section-heading text-center',
  'small',
]
const box: Recognizer = async (el, ctx, _rest, topLevel) => {
  const cls = classes(el).join(' ')
  const asText = cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase()
  // wrappers nested as only children (`.container > .top-block`) form one compound style
  let inner = el
  const chain = [cls]
  while (
    inner.children.length === 1 &&
    !directText(inner) &&
    inner.firstElementChild!.tagName === 'DIV'
  ) {
    inner = inner.firstElementChild!
    chain.push(classes(inner).join(' '))
  }
  const compound = chain.join(' > ')
  if (el.tagName === 'DIV' && chain.length > 1 && BOX_DIVS.includes(compound)) {
    const content = await richTextOf(inner, ctx)
    return [blockNode(topLevel ? 'box' : 'innerBox', { style: compound, content })]
  }
  const style =
    el.tagName === 'DIV' && BOX_DIVS.includes(cls) ? cls : BOX_TEXT.includes(asText) ? asText : null
  if (!style) return null
  // a styled paragraph's text becomes one paragraph (rendered back inside <p class>)
  const content =
    el.tagName === 'DIV'
      ? await richTextOf(el, ctx)
      : htmlToState(`<p>${el.innerHTML}</p>`, ctx.editors.content)
  // page level: Box (may contain flex blocks…); inside another block: the plain Inner box
  return [blockNode(topLevel ? 'box' : 'innerBox', { style, content })]
}

/** /distribution: `.distribution-block` (intro + table of methods) → Distribution table. */
const distributionTable: Recognizer = async (el, ctx) => {
  if (!has(el, 'distribution-block')) return null
  const cells = (tr: Element) => Array.from(tr.querySelectorAll(':scope > td, :scope > th'))
  const head = el.querySelector('thead tr')
  const [method, years, amount, history] = head ? cells(head).map(text) : []
  const rows = []
  for (const tr of Array.from(el.querySelectorAll('tbody tr'))) {
    const [m, y, a, h] = cells(tr)
    const addresses = Array.from(h.querySelectorAll('a'))
      .map((a) => a.getAttribute('href')?.match(/\/address\/([A-Z0-9]+)/)?.[1])
      .filter(Boolean)
    if (!addresses.length) throw new Error(`${ctx.page}: distribution row without an address`)
    rows.push({
      id: nodeId(),
      method: htmlToState(`<p>${m.innerHTML.trim()}</p>`, ctx.editors.inline),
      years: text(y),
      amount: (a.textContent ?? '').replace(/\s+/g, ''),
      addresses: addresses.join('\n'),
    })
  }
  return [
    blockNode('distributionTable', {
      intro: await richTextOf(el.querySelector(':scope > .info-block'), ctx),
      headings: { method, years, amount, history },
      rows,
    }),
  ]
}

const RECOGNIZERS: Recognizer[] = [
  spacer,
  pageIntro,
  flexBlock,
  devCallout,
  cardGrid,
  whiteBox,
  box,
  distributionTable,
  eventList,
  mediaList,
  columns,
  video,
  code,
]

/** <img> classes kept as the image style of text images (see contentEditor uploadFeature). */
const IMAGE_STYLES = new Set(['info-img', 'content-img', 'img1', 'img2', 'mobile'])

/** Tags that are fine as plain rich text. */
const PLAIN = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'UL',
  'OL',
  'BLOCKQUOTE',
  'HR',
  'TABLE',
  'A',
  'B',
  'STRONG',
  'EM',
  'I',
  'SMALL',
  'SPAN',
  'CODE',
  'BR',
  'SUB',
  'SUP',
  'U',
  'S',
])

/**
 * Walks sibling nodes: recognizable elements → blocks, images → upload nodes, plain markup is
 * buffered and converted to rich text in one go (so inline runs stay in one paragraph).
 */
export async function convertFlow(
  nodes: Node[],
  ctx: Ctx,
  topLevel: boolean,
): Promise<LexicalNode[]> {
  const editor = topLevel ? ctx.editors.article : ctx.editors.content
  const out: LexicalNode[] = []
  let buffer = ''
  const flush = () => {
    out.push(...htmlToNodes(buffer, editor))
    buffer = ''
  }

  const queue = [...nodes]
  while (queue.length) {
    const node = queue.shift()!
    if (!isEl(node)) {
      if (node.nodeType === 3) buffer += (node.textContent ?? '').replace(/</g, '&lt;')
      continue
    }
    const el = node
    if (el.tagName === 'IMG') {
      flush()
      const id = await imageId(el, ctx)
      const style = classes(el).find((c) => IMAGE_STYLES.has(c))
      if (id) out.push(uploadNode(id, style))
      continue
    }
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
      ctx.report.dropped.push({ page: ctx.page, what: el.outerHTML.slice(0, 80) })
      continue
    }

    // a <br> inside a run of inline text is a line break of that text, not a spacer
    const inlineRun =
      buffer.trim() && !/<\/(p|h[1-6]|ul|ol|table|blockquote|pre)>\s*$/i.test(buffer)
    if ((el.tagName === 'BR' || el.tagName === 'SMALL') && inlineRun) {
      buffer += '<br>'
      continue
    }

    // whitespace between elements must not stop PageIntro from seeing its sibling parts
    while (queue[0] && !isEl(queue[0]) && !queue[0].textContent?.trim()) queue.shift()
    let matched: LexicalNode[] | null = null
    for (const r of RECOGNIZERS) {
      matched = await r(el, ctx, queue, topLevel)
      if (matched) break
    }
    if (matched) {
      flush()
      out.push(...matched)
      continue
    }

    // old small titles inside boxes → h5, which RichText renders back as <div class="title">
    if (el.tagName === 'DIV' && classes(el).join(' ') === 'title') {
      buffer += `<h5>${el.innerHTML}</h5>`
      continue
    }

    const hasImages = el.querySelector('img, iframe, [style*="url("]')
    if (PLAIN.has(el.tagName) && !hasImages) {
      buffer += el.outerHTML
      continue
    }
    // Images wrapped in paragraphs / image-only boxes: keep the images (upload nodes) and text.
    if ((PLAIN.has(el.tagName) && hasImages) || isImageBox(el)) {
      queue.unshift(...Array.from(el.childNodes))
      continue
    }
    // Wrapper divs without own meaning (e.g. .text-block, .info-block): unwrap.
    if (el.tagName === 'DIV' && !el.getAttribute('style') && isPlainWrapper(el)) {
      if (classes(el).length)
        ctx.report.unwrapped.push({
          page: ctx.page,
          what: describe(el),
          level: topLevel ? 'page' : 'block',
        })
      queue.unshift(...Array.from(el.childNodes))
      continue
    }
    flush()
    if (topLevel) {
      out.push(await rawHtml(el, ctx, describe(el)))
    } else {
      // inside a block's rich text: keep the content, lose the unknown wrapper
      ctx.report.dropped.push({ page: ctx.page, what: `wrapper ${describe(el)}` })
      out.push(...(await convertFlow(Array.from(el.childNodes), ctx, false)))
    }
  }
  flush()
  return out
}

/** Classes that only carried typography/spacing — safe to drop when unwrapping. */
const WRAPPER_CLASSES = new Set([
  'text-block',
  'info-block',
  'content-block',
  'sub-text-block',
  'text',
  'd-flex',
  'container',
  'grid-xl',
  'centered',
  'med-width',
  'max-width',
])
const isImageBox = (el: Element) =>
  el.tagName === 'DIV' &&
  classes(el).every((c) => c === 'img-block') &&
  children(el).every((c) => c.tagName === 'IMG')
const isPlainWrapper = (el: Element) => classes(el).every((c) => WRAPPER_CLASSES.has(c))

export async function convertArticle(html: string, ctx: Ctx): Promise<EditorState | null> {
  const { document } = new JSDOM(`<body>${html}</body>`).window
  const nodes = await convertFlow(Array.from(document.body.childNodes), ctx, true)
  return nodes.length ? root(nodes) : null
}
