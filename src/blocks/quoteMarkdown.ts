import { type MarkdownContext, richToMarkdown } from '@/content-blocks/markdown'
import type { HeroBlock } from '@/payload-types'

/** A quote card as a markdown blockquote with its attribution. */
export function quoteToMarkdown(
  quote: HeroBlock['mainQuote'] | null | undefined,
  ctx: MarkdownContext,
) {
  if (!quote) return ''
  const text = richToMarkdown(quote.text, ctx)
  const by = [quote.author, quote.source].filter(Boolean).join(', ')
  return [...text.split('\n'), ...(by ? ['', `— ${by}`] : [])]
    .map((l) => `> ${l}`.trimEnd())
    .join('\n')
}
