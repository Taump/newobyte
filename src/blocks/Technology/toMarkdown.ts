import { type MarkdownContext, richToMarkdown } from '@/content-blocks/markdown'
import type { TechnologyBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { quoteToMarkdown } from '../quoteMarkdown'
import type { BlockData } from '../RenderBlocks'

export const technologyToMarkdown = (
  block: TechnologyBlock,
  _data: BlockData,
  ctx: MarkdownContext,
) =>
  joinParts([
    `## ${richToMarkdown(block.title, ctx).replace(/\s*\n\s*/g, ' ')}`,
    quoteToMarkdown(block.quote, ctx),
    richToMarkdown(block.body, ctx),
    (block.scenes ?? []).map((s, i) => `${i + 1}. **${s.title}**: ${s.text}`).join('\n'),
  ])
