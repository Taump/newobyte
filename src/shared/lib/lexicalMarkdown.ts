/**
 * Lexical rich text (Payload's JSON) → Markdown, for the markdown twins of pages (AI agents,
 * llms-full.txt), or → plain text (structured data). Blocks, inline blocks and uploads are
 * serialized by callbacks, so this stays independent of the CMS schema.
 */
export type LexicalNode = {
  type: string
  children?: LexicalNode[]
  text?: string
  format?: number | string
  tag?: string
  listType?: string
  start?: number
  fields?: Record<string, unknown> & { url?: string }
  value?: unknown
}

export type RichTextData = { root: LexicalNode } | null | undefined

export type MarkdownOptions = {
  /** plain text: no markdown syntax, links as their text */
  plain?: boolean
  block?: (fields: Record<string, unknown>) => string
  inlineBlock?: (fields: Record<string, unknown>) => string
  upload?: (value: unknown, fields?: Record<string, unknown>) => string
  /** rewrite link URLs (e.g. make site-relative links absolute) */
  link?: (url: string) => string
}

const BOLD = 1
const ITALIC = 2
const CODE = 16

/** Wrap text in markers, keeping edge whitespace outside (`** a**` is not bold). */
const wrap = (text: string, marker: string) => {
  const m = /^(\s*)(.*?)(\s*)$/s.exec(text)!
  return m[2] ? `${m[1]}${marker}${m[2]}${marker}${m[3]}` : text
}

function formatText(text: string, format: number) {
  if (format & CODE) return wrap(text, '`')
  let out = text
  if (format & ITALIC) out = wrap(out, '*')
  if (format & BOLD) out = wrap(out, '**')
  return out
}

function inline(nodes: LexicalNode[] = [], o: MarkdownOptions): string {
  return nodes.map((n) => inlineNode(n, o)).join('')
}

function inlineNode(n: LexicalNode, o: MarkdownOptions): string {
  switch (n.type) {
    case 'text':
      return o.plain ? (n.text ?? '') : formatText(n.text ?? '', Number(n.format) || 0)
    case 'linebreak':
      return o.plain ? '\n' : '  \n'
    case 'tab':
      return '\t'
    case 'link':
    case 'autolink': {
      const text = inline(n.children, o)
      const url = n.fields?.url
      if (o.plain || !url) return text
      return `[${text}](${o.link ? o.link(url) : url})`
    }
    case 'inlineBlock':
      return o.inlineBlock?.(n.fields ?? {}) ?? ''
    default:
      return inline(n.children, o)
  }
}

function list(n: LexicalNode, o: MarkdownOptions, depth: number): string {
  let index = n.start ?? 1
  return (n.children ?? [])
    .map((item) => {
      const children = item.children ?? []
      const text = inline(
        children.filter((c) => c.type !== 'list'),
        o,
      ).trim()
      const lines: string[] = []
      if (text) {
        // an item that only wraps a nested list has no number of its own
        const marker = o.plain ? '' : n.listType === 'number' ? `${index++}. ` : '- '
        lines.push(`${'  '.repeat(depth)}${marker}${text}`)
      }
      for (const nested of children.filter((c) => c.type === 'list')) {
        lines.push(list(nested, o, depth + 1))
      }
      return lines.join('\n')
    })
    .filter(Boolean)
    .join('\n')
}

function blockNode(n: LexicalNode, o: MarkdownOptions): string {
  switch (n.type) {
    case 'heading': {
      const text = inline(n.children, o).trim()
      if (o.plain || !text) return text
      const level = Math.min(Number(n.tag?.slice(1)) || 2, 6)
      return `${'#'.repeat(level)} ${text.replace(/\s*\n\s*/g, ' ')}`
    }
    case 'list':
      return list(n, o, 0)
    case 'quote': {
      const text = inline(n.children, o)
      return o.plain
        ? text
        : text
            .split('\n')
            .map((l) => `> ${l}`)
            .join('\n')
    }
    case 'horizontalrule':
      return o.plain ? '' : '---'
    case 'upload':
      return o.upload?.(n.value, n.fields) ?? ''
    case 'block':
      return o.block?.(n.fields ?? {}) ?? ''
    default:
      return inline(n.children, o).trim()
  }
}

/** Join markdown parts with blank lines, skipping empty ones. */
export const joinParts = (parts: (string | null | undefined | false)[]) =>
  parts
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join('\n\n')

/** Markdown (or plain text with `plain: true`) of a Lexical document. */
export function lexicalToMarkdown(data: RichTextData, o: MarkdownOptions = {}): string {
  return joinParts((data?.root.children ?? []).map((n) => blockNode(n, o)))
}
