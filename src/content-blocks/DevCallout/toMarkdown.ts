import type { DevCalloutBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { type MarkdownContext, richToMarkdown } from '../markdown'

export const devCalloutToMarkdown = (block: DevCalloutBlock, ctx: MarkdownContext) =>
  joinParts([
    `### ${block.category ? `${block.category}: ` : ''}${block.title}`,
    richToMarkdown(block.content, ctx),
  ])
