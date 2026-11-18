import type { PageIntroBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { type MarkdownContext, richToMarkdown } from '../markdown'

export const pageIntroToMarkdown = (block: PageIntroBlock, ctx: MarkdownContext) =>
  joinParts([
    `# ${block.title}`,
    richToMarkdown(block.lead, ctx),
    ...(block.texts ?? []).map((t) => richToMarkdown(t.text, ctx)),
  ])
