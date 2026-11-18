import { monthField } from '../fields/month'
import { orderableList } from './orderable'

/** Home timeline points, ordered by date (newest last, as on the site). */
export const TimelineEvents = orderableList({
  slug: 'timeline-events',
  singular: 'Timeline event',
  plural: 'Timeline',
  titleField: 'title',
  columns: ['date', 'title'],
  description: 'Sorted by date automatically; the site shows the month and year.',
  sortBy: 'date',
  fields: [
    {
      type: 'row',
      fields: [
        monthField(),
        { name: 'title', type: 'text', required: true, admin: { width: '70%' } },
      ],
    },
  ],
})
