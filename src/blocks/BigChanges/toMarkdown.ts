import type { MarkdownContext } from '@/content-blocks/markdown'
import type { BigChangesBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { quoteToMarkdown } from '../quoteMarkdown'
import type { BlockData } from '../RenderBlocks'

export const bigChangesToMarkdown = (
  block: BigChangesBlock,
  _data: BlockData,
  ctx: MarkdownContext,
) => joinParts([block.text, quoteToMarkdown(block.quote, ctx)])
