import type { FaqFeedBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { type MarkdownContext, richToMarkdown } from '../markdown'

export const faqFeedToMarkdown = (block: FaqFeedBlock, ctx: MarkdownContext) =>
  joinParts(
    (ctx.lists.faq ?? [])
      .slice(0, block.limit ?? undefined)
      .map((q) => joinParts([`### ${q.question}`, richToMarkdown(q.answer, ctx)])),
  )
