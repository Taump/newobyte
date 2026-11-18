import { contentEditorField } from '@/content-blocks/contentEditor'
import { imageField, videoFields } from '@/shared/cms/fields'

import { monthField } from '../fields/month'
import { orderableList } from './orderable'

/** /events — conferences, meetups, webinars. Newest first on the site. */
export const Events = orderableList({
  slug: 'events',
  singular: 'Event',
  plural: 'Events',
  titleField: 'title',
  columns: ['date', 'title'],
  description: 'Sorted by date automatically (newest first); the site shows the month and year.',
  sortBy: '-date',
  fields: [
    {
      type: 'row',
      fields: [
        monthField('MMMM yyyy'),
        { name: 'title', type: 'text', required: true, admin: { width: '70%' } },
      ],
    },
    contentEditorField('content'),
    {
      name: 'images',
      type: 'array',
      labels: { singular: 'Photo', plural: 'Photos' },
      fields: [imageField('image')],
    },
    { name: 'video', type: 'group', fields: [videoFields()] },
  ],
})
