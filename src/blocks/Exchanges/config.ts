import type { Block } from 'payload'

import { anchorField } from '@/shared/cms/fields'

/**
 * "GBYTE Exchanges" (old modular/exchanges.html.twig). The logos come from the `exchanges` and
 * `coin-trackers` collections (drag-and-drop order); the block holds the texts.
 */
export const ExchangesBlock: Block = {
  slug: 'exchanges',
  interfaceName: 'ExchangesBlock',
  fields: [
    anchorField,
    { name: 'title', type: 'text', required: true },
    {
      name: 'intro',
      type: 'textarea',
      defaultValue:
        'You can buy or sell GBYTE (the native currency of Obyte) on the following cryptocurrency exchanges:',
    },
    { name: 'body', type: 'richText', admin: { description: 'Shown under the exchange logos.' } },
  ],
}
