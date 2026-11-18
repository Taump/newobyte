import { type MarkdownContext, richToMarkdown } from '@/content-blocks/markdown'
import type { HeroBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { quoteToMarkdown } from '../quoteMarkdown'
import type { BlockData } from '../RenderBlocks'

export const heroToMarkdown = (block: HeroBlock, _data: BlockData, ctx: MarkdownContext) =>
  joinParts([
    `# ${richToMarkdown(block.title, ctx).replace(/\s*\n\s*/g, ' ')}`,
    block.subtitle && `## ${block.subtitle}`,
    block.description,
    quoteToMarkdown(block.mainQuote, ctx),
    ...(block.information ?? []).map((i) => `**${i.title}** ${i.text}`),
    quoteToMarkdown(block.sideQuote, ctx),
    (block.comparisons ?? [])
      .map((c) => `- **${c.title}**${c.description ? `: ${c.description}` : ''}`)
      .join('\n'),
  ])
