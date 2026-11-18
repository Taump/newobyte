import type { Block } from 'payload'

import { imageField, videoFields } from '@/shared/cms/fields'

import { contentEditorField } from '../contentEditor'

/** Vertical timeline list (old `.fancy-list > .element-block`) on /events and /grants. */
export const EventListBlock: Block = {
  slug: 'eventList',
  interfaceName: 'EventListBlock',
  fields: [
    { name: 'variant', type: 'select', defaultValue: 'events', options: ['events', 'grants'] },
    {
      name: 'items',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'date', type: 'text' },
            { name: 'title', type: 'text', required: true },
          ],
        },
        contentEditorField('content'),
        { name: 'images', type: 'array', fields: [imageField('image')] },
        { name: 'video', type: 'group', fields: [videoFields()] },
      ],
    },
  ],
}
