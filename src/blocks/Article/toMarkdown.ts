import { type MarkdownContext, richToMarkdown } from '@/content-blocks/markdown'
import type { ArticleBlock, TextWideBlock } from '@/payload-types'

import type { BlockData } from '../RenderBlocks'

export const articleToMarkdown = (
  block: ArticleBlock | TextWideBlock,
  _data: BlockData,
  ctx: MarkdownContext,
) => richToMarkdown(block.body, ctx)
