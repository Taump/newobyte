import type { ColumnsBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { type MarkdownContext, richToMarkdown, videoMarkdown } from '../markdown'

export const columnsToMarkdown = (block: ColumnsBlock, ctx: MarkdownContext) =>
  joinParts(
    (block.columns ?? []).flatMap((c) => [videoMarkdown(c.video), richToMarkdown(c.content, ctx)]),
  )
