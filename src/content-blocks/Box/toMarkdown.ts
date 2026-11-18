import type { BoxBlock, InnerBoxBlock } from '@/payload-types'

import { type MarkdownContext, richToMarkdown } from '../markdown'

export function boxToMarkdown(block: BoxBlock | InnerBoxBlock, ctx: MarkdownContext) {
  const text = richToMarkdown(block.content, ctx)
  // a styled heading box is a section heading
  return block.style.startsWith('h2') && text ? `## ${text}` : text
}
