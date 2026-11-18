import type { CardGridBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { linkMarkdown, type MarkdownContext, richToMarkdown } from '../markdown'

export function cardGridToMarkdown(block: CardGridBlock, ctx: MarkdownContext) {
  const cards = block.cards ?? []
  if (block.variant === 'linkCards') {
    return cards.map((c) => `- ${linkMarkdown(c.title, c.link)}`).join('\n')
  }
  return joinParts(
    cards.map((c) =>
      joinParts([
        `### ${linkMarkdown(c.title, c.link)}`,
        (c.links ?? [])
          .map((l) => `- ${linkMarkdown(l.label, l.link)}${l.description ?? ''}`)
          .join('\n'),
        richToMarkdown(c.content, ctx),
      ]),
    ),
  )
}
