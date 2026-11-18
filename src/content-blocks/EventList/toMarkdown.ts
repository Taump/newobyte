import type { EventListBlock } from '@/payload-types'
import { joinParts } from '@/shared/lib/lexicalMarkdown'

import { type MarkdownContext, richToMarkdown, videoMarkdown } from '../markdown'
import type { EventItem } from './EventList'

export const eventItemsToMarkdown = (items: EventItem[], ctx: MarkdownContext) =>
  joinParts(
    items.map((i) =>
      joinParts([
        `### ${i.date ? `${i.date}: ` : ''}${i.title}`,
        richToMarkdown(i.content, ctx),
        videoMarkdown(i.video),
      ]),
    ),
  )

export const eventListToMarkdown = (block: EventListBlock, ctx: MarkdownContext) =>
  eventItemsToMarkdown(block.items ?? [], ctx)
