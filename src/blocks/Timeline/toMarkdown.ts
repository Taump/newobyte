import { type MarkdownContext, richToMarkdown } from '@/content-blocks/markdown'
import type { TimelineBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import type { BlockData } from '../RenderBlocks'
import { formatMonth } from './Timeline'

export const timelineToMarkdown = (block: TimelineBlock, data: BlockData, ctx: MarkdownContext) =>
  joinParts([
    `## ${block.title}`,
    richToMarkdown(block.body, ctx),
    data.timelineEvents.map((e) => `- ${formatMonth(e.date)}: ${e.title}`).join('\n'),
  ])
