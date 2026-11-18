import { imageField, linkField } from '@/shared/cms/fields'

import { orderableList } from './orderable'

/** "GBYTE Exchanges" logos (home Exchanges block), in drag-and-drop order. */
export const Exchanges = orderableList({
  slug: 'exchanges',
  singular: 'Exchange',
  plural: 'Exchanges',
  columns: ['logo', 'name', 'link'],
  fields: [
    {
      type: 'row',
      fields: [{ name: 'name', type: 'text', required: true, unique: true }, linkField()],
    },
    { ...imageField('logo'), admin: { description: 'Shown in grayscale, in colour on hover.' } },
  ],
})

/** Coin tracker icons under the exchanges (CoinGecko, CoinMarketCap…). */
export const CoinTrackers = orderableList({
  slug: 'coin-trackers',
  singular: 'Coin tracker',
  plural: 'Coin trackers',
  columns: ['logo', 'name', 'link'],
  fields: [
    {
      type: 'row',
      fields: [{ name: 'name', type: 'text', required: true, unique: true }, linkField()],
    },
    {
      type: 'row',
      fields: [
        { ...imageField('logo'), admin: { width: '50%', description: '48×48 round icon' } },
        { ...imageField('logoHover', true, 'Logo on hover'), admin: { width: '50%' } },
      ],
    },
  ],
})
