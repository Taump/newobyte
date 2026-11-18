import type { MediaListBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { linkMarkdown, type MarkdownContext, richToMarkdown } from '../markdown'

export const mediaListToMarkdown = (block: MediaListBlock, ctx: MarkdownContext) =>
  joinParts(
    (block.items ?? []).map((i) =>
      joinParts([
        i.title && `### ${linkMarkdown(i.title, i.link)}`,
        richToMarkdown(i.content, ctx),
      ]),
    ),
  )
