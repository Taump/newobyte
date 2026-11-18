import type { Block } from 'payload'

/** Shows the FAQ collection (Lists → FAQ, in its admin order) where it is placed in the text. */
export const FaqFeedBlock: Block = {
  slug: 'faqFeed',
  interfaceName: 'FaqFeedBlock',
  labels: { singular: 'FAQ list', plural: 'FAQ lists' },
  fields: [
    {
      name: 'limit',
      type: 'number',
      min: 1,
      admin: {
        description: 'Show only the first N questions (empty = all). Edit them in Lists → FAQ.',
      },
    },
  ],
}
