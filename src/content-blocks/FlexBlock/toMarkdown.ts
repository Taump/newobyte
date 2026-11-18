import type { FlexBlockBlock } from '@/payload-types'

import { type MarkdownContext, richToMarkdown } from '../markdown'

/** The text only: the pictures of these rows are illustrations. */
export const flexBlockToMarkdown = (block: FlexBlockBlock, ctx: MarkdownContext) =>
  richToMarkdown(block.content, ctx)
