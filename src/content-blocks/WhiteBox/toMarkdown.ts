import type { WhiteBoxBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { type MarkdownContext, richToMarkdown } from '../markdown'

export const whiteBoxToMarkdown = (block: WhiteBoxBlock, ctx: MarkdownContext) =>
  joinParts([block.label && `**${block.label}**`, richToMarkdown(block.content, ctx)])
