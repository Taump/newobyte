import type { MarkdownContext } from '@/content-blocks/markdown'
import type { IndependentBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { quoteToMarkdown } from '../quoteMarkdown'
import type { BlockData } from '../RenderBlocks'

export const independentToMarkdown = (
  block: IndependentBlock,
  _data: BlockData,
  ctx: MarkdownContext,
) =>
  joinParts([
    `## ${block.title.replace(/\s*\n\s*/g, ' ')}`,
    block.description,
    quoteToMarkdown(block.quote, ctx),
  ])
