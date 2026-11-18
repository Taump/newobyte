import type { Event, EventsFeedBlock } from '@/payload-types'

import { EventCards, type EventItem } from '../EventList/EventList'
import type { ContentLists } from '../types'

/** "April 2020" (UTC: event dates are stored as the 1st of the month) */
const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Events of the collection as list items (newest first, optionally only the first N). */
export const eventsToItems = (events: Event[], limit?: number | null): EventItem[] =>
  events.slice(0, limit ?? undefined).map((e) => ({
    id: String(e.id),
    date: monthYear(e.date),
    title: e.title,
    content: e.content,
    images: e.images,
    video: e.video,
  }))

/** The Events collection, rendered like the old hand-written list on /events. */
export function EventsFeed({ block, lists }: { block: EventsFeedBlock; lists: ContentLists }) {
  return <EventCards items={eventsToItems(lists.events ?? [], block.limit)} variant="events" />
}
