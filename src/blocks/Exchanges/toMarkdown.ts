import { linkMarkdown, type MarkdownContext, richToMarkdown } from '@/content-blocks/markdown'
import type { ExchangesBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import type { BlockData } from '../RenderBlocks'

export const exchangesToMarkdown = (block: ExchangesBlock, data: BlockData, ctx: MarkdownContext) =>
  joinParts([
    `## ${block.title}`,
    block.intro,
    data.exchanges.map((e) => `- ${linkMarkdown(e.name, e.link)}`).join('\n'),
    richToMarkdown(block.body, ctx),
    data.coinTrackers.map((c) => `- ${linkMarkdown(c.name, c.link)}`).join('\n'),
  ])
