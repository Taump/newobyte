import type { Block } from 'payload'

/** Shows the Events collection (newest first) where it is placed in the page text. */
export const EventsFeedBlock: Block = {
  slug: 'eventsFeed',
  interfaceName: 'EventsFeedBlock',
  labels: { singular: 'Events feed', plural: 'Events feeds' },
  fields: [
    {
      name: 'limit',
      type: 'number',
      min: 1,
      admin: {
        description: 'Show only the newest N events (empty = all). Edit events in Lists → Events.',
      },
    },
  ],
}
