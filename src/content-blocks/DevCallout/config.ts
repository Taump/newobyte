import type { Block } from 'payload'

import { imageField } from '@/shared/cms/fields'

import { contentEditorField } from '../contentEditor'

/** "Developers" callout with illustration (old `.dev-blog`). */
export const DevCalloutBlock: Block = {
  slug: 'devCallout',
  interfaceName: 'DevCalloutBlock',
  fields: [
    imageField('image', false),
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'text',
          defaultValue: 'Developers',
          admin: { description: 'Small label above the title (leave empty for none)' },
        },
        { name: 'title', type: 'text', required: true },
      ],
    },
    contentEditorField('content'),
    { name: 'white', type: 'checkbox', label: 'White background variant', defaultValue: false },
  ],
}
