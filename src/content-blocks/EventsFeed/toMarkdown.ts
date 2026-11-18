import type { EventsFeedBlock } from '@/payload-types'

import { eventItemsToMarkdown } from '../EventList/toMarkdown'
import type { MarkdownContext } from '../markdown'
import { eventsToItems } from './EventsFeed'

export const eventsFeedToMarkdown = (block: EventsFeedBlock, ctx: MarkdownContext) =>
  eventItemsToMarkdown(eventsToItems(ctx.lists.events ?? [], block.limit), ctx)
